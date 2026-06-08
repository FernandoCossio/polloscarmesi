import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ORDER_STATUS, OrderStatus, ACTIVE_STATUSES, PAST_STATUSES } from '../../../constants/orders';

const PEDIDOS_MOCK = [
  {
    id: '1024',
    fecha: 'Hoy, 20:15',
    items: '1x Combo Familiar Carmesí, 1x Papas Fritas Grandes',
    total: 125,
    estado: ORDER_STATUS.EN_CAMINO as OrderStatus,
    repartidor: 'Carlos Gómez',
  },
  {
    id: '1019',
    fecha: 'Ayer, 13:10',
    items: '2x Combo Personal',
    total: 70,
    estado: ORDER_STATUS.ENTREGADO as OrderStatus,
    repartidor: 'Ana Martínez',
  },
  {
    id: '1008',
    fecha: '02 Jun 2026, 21:00',
    items: '1x Pollo Entero Carmesí, 1x Arroz con Queso',
    total: 90,
    estado: ORDER_STATUS.ENTREGADO as OrderStatus,
    repartidor: 'Carlos Gómez',
  },
];

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<'activos' | 'historial'>('activos');

  const filteredOrders = PEDIDOS_MOCK.filter((pedido) => {
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={60} color="#D7CCC8" />
            <Text style={styles.emptyText}>No tienes pedidos en esta sección</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Pedido #{item.id}</Text>
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
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  orderTotalLabel: {
    fontSize: 14,
    color: '#757575',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B22222',
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
