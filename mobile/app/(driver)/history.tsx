import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/auth-context';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { mapBackendStatusToMobile } from '../../constants/orders';
import { RestaurantService } from '../../services/restaurant-service';

export default function DriverHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    if (showLoading) setIsLoading(true);
    try {
      const data = await RestaurantService.obtenerPedidosPorRepartidor(user.id);
      
      const historyData = (data || []).filter((o: any) => o.estado === 'ENTREGADO');

      const formatted = historyData.map((pedido: any) => {
        const itemsText = (pedido.detalles || [])
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
          fechaCreacion: pedido.fechaCreacion,
          fechaEntrega: pedido.fechaEntrega
        };
      });

      // Ordenar por fecha de entrega más reciente si es posible
      formatted.sort((a, b) => {
        const dateA = a.fechaEntrega ? new Date(a.fechaEntrega).getTime() : 0;
        const dateB = b.fechaEntrega ? new Date(b.fechaEntrega).getTime() : 0;
        return dateB - dateA; // Descendente
      });

      setOrders(formatted);
    } catch (err) {
      console.error('Error fetching driver history:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory(false);
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
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#5D4037']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={60} color="#D7CCC8" />
            <Text style={styles.emptyText}>No tienes entregas finalizadas aún</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId} numberOfLines={1} ellipsizeMode="tail">
                Pedido #{item.id.substring(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.orderStatus}>{item.estado}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={16} color="#757575" />
              <Text style={styles.infoText}>{item.cliente}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="shopping-bag" size={16} color="#757575" />
              <Text style={styles.infoText} numberOfLines={2}>
                {item.productos}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderFooter}>
              <View>
                <Text style={styles.totalLabel}>Cobro Total:</Text>
                <Text style={styles.totalValue}>{item.total} Bs.</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
              </View>
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
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  orderStatus: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#616161',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B22222',
  },
});
