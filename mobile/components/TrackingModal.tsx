import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ActivityIndicator, ScrollView, Animated } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { mapBackendStatusToMobile } from '../constants/orders';

interface TrackingModalProps {
  visible: boolean;
  trackingOrderId: string | null;
  onClose: () => void;
  trackingOrderData: any;
  driverProfiles: Record<string, { name: string; email: string }>;
}

// Calcular distancias Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function TrackingModal({
  visible,
  trackingOrderId,
  onClose,
  trackingOrderData,
  driverProfiles,
}: TrackingModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (visible && trackingOrderData && trackingOrderData.estado !== 'ENTREGADO') {
      const pulseAnimation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 2.2,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.6);
    }
  }, [visible, trackingOrderData?.estado]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seguimiento de Delivery</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
            <ScrollView 
              contentContainerStyle={styles.modalBody} 
              showsVerticalScrollIndicator={false}
            >
              {/* Repartidor Card */}
              <View style={styles.driverLiveCard}>
                <MaterialIcons name="sports-motorsports" size={36} color="#B22222" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverLiveName}>
                    {trackingOrderData.repartidorAsignado
                      ? driverProfiles[String(trackingOrderData.repartidorAsignado.id)]?.name ||
                        trackingOrderData.repartidorAsignado.nombre
                      : 'Buscando repartidor...'}
                  </Text>
                  <Text style={styles.driverLiveStatus}>
                    Estado del pedido: {mapBackendStatusToMobile(trackingOrderData.estado)}
                  </Text>
                </View>
              </View>

              {/* Ruta de Mapa Simulado */}
              {(() => {
                const startLat = -17.784;
                const startLon = -63.183;
                const destLat = Number(trackingOrderData.latitud) || -17.7833;
                const destLon = Number(trackingOrderData.longitud) || -63.1821;

                let repLat = startLat;
                let repLon = startLon;

                if (trackingOrderData.repartidorAsignado?.coordenadasActuales) {
                  const coords = trackingOrderData.repartidorAsignado.coordenadasActuales
                    .split(',')
                    .map(Number);
                  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                    repLat = coords[0];
                    repLon = coords[1];
                  }
                }

                const totalDist = calculateDistance(startLat, startLon, destLat, destLon);
                const remDist = calculateDistance(repLat, repLon, destLat, destLon);

                // Fracción completada
                let progressFraction = totalDist > 0 ? 1 - remDist / totalDist : 0;
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
                          <Animated.View 
                            style={[
                              styles.driverIndicatorPulse,
                              {
                                transform: [{ scale: pulseAnim }],
                                opacity: opacityAnim,
                              }
                            ]} 
                          />
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
                          {currentRemainingDist > 0.05
                            ? `${currentRemainingDist.toFixed(2)} km`
                            : 'Llegando...'}
                        </Text>
                      </View>
                      <View style={styles.telemetryItem}>
                        <Text style={styles.telemetryLabel}>Tiempo Estimado</Text>
                        <Text style={styles.telemetryValue}>
                          {isEntregado
                            ? 'Entregado'
                            : estMinutes > 0
                            ? `${estMinutes} mins`
                            : 'Inmediato'}
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
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    left: 4,
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
