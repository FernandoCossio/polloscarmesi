import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ORDER_STATUS, OrderStatus } from '../../constants/orders';

const ENTREGAS_MOCK = [
  {
    id: '1024',
    cliente: 'Fernando Cossio',
    direccion: 'Av. Busch, Calle 4 #123, Santa Cruz',
    productos: '1x Combo Familiar Carmesí, 1x Papas Fritas Grandes',
    total: 125,
    pago: 'Efectivo',
    estado: ORDER_STATUS.ASIGNADO as OrderStatus,
  },
  {
    id: '1025',
    cliente: 'Maria Rojas',
    direccion: 'Av. Banzer, Cond. Sevilla #22, Santa Cruz',
    productos: '1x Combo Personal, 1x Coca-Cola 2L',
    total: 50,
    pago: 'QR Code',
    estado: ORDER_STATUS.ASIGNADO as OrderStatus,
  },
];

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* Header Info */}
      <View style={styles.driverBar}>
        <View style={styles.driverInfo}>
          <MaterialIcons name="sports-motorsports" size={24} color="#5D4037" />
          <Text style={styles.driverName}>Hola, {user?.username || 'Repartidor'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialIcons name="logout" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      {/* Lista de Pedidos a Entregar */}
      <FlatList
        data={ENTREGAS_MOCK}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment-turned-in" size={60} color="#D7CCC8" />
            <Text style={styles.emptyText}>No hay entregas disponibles</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Pedido #{item.id}</Text>
              <Text style={styles.orderStatus}>{item.estado}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={16} color="#757575" />
              <Text style={styles.infoText}>{item.cliente}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={16} color="#757575" />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.direccion}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderFooter}>
              <View>
                <Text style={styles.totalLabel}>Cobro ({item.pago}):</Text>
                <Text style={styles.totalValue}>{item.total} Bs.</Text>
              </View>
              <TouchableOpacity
                style={styles.detailButton}
                onPress={() => router.push(`/(driver)/order-detail/${item.id}`)}
              >
                <Text style={styles.detailButtonText}>Ver Detalles</Text>
                <MaterialIcons name="chevron-right" size={16} color="#fff" />
              </TouchableOpacity>
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
  driverBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  logoutButton: {
    padding: 6,
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
    gap: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: '#757575',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D4037',
  },
  detailButton: {
    backgroundColor: '#5D4037',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
