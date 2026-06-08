import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ORDER_STATUS, OrderStatus } from '../../../constants/orders';

const ORDERS_DATABASE = {
  '1024': {
    cliente: 'Fernando Cossio',
    telefono: '+591 76543210',
    direccion: 'Av. Busch, Calle 4 #123, Santa Cruz',
    productos: [
      { nombre: 'Combo Familiar Carmesí', cantidad: 1, precio: 110 },
      { nombre: 'Papas Fritas Grandes', cantidad: 1, precio: 15 },
    ],
    total: 125,
    pago: 'Efectivo',
    estadoInicial: ORDER_STATUS.ASIGNADO as OrderStatus,
  },
  '1025': {
    cliente: 'Maria Rojas',
    telefono: '+591 78945612',
    direccion: 'Av. Banzer, Cond. Sevilla #22, Santa Cruz',
    productos: [
      { nombre: 'Combo Personal', cantidad: 1, precio: 35 },
      { nombre: 'Coca-Cola 2 Litros', cantidad: 1, precio: 15 },
    ],
    total: 50,
    pago: 'QR Code',
    estadoInicial: ORDER_STATUS.ASIGNADO as OrderStatus,
  },
};

type OrderIdType = keyof typeof ORDERS_DATABASE;

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const order = ORDERS_DATABASE[id as OrderIdType];

  const [estado, setEstado] = useState<OrderStatus>(ORDER_STATUS.ASIGNADO);

  if (!order) {
    return (
      <ThemedView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#D32F2F" />
        <Text style={styles.errorText}>Pedido no encontrado</Text>
      </ThemedView>
    );
  }

  const handleStartDelivery = () => {
    setEstado(ORDER_STATUS.EN_CAMINO);
    Alert.alert('Entrega Iniciada', 'El pedido ahora está marcado "En camino". El cliente podrá rastrearte.');
  };

  const handleFinishDelivery = () => {
    setEstado(ORDER_STATUS.ENTREGADO);
    Alert.alert(
      '¡Entrega Realizada!',
      'Has completado la entrega de este pedido exitosamente.',
      [
        {
          text: 'Ok',
          onPress: () => router.replace('/(driver)'),
        },
      ]
    );
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
            {order.productos.map((prod, index) => (
              <View key={index} style={styles.productRow}>
                <Text style={styles.productQty}>{prod.cantidad}x</Text>
                <Text style={styles.productName}>{prod.nombre}</Text>
                <Text style={styles.productPrice}>{prod.precio * prod.cantidad} Bs.</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Monto total a cobrar ({order.pago}):</Text>
              <Text style={styles.totalValue}>{order.total} Bs.</Text>
            </View>
          </View>
        </View>

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
});
