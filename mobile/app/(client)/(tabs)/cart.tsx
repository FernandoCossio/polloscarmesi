import React from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useCart } from '../../../context/cart-context';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CartScreen() {
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <MaterialIcons name="shopping-basket" size={80} color="#D7CCC8" />
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptySubtitle}>Agrega algunos combos o pollos de la carta para empezar.</Text>
        <Link href="/(client)/(tabs)" asChild>
          <TouchableOpacity style={styles.browseButton}>
            <Text style={styles.browseButtonText}>Ver Carta</Text>
          </TouchableOpacity>
        </Link>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image source={{ uri: item.imagen }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <MaterialIcons name="delete-outline" size={22} color="#D32F2F" />
                </TouchableOpacity>
              </View>
              <Text style={styles.itemPrice}>{item.precio} Bs.</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, item.cantidad - 1)}
                >
                  <MaterialIcons name="remove" size={16} color="#3E2723" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.cantidad}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.id, item.cantidad + 1)}
                >
                  <MaterialIcons name="add" size={16} color="#3E2723" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total a pagar:</Text>
          <Text style={styles.summaryValue}>{cartTotal} Bs.</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push('/(client)/checkout')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutButtonText}>Continuar al Pago</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAF9F6',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E2723',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  browseButton: {
    backgroundColor: '#B22222',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EFEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
    maxWidth: '85%',
  },
  itemPrice: {
    fontSize: 14,
    color: '#B22222',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  quantityButton: {
    backgroundColor: '#F3F2EC',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E2723',
    minWidth: 16,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#65635C',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#B22222',
  },
  checkoutButton: {
    backgroundColor: '#B22222',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
