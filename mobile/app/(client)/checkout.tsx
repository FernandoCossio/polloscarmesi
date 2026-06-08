import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/cart-context';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CheckoutScreen() {
  const { items, cartTotal, clearCart } = useCart();
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'qr' | 'tarjeta'>('efectivo');
  const router = useRouter();

  const handleConfirm = () => {
    Alert.alert(
      '¡Pedido Confirmado!',
      'Tu pedido ha sido registrado con éxito. En un momento un repartidor se pondrá en marcha.',
      [
        {
          text: 'Ok',
          onPress: () => {
            clearCart();
            router.replace('/(client)/(tabs)/orders');
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Dirección de Entrega */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dirección de Entrega</Text>
          <View style={styles.addressCard}>
            <MaterialIcons name="location-on" size={24} color="#B22222" />
            <View style={styles.addressDetails}>
              <Text style={styles.addressTitle}>Mi Casa</Text>
              <Text style={styles.addressText}>Av. Busch, Calle 4 #123, Santa Cruz</Text>
            </View>
          </View>
        </View>

        {/* Resumen del Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Productos</Text>
          <View style={styles.summaryCard}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.cantidad}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.itemPrice}>{item.precio * item.cantidad} Bs.</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{cartTotal} Bs.</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Costo de Envío</Text>
              <Text style={styles.totalValue}>10 Bs.</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total a Pagar</Text>
              <Text style={styles.grandTotalValue}>{cartTotal + 10} Bs.</Text>
            </View>
          </View>
        </View>

        {/* Método de Pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Pago</Text>
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[styles.methodCard, metodoPago === 'efectivo' && styles.activeMethod]}
              onPress={() => setMetodoPago('efectivo')}
            >
              <MaterialIcons
                name="payments"
                size={28}
                color={metodoPago === 'efectivo' ? '#B22222' : '#8D6E63'}
              />
              <Text style={[styles.methodText, metodoPago === 'efectivo' && styles.activeMethodText]}>
                Efectivo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodCard, metodoPago === 'qr' && styles.activeMethod]}
              onPress={() => setMetodoPago('qr')}
            >
              <MaterialIcons
                name="qr-code-2"
                size={28}
                color={metodoPago === 'qr' ? '#B22222' : '#8D6E63'}
              />
              <Text style={[styles.methodText, metodoPago === 'qr' && styles.activeMethodText]}>
                Código QR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodCard, metodoPago === 'tarjeta' && styles.activeMethod]}
              onPress={() => setMetodoPago('tarjeta')}
            >
              <MaterialIcons
                name="credit-card"
                size={28}
                color={metodoPago === 'tarjeta' ? '#B22222' : '#8D6E63'}
              />
              <Text style={[styles.methodText, metodoPago === 'tarjeta' && styles.activeMethodText]}>
                Tarjeta
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón de Confirmación */}
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.8}>
          <Text style={styles.confirmButtonText}>Confirmar Pedido - {cartTotal + 10} Bs.</Text>
        </TouchableOpacity>
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
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
    paddingLeft: 4,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EFEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  addressDetails: {
    marginLeft: 12,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  addressText: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  summaryCard: {
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
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B22222',
    minWidth: 24,
  },
  itemName: {
    fontSize: 14,
    color: '#3E2723',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3E2723',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#757575',
  },
  totalValue: {
    fontSize: 14,
    color: '#3E2723',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B22222',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 10,
  },
  methodCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EFEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    gap: 6,
  },
  activeMethod: {
    borderColor: '#B22222',
    backgroundColor: '#FFF8F8',
  },
  methodText: {
    fontSize: 12,
    color: '#8D6E63',
    fontWeight: '500',
  },
  activeMethodText: {
    color: '#B22222',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#B22222',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
