import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { OrderStatus } from '../constants/orders';

interface OrderItem {
  id: string;
  fecha: string;
  items: string;
  subtotal: number;
  envio: number;
  total: number;
  estado: OrderStatus;
  repartidor: {
    nombre: string;
    telefono: string | null;
  };
}

interface OrderCardProps {
  item: OrderItem;
  onTrackPress: (id: string) => void;
  getStatusColor: (status: OrderStatus) => string;
  getStatusIcon: (status: OrderStatus) => string;
}

export function OrderCard({ item, onTrackPress, getStatusColor, getStatusIcon }: OrderCardProps) {
  const openWhatsApp = async (telefono: string) => {
    const cleanPhone = telefono.replace(/[^\d]/g, '');
    const url = `https://wa.me/${cleanPhone}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp o no está instalado.');
    }
  };

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId} numberOfLines={1} ellipsizeMode="tail">
          Pedido #{item.id.substring(0, 8).toUpperCase()}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.estado) + '15' }, // Opaco al 15%
          ]}
        >
          <MaterialIcons
            name={getStatusIcon(item.estado) as any}
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
            <Text style={styles.repartidorText} numberOfLines={2} ellipsizeMode="tail">
              Repartidor: {item.repartidor.nombre}
            </Text>
          </View>
          <View style={styles.trackingActions}>
            {item.repartidor.telefono && (
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() => openWhatsApp(item.repartidor.telefono!)}
              >
                <MaterialIcons name="chat" size={14} color="#fff" />
                <Text style={styles.whatsappButtonText}>Chat</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.trackButton} onPress={() => onTrackPress(item.id)}>
              <Text style={styles.trackButtonText}>Mapa</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    flexShrink: 0,
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
  trackingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  whatsappButton: {
    backgroundColor: '#25D366', // Verde de WhatsApp
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
