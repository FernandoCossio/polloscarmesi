import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { mapBackendStatusToMobile } from '../../constants/orders';
import { RestaurantService } from '../../services/restaurant-service';

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'mis_entregas' | 'disponibles'>('mis_entregas');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Preparando':
        return '#FF9800'; // Naranja
      case 'Asignado':
        return '#FFC107'; // Ámbar
      case 'En camino':
        return '#2196F3'; // Azul
      case 'Entregado':
        return '#4CAF50'; // Verde
      case 'Cancelado':
        return '#D32F2F'; // Rojo
      default:
        return '#9E9E9E'; // Gris
    }
  };

  const getStatusIcon = (status: string): any => {
    switch (status) {
      case 'Preparando':
        return 'hourglass-empty';
      case 'Asignado':
        return 'assignment-ind';
      case 'En camino':
        return 'local-shipping';
      case 'Entregado':
        return 'check-circle';
      case 'Cancelado':
        return 'block';
      default:
        return 'help-outline';
    }
  };

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    if (showLoading) setIsLoading(true);
    try {
      let data: any[] = [];
      if (activeTab === 'mis_entregas') {
        data = await RestaurantService.obtenerPedidosPorRepartidor(user.id);
      } else {
        data = await RestaurantService.obtenerPedidosDeliverySinAsignar();
      }

      const formatted = data.map((pedido) => {
        const itemsText = pedido.detalles
          .map((d: any) => `${d.cantidad}x ${d.nombreProducto}`)
          .join(', ');

        return {
          id: pedido.id,
          cliente: `Cliente #${pedido.clienteId}`,
          direccion: pedido.direccionEntrega,
          productos: itemsText,
          total: Number(pedido.total),
          pago: 'Efectivo/QR',
          estado: mapBackendStatusToMobile(pedido.estado),
        };
      });

      setOrders(formatted);
    } catch (err) {
      console.error('Error fetching driver orders:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  const handleAcceptOrder = async (pedidoId: string) => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      await RestaurantService.asignarRepartidor(pedidoId, user.id);
      Alert.alert('Pedido Asignado', 'Has aceptado el pedido. Ahora aparecerá en "Mis Entregas".');
      setActiveTab('mis_entregas');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo asignar el pedido');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color="#5D4037" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header Info */}
      <View style={styles.driverBar}>
        <View style={styles.driverInfo}>
          <MaterialIcons name="sports-motorsports" size={24} color="#5D4037" />
          <Text style={styles.driverName}>Hola, {user?.username || 'Repartidor'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialIcons name="logout" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      {/* Selector de Pestañas */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mis_entregas' && styles.activeTab]}
          onPress={() => setActiveTab('mis_entregas')}
        >
          <Text style={[styles.tabText, activeTab === 'mis_entregas' && styles.activeTabText]}>
            Mis Entregas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'disponibles' && styles.activeTab]}
          onPress={() => setActiveTab('disponibles')}
        >
          <Text style={[styles.tabText, activeTab === 'disponibles' && styles.activeTabText]}>
            Disponibles
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Pedidos a Entregar */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#5D4037']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment-turned-in" size={60} color="#D7CCC8" />
            <Text style={styles.emptyText}>No hay entregas disponibles</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId} numberOfLines={1} ellipsizeMode="tail">
                Pedido #{item.id.substring(0, 8).toUpperCase()}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) + '15' }]}>
                <MaterialIcons name={getStatusIcon(item.estado)} size={12} color={getStatusColor(item.estado)} />
                <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
                  {item.estado}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={16} color="#757575" />
              <Text style={styles.infoText}>{item.cliente}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={16} color="#757575" />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.direccion}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderFooter}>
              <View>
                <Text style={styles.totalLabel}>Cobro ({item.pago}):</Text>
                <Text style={styles.totalValue}>{item.total} Bs.</Text>
              </View>
              
              {activeTab === 'mis_entregas' ? (
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => router.push(`/(driver)/order-detail/${item.id}`)}
                >
                  <Text style={styles.detailButtonText}>Ver Detalles</Text>
                  <MaterialIcons name="chevron-right" size={16} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.detailButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleAcceptOrder(item.id)}
                >
                  <Text style={styles.detailButtonText}>Aceptar Pedido</Text>
                  <MaterialIcons name="check" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  logoutButton: {
    padding: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#5D4037',
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#888',
  },
  activeTabText: {
    color: '#5D4037',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EFEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    gap: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: '#757575',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D4037',
  },
  detailButton: {
    backgroundColor: '#5D4037',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
