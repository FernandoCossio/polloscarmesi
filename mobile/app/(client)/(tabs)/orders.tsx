import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ORDER_STATUS, OrderStatus, ACTIVE_STATUSES, PAST_STATUSES, mapBackendStatusToMobile } from '../../../constants/orders';
import { useAuth } from '../../../context/auth-context';
import { RestaurantService } from '../../../services/restaurant-service';

// Mapeo amigable de los repartidores de desarrollo
const DRIVER_PROFILES: Record<string, { name: string; email: string }> = {
  '3': { name: 'Juan Pérez (Repartidor Principal)', email: 'repartidor@restaurante.com' },
  '4': { name: 'Pedro Cajero (Cajero / Soporte)', email: 'cajero@restaurante.com' },
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'activos' | 'historial'>('activos');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    if (showLoading) setIsLoading(true);
    try {
      const data = await RestaurantService.obtenerPedidosDeliveryPorCliente(user.id);
      
      const formatted = data.map((pedido) => {
        const itemsText = pedido.detalles
          .map((d: any) => `${d.cantidad}x ${d.nombreProducto}`)
          .join(', ');

        const dateStr = pedido.createdAt
          ? new Date(pedido.createdAt).toLocaleDateString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Reciente';

        const rep = pedido.repartidorAsignado;
        let repartidorText = 'Asignación automática pendiente';
        if (rep) {
          const profile = DRIVER_PROFILES[rep.id.toString()];
          repartidorText = profile 
            ? `${profile.name} (${profile.email})` 
            : (rep.nombre || `Repartidor #${rep.id}`);
        }

        return {
          id: pedido.id,
          fecha: dateStr,
          items: itemsText,
          subtotal: Number(pedido.subtotal),
          envio: Number(pedido.total) - Number(pedido.subtotal),
          total: Number(pedido.total),
          estado: mapBackendStatusToMobile(pedido.estado),
          repartidor: repartidorText,
        };
      });

      setOrders(formatted);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  const filteredOrders = orders.filter((pedido) => {
    if (activeTab === 'activos') {
      return ACTIVE_STATUSES.includes(pedido.estado);
    }
    return PAST_STATUSES.includes(pedido.estado);
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case ORDER_STATUS.PREPARANDO:
        return '#FF9800'; // Naranja
      case ORDER_STATUS.EN_CAMINO:
        return '#2196F3'; // Azul
      case ORDER_STATUS.ENTREGADO:
        return '#4CAF50'; // Verde
      default:
        return '#9E9E9E'; // Gris
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case ORDER_STATUS.PREPARANDO:
        return 'local-fire-department';
      case ORDER_STATUS.EN_CAMINO:
        return 'delivery-dining';
      case ORDER_STATUS.ENTREGADO:
        return 'check-circle';
      default:
        return 'cancel';
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color="#B22222" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Selector de Pestañas */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activos' && styles.activeTab]}
          onPress={() => setActiveTab('activos')}
        >
          <Text style={[styles.tabText, activeTab === 'activos' && styles.activeTabText]}>
            Activos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'historial' && styles.activeTab]}
          onPress={() => setActiveTab('historial')}
        >
          <Text style={[styles.tabText, activeTab === 'historial' && styles.activeTabText]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Pedidos */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#B22222']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={60} color="#D7CCC8" />
            <Text style={styles.emptyText}>No tienes pedidos en esta sección</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Pedido #{item.id.slice(0, 8)}...</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.estado) + '15' }, // Opaco
                ]}
              >
                <MaterialIcons
                  name={getStatusIcon(item.estado)}
                  size={14}
                  color={getStatusColor(item.estado)}
                />
                <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
                  {item.estado}
                </Text>
              </View>
            </View>

            <Text style={styles.orderDate}>{item.fecha}</Text>
            <Text style={styles.orderItems}>{item.items}</Text>

            <View style={styles.breakdownContainer}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Subtotal</Text>
                <Text style={styles.breakdownValue}>{item.subtotal} Bs.</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Costo de Envío</Text>
                <Text style={styles.breakdownValue}>{item.envio} Bs.</Text>
              </View>
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.orderTotalLabel}>Total:</Text>
              <Text style={styles.orderTotalValue}>{item.total} Bs.</Text>
            </View>

            {item.estado === 'En camino' && (
              <View style={styles.trackingContainer}>
                <View style={styles.repartidorInfo}>
                  <MaterialIcons name="person" size={18} color="#8D6E63" />
                  <Text style={styles.repartidorText}>Repartidor: {item.repartidor}</Text>
                </View>
                <TouchableOpacity style={styles.trackButton}>
                  <Text style={styles.trackButtonText}>Ver Mapa</Text>
                </TouchableOpacity>
              </View>
            )}
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
    justifyContent: 'center',
    alignItems: 'center',
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
    borderBottomColor: '#B22222',
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#888',
  },
  activeTabText: {
    color: '#B22222',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
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
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
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
  orderDate: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  orderItems: {
    fontSize: 14,
    color: '#555',
    marginVertical: 12,
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  orderTotalLabel: {
    fontSize: 14,
    color: '#3E2723',
    fontWeight: 'bold',
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B22222',
  },
  breakdownContainer: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 10,
    marginTop: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#757575',
  },
  breakdownValue: {
    fontSize: 12,
    color: '#3E2723',
    fontWeight: '500',
  },
  trackingContainer: {
    marginTop: 16,
    backgroundColor: '#FBE9E7',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repartidorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repartidorText: {
    fontSize: 12,
    color: '#5D4037',
    fontWeight: 'bold',
  },
  trackButton: {
    backgroundColor: '#B22222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
