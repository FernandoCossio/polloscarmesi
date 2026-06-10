import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal } from 'react-native';
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

            {(item.estado === 'Preparando' || item.estado === 'Asignado' || item.estado === 'En camino') && (
              <View style={styles.trackingContainer}>
                <View style={styles.repartidorInfo}>
                  <MaterialIcons name="person" size={18} color="#8D6E63" />
                  <Text style={styles.repartidorText}>Repartidor: {item.repartidor}</Text>
                </View>
                <TouchableOpacity style={styles.trackButton} onPress={() => setTrackingOrderId(item.id)}>
                  <Text style={styles.trackButtonText}>Ver Mapa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      {/* Modal de Seguimiento GPS en Vivo */}
      <Modal
        visible={trackingOrderId !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTrackingOrderId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seguimiento de Delivery</Text>
              <TouchableOpacity onPress={() => setTrackingOrderId(null)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#3E2723" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {!trackingOrderData ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#B22222" />
                <Text style={styles.loadingText}>Conectando con el satélite GPS...</Text>
              </View>
            ) : (
              <View style={styles.modalBody}>
                {/* Repartidor Card */}
                <View style={styles.driverLiveCard}>
                  <MaterialIcons name="sports-motorsports" size={36} color="#B22222" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverLiveName}>
                      {trackingOrderData.repartidorAsignado
                        ? DRIVER_PROFILES[trackingOrderData.repartidorAsignado.id]?.name || trackingOrderData.repartidorAsignado.nombre
                        : 'Buscando repartidor...'}
                    </Text>
                    <Text style={styles.driverLiveStatus}>
                      Estado del pedido: {mapBackendStatusToMobile(trackingOrderData.estado)}
                    </Text>
                  </View>
                </View>

                {/* Ruta de Mapa Simulado */}
                {(() => {
                  const startLat = -17.7840;
                  const startLon = -63.1830;
                  const destLat = Number(trackingOrderData.latitud) || -17.7833;
                  const destLon = Number(trackingOrderData.longitud) || -63.1821;
                  
                  let repLat = startLat;
                  let repLon = startLon;

                  if (trackingOrderData.repartidorAsignado?.coordenadasActuales) {
                    const coords = trackingOrderData.repartidorAsignado.coordenadasActuales.split(',').map(Number);
                    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                      repLat = coords[0];
                      repLon = coords[1];
                    }
                  }

                  // Calcular distancias Haversine
                  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                    const R = 6371; // km
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a =
                      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return R * c;
                  };

                  const totalDist = calculateDistance(startLat, startLon, destLat, destLon);
                  const remDist = calculateDistance(repLat, repLon, destLat, destLon);
                  
                  // Fracción completada
                  let progressFraction = totalDist > 0 ? 1 - (remDist / totalDist) : 0;
                  progressFraction = Math.max(0, Math.min(1, progressFraction));
                  
                  // Si el estado es ENTREGADO, la barra se completa al 100%
                  const isEntregado = trackingOrderData.estado === 'ENTREGADO';
                  const displayPercent = isEntregado ? 100 : progressFraction * 100;
                  const currentRemainingDist = isEntregado ? 0 : remDist;
                  const estMinutes = Math.ceil(currentRemainingDist * 3.5);

                  return (
                    <View style={styles.mapSimulationContainer}>
                      <Text style={styles.mapLabel}>Ruta: Sucursal ➔ Dirección de Entrega</Text>
                      
                      {/* Dibuja la línea horizontal */}
                      <View style={styles.mapTrackLine}>
                        {/* Icono de Tienda a la izquierda */}
                        <View style={[styles.mapNode, styles.mapNodeLeft]}>
                          <MaterialIcons name="store" size={20} color="#5D4037" />
                          <Text style={styles.mapNodeText}>Restaurante</Text>
                        </View>

                        {/* Icono de Motorizado en movimiento */}
                        <View style={[styles.mapDriverNode, { left: `${displayPercent}%` }]}>
                          <MaterialIcons name="delivery-dining" size={24} color="#B22222" />
                          {!isEntregado && (
                            <View style={styles.driverIndicatorPulse} />
                          )}
                        </View>

                        {/* Icono de Casa a la derecha */}
                        <View style={[styles.mapNode, styles.mapNodeRight]}>
                          <MaterialIcons name="home" size={20} color="#5D4037" />
                          <Text style={styles.mapNodeText}>Tu Casa</Text>
                        </View>
                      </View>

                      {/* Información de Telemetría */}
                      <View style={styles.telemetryCard}>
                        <View style={styles.telemetryItem}>
                          <Text style={styles.telemetryLabel}>Distancia Restante</Text>
                          <Text style={styles.telemetryValue}>
                            {currentRemainingDist > 0.05 ? `${currentRemainingDist.toFixed(2)} km` : 'Llegando...'}
                          </Text>
                        </View>
                        <View style={styles.telemetryItem}>
                          <Text style={styles.telemetryLabel}>Tiempo Estimado</Text>
                          <Text style={styles.telemetryValue}>
                            {isEntregado ? 'Entregado' : estMinutes > 0 ? `${estMinutes} mins` : 'Inmediato'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* Dirección y Destino */}
                <View style={styles.addressContainer}>
                  <Text style={styles.addressLabel}>Dirección de Entrega:</Text>
                  <Text style={styles.addressValue}>{trackingOrderData.direccionEntrega}</Text>
                  {trackingOrderData.referencia && (
                    <Text style={styles.addressRef}>Referencia: {trackingOrderData.referencia}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    flex: 1,
    marginRight: 8,
  },
  repartidorText: {
    fontSize: 12,
    color: '#5D4037',
    fontWeight: 'bold',
    flex: 1,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FAF9F6',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 16,
      maxHeight: '80%',
      gap: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
      paddingBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#3E2723',
    },
    closeButton: {
      padding: 4,
    },
    modalLoading: {
      paddingVertical: 60,
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: '#757575',
    },
    modalBody: {
      gap: 16,
      paddingBottom: 20,
    },
    driverLiveCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: '#F0EFEA',
    },
    driverLiveName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#3E2723',
    },
    driverLiveStatus: {
      fontSize: 12,
      color: '#757575',
      marginTop: 2,
    },
    mapSimulationContainer: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: '#F0EFEA',
      gap: 16,
    },
    mapLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#8D6E63',
      textTransform: 'uppercase',
    },
    mapTrackLine: {
      height: 60,
      justifyContent: 'center',
      position: 'relative',
      marginHorizontal: 20,
      borderBottomWidth: 2,
      borderBottomColor: '#D7CCC8',
      borderStyle: 'dashed',
      marginBottom: 24,
    },
    mapNode: {
      position: 'absolute',
      bottom: -32,
      alignItems: 'center',
      width: 80,
    },
    mapNodeLeft: {
      left: -40,
    },
    mapNodeRight: {
      right: -40,
    },
    mapNodeText: {
      fontSize: 10,
      color: '#757575',
      marginTop: 4,
      fontWeight: '500',
    },
    mapDriverNode: {
      position: 'absolute',
      bottom: 2,
      marginLeft: -12,
      alignItems: 'center',
      zIndex: 10,
    },
    driverIndicatorPulse: {
      position: 'absolute',
      top: 4,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: 'rgba(178, 34, 34, 0.2)',
      zIndex: -1,
    },
    telemetryCard: {
      flexDirection: 'row',
      backgroundColor: '#FAF9F6',
      borderRadius: 12,
      padding: 10,
      gap: 10,
    },
    telemetryItem: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    telemetryLabel: {
      fontSize: 10,
      color: '#9E9E9E',
      textTransform: 'uppercase',
    },
    telemetryValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#B22222',
    },
    addressContainer: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: '#F0EFEA',
      gap: 4,
    },
    addressLabel: {
      fontSize: 11,
      color: '#9E9E9E',
      textTransform: 'uppercase',
    },
    addressValue: {
      fontSize: 13,
      color: '#3E2723',
      fontWeight: '500',
    },
    addressRef: {
      fontSize: 12,
      color: '#757575',
      marginTop: 2,
      fontStyle: 'italic',
    },
  });
