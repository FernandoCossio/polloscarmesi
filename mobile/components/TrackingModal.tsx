import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { mapBackendStatusToMobile } from '../constants/orders';
import { MapSimulation } from './MapSimulation';

interface TrackingModalProps {
  visible: boolean;
  trackingOrderId: string | null;
  onClose: () => void;
  trackingOrderData: any;
  driverProfiles: Record<string, { name: string; email: string }>;
}

export function TrackingModal({
  visible,
  trackingOrderId,
  onClose,
  trackingOrderData,
  driverProfiles,
}: TrackingModalProps) {
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
              <MapSimulation
                estado={trackingOrderData.estado}
                latitud={trackingOrderData.latitud}
                longitud={trackingOrderData.longitud}
                repartidorCoordenadasActuales={trackingOrderData.repartidorAsignado?.coordenadasActuales}
                showSimulationHeader={false}
              />

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
