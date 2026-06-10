import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ORDER_STATUS, OrderStatus, ACTIVE_STATUSES, PAST_STATUSES, mapBackendStatusToMobile } from '../../../constants/orders';
import { useAuth } from '../../../context/auth-context';
import { RestaurantService } from '../../../services/restaurant-service';
import { OrderCard } from '../../../components/OrderCard';
import { TrackingModal } from '../../../components/TrackingModal';

const DRIVER_PROFILES: Record<string, { name: string; email: string; telefono: string }> = {
  '4': { name: 'Usuario Repartidor', email: 'repartidor@restaurante.com', telefono: '59171355794' },
  '2': { name: 'Pedro Cajero (Cajero / Soporte)', email: 'cajero@restaurante.com', telefono: '59178945612' },
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'activos' | 'historial'>('activos');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [trackingOrderData, setTrackingOrderData] = useState<any>(null);

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    if (showLoading) setIsLoading(true);
    try {
      const data = await RestaurantService.obtenerPedidosDeliveryPorCliente(user.id);
      
      const formatted = data.map((pedido) => {
        const itemsText = pedido.detalles
          .map((d: any) => `${d.cantidad}x ${d.nombreProducto}`)
          .join(', ');

        let dateStr = 'Reciente';
        if (pedido.createdAt) {
          const timestamp = Number(pedido.createdAt);
          const dateObj = !isNaN(timestamp) ? new Date(timestamp) : new Date(pedido.createdAt);
          if (!isNaN(dateObj.getTime())) {
            dateStr = dateObj.toLocaleDateString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        }

        const rep = pedido.repartidorAsignado;
        let repartidorInfo = {
          nombre: 'Asignación automática pendiente',
          telefono: null as string | null,
        };
        if (rep) {
          const profile = DRIVER_PROFILES[rep.id.toString()];
          repartidorInfo = profile 
            ? { nombre: profile.name, telefono: profile.telefono }
            : { nombre: rep.nombre || `Repartidor #${rep.id}`, telefono: (rep as any).telefono || null };
        }

        return {
          id: pedido.id,
          fecha: dateStr,
          items: itemsText,
          subtotal: Number(pedido.subtotal),
          envio: Number(pedido.total) - Number(pedido.subtotal),
          total: Number(pedido.total),
          estado: mapBackendStatusToMobile(pedido.estado),
          repartidor: repartidorInfo,
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

  useEffect(() => {
    if (!trackingOrderId) {
      setTrackingOrderData(null);
      return;
    }
    
    const loadTracking = async () => {
      try {
        const data = await RestaurantService.obtenerPedidoDelivery(trackingOrderId);
        setTrackingOrderData(data);
      } catch (err) {
        console.error('Error fetching live tracking:', err);
      }
    };

    loadTracking();
    const interval = setInterval(loadTracking, 4000);
    return () => clearInterval(interval);
  }, [trackingOrderId]);

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
      case ORDER_STATUS.ASIGNADO:
        return '#FFC107'; // Ámbar
      case ORDER_STATUS.EN_CAMINO:
        return '#2196F3'; // Azul
      case ORDER_STATUS.ENTREGADO:
        return '#4CAF50'; // Verde
      case ORDER_STATUS.CANCELADO:
        return '#D32F2F'; // Rojo
      default:
        return '#9E9E9E'; // Gris
    }
  };

  const STATUS_ICONS: Record<OrderStatus, string> = {
    [ORDER_STATUS.PREPARANDO]: 'hourglass-empty',
    [ORDER_STATUS.ASIGNADO]: 'assignment-ind',
    [ORDER_STATUS.EN_CAMINO]: 'local-shipping',
    [ORDER_STATUS.ENTREGADO]: 'check-circle',
    [ORDER_STATUS.CANCELADO]: 'block',
  };

  const getStatusIcon = (status: OrderStatus) => {
    return (STATUS_ICONS as Record<string, string>)[status] ?? 'help-outline';
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
          <OrderCard
            item={item}
            onTrackPress={setTrackingOrderId}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        )}
      />

      {/* Modal de Seguimiento GPS en Vivo */}
      <TrackingModal
        visible={trackingOrderId !== null}
        trackingOrderId={trackingOrderId}
        onClose={() => setTrackingOrderId(null)}
        trackingOrderData={trackingOrderData}
        driverProfiles={DRIVER_PROFILES}
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
});
