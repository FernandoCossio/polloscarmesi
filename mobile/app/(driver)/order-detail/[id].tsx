import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ORDER_STATUS, OrderStatus, mapBackendStatusToMobile } from '../../../constants/orders';
import { RestaurantService } from '../../../services/restaurant-service';
import * as ImagePicker from 'expo-image-picker';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [estado, setEstado] = useState<OrderStatus>(ORDER_STATUS.ASIGNADO);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const fetchOrderDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await RestaurantService.obtenerPedidoDelivery(id);
      
      const formatted = {
        cliente: `Cliente #${data.clienteId}`,
        telefono: '+591 76543210',
        direccion: data.direccionEntrega,
        productos: data.detalles.map((d: any) => ({
          nombre: d.nombreProducto,
          cantidad: d.cantidad,
          precio: Number(d.precioUnitario),
        })),
        subtotal: Number(data.subtotal),
        envio: Number(data.total) - Number(data.subtotal),
        total: Number(data.total),
        pago: 'Efectivo/QR',
        estado: mapBackendStatusToMobile(data.estado),
      };

      setOrder(formatted);
      setEstado(formatted.estado);
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator size="large" color="#5D4037" />
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#D32F2F" />
        <Text style={styles.errorText}>Pedido no encontrado</Text>
      </ThemedView>
    );
  }

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso Requerido', 'Se necesitan permisos de cámara para tomar fotos de evidencia.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleStartDelivery = async () => {
    try {
      setIsLoading(true);
      await RestaurantService.actualizarEstadoDelivery(id, 'EN_CAMINO');
      setEstado(ORDER_STATUS.EN_CAMINO);
      Alert.alert('Entrega Iniciada', 'El pedido ahora está marcado "En camino". El cliente podrá ver tu avance.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo iniciar la entrega');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishDelivery = async () => {
    if (!imageUri) {
      Alert.alert('Evidencia Requerida', 'Por favor, toma una fotografía de evidencia antes de confirmar la entrega.');
      return;
    }

    try {
      setIsLoading(true);
      await RestaurantService.confirmarEntrega(id, imageUri);
      setEstado(ORDER_STATUS.ENTREGADO);
      Alert.alert(
        '¡Entrega Realizada!',
        'Has completado la entrega de este pedido y subido la evidencia exitosamente.',
        [
          {
            text: 'Ok',
            onPress: () => router.replace('/(driver)'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo finalizar la entrega');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Info del Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente y Ubicación</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color="#5D4037" />
              <View>
                <Text style={styles.infoLabel}>Nombre</Text>
                <Text style={styles.infoValue}>{order.cliente}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="#5D4037" />
              <View>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{order.telefono}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color="#5D4037" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Dirección</Text>
                <Text style={styles.infoValue}>{order.direccion}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Productos a Entregar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <View style={styles.card}>
            {order.productos.map((prod: { nombre: string; cantidad: number; precio: number }, index: number) => (
              <View key={index} style={styles.productRow}>
                <Text style={styles.productQty}>{prod.cantidad}x</Text>
                <Text style={styles.productName}>{prod.nombre}</Text>
                <Text style={styles.productPrice}>{prod.precio * prod.cantidad} Bs.</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal Productos</Text>
              <Text style={styles.breakdownValue}>{order.subtotal} Bs.</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Costo de Envío</Text>
              <Text style={styles.breakdownValue}>{order.envio} Bs.</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Monto total a cobrar ({order.pago}):</Text>
              <Text style={styles.totalValue}>{order.total} Bs.</Text>
            </View>
          </View>
        </View>

        {/* Foto de Evidencia */}
        {estado === ORDER_STATUS.EN_CAMINO && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidencia de Entrega</Text>
            <View style={styles.card}>
              {imageUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.evidenceImage} />
                  <TouchableOpacity style={styles.changeImageButton} onPress={handlePickImage}>
                    <MaterialIcons name="photo-camera" size={16} color="#fff" />
                    <Text style={styles.changeImageText}>Volver a tomar foto</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.photoPlaceholder} onPress={handlePickImage}>
                  <MaterialIcons name="photo-camera" size={40} color="#757575" />
                  <Text style={styles.photoPlaceholderText}>Tomar Foto de Evidencia</Text>
                  <Text style={styles.photoSubtext}>(Requerido para finalizar entrega)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Acciones de Entrega */}
        <View style={styles.actionsContainer}>
          {estado === ORDER_STATUS.ASIGNADO && (
            <TouchableOpacity style={styles.startButton} onPress={handleStartDelivery}>
              <MaterialIcons name="navigation" size={22} color="#fff" />
              <Text style={styles.buttonText}>Iniciar Ruta de Entrega</Text>
            </TouchableOpacity>
          )}

          {estado === ORDER_STATUS.EN_CAMINO && (
            <TouchableOpacity style={styles.completeButton} onPress={handleFinishDelivery}>
              <MaterialIcons name="check" size={22} color="#fff" />
              <Text style={styles.buttonText}>Marcar como Entregado</Text>
            </TouchableOpacity>
          )}

          {estado === ORDER_STATUS.ENTREGADO && (
            <View style={styles.deliveredBadge}>
              <MaterialIcons name="verified" size={22} color="#4CAF50" />
              <Text style={styles.deliveredText}>Entregado con éxito</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  scrollContainer: {
    padding: 16,
    gap: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginTop: 12,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
    paddingLeft: 4,
  },
  card: {
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
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#3E2723',
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  productQty: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5D4037',
    minWidth: 24,
  },
  productName: {
    fontSize: 14,
    color: '#3E2723',
    flex: 1,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3E2723',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: '#757575',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D4037',
  },
  actionsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#3F51B5', // Azul para navegación
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
  },
  completeButton: {
    backgroundColor: '#4CAF50', // Verde para completar
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deliveredBadge: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F5E9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  deliveredText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#EEEEEE',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#757575',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoPlaceholder: {
    width: '100%',
    height: 120,
    borderWidth: 1.5,
    borderColor: '#BDBDBD',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    gap: 4,
  },
  photoPlaceholderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  photoSubtext: {
    fontSize: 11,
    color: '#757575',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#757575',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#3E2723',
    fontWeight: '500',
  },
});
