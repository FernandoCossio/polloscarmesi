import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../../context/cart-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

const CATEGORIAS = [
  { id: '1', nombre: 'Combos', icon: 'local_fire_department' },
  { id: '2', nombre: 'Pollos', icon: 'restaurant' },
  { id: '3', nombre: 'Acompañamientos', icon: 'lunch_dining' },
  { id: '4', nombre: 'Bebidas', icon: 'local_cafe' },
];

const PRODUCTOS = [
  {
    id: 'p1',
    nombre: 'Combo Familiar Carmesí',
    descripcion: '1 Pollo Entero a la Brasa + Porción de Papas Fritas Grandes + Ensalada + Gaseosa 2L.',
    precio: 110,
    categoriaId: '1',
    imagen: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&q=80',
  },
  {
    id: 'p2',
    nombre: 'Combo Personal',
    descripcion: '1/4 de Pollo a la Brasa + Porción de Papas Fritas Medianas + Gaseosa Personal.',
    precio: 35,
    categoriaId: '1',
    imagen: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  },
  {
    id: 'p3',
    nombre: 'Pollo Entero Carmesí',
    descripcion: 'Pollo entero sazonado a las brasas con nuestra receta secreta y condimentos especiales.',
    precio: 70,
    categoriaId: '2',
    imagen: 'https://images.unsplash.com/photo-1598103442097-8b743e4b35c6?w=400&q=80',
  },
  {
    id: 'p4',
    nombre: 'Medio Pollo Carmesí',
    descripcion: 'Medio pollo dorado al carbón, tierno y jugoso.',
    precio: 40,
    categoriaId: '2',
    imagen: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80',
  },
  {
    id: 'p5',
    nombre: 'Papas Fritas Grandes',
    descripcion: 'Papas fritas cortadas a mano de la casa, súper crujientes.',
    precio: 15,
    categoriaId: '3',
    imagen: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
  },
  {
    id: 'p6',
    nombre: 'Arroz con Queso',
    descripcion: 'Arroz cremoso tradicional con abundante queso fundido.',
    precio: 20,
    categoriaId: '3',
    imagen: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80',
  },
  {
    id: 'p7',
    nombre: 'Coca-Cola 2 Litros',
    descripcion: 'Gaseosa refrescante tamaño familiar.',
    precio: 15,
    categoriaId: '4',
    imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
  },
  {
    id: 'p8',
    nombre: 'Chicha Morada de la Casa',
    descripcion: 'Jarra de chicha tradicional hervida con piña, manzana y canela.',
    precio: 18,
    categoriaId: '4',
    imagen: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80',
  },
];

export default function MenuScreen() {
  const [activeCategoria, setActiveCategoria] = useState('1');
  const { addToCart } = useCart();

  const handleAdd = (item: typeof PRODUCTOS[0]) => {
    addToCart(
      {
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        imagen: item.imagen,
      },
      1
    );
  };

  const filteredProducts = PRODUCTOS.filter((p) => p.categoriaId === activeCategoria);

  return (
    <ThemedView style={styles.container}>
      {/* Selector de Categorías Horizontal */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIAS.map((cat) => {
            const isActive = cat.id === activeCategoria;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, isActive && styles.activeCategoryCard]}
                onPress={() => setActiveCategoria(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, isActive && styles.activeCategoryText]}>
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Productos */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <Image source={{ uri: item.imagen }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{item.nombre}</Text>
              <Text style={styles.productDesc} numberOfLines={2}>
                {item.descripcion}
              </Text>
              <View style={styles.productFooter}>
                <Text style={styles.productPrice}>{item.precio} Bs.</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAdd(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addButtonText}>Agregar</Text>
                </TouchableOpacity>
              </View>
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
  categoriesWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EFEA',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F2EC',
    borderWidth: 1,
    borderColor: '#E6E5DF',
  },
  activeCategoryCard: {
    backgroundColor: '#B22222',
    borderColor: '#901A1A',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#65635C',
  },
  activeCategoryText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0EFEA',
  },
  productImage: {
    width: 110,
    height: 110,
  },
  productDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  productDesc: {
    fontSize: 12,
    color: '#757575',
    marginVertical: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B22222',
  },
  addButton: {
    backgroundColor: '#8D6E63',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
