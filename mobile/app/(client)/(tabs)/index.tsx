import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useCart } from '../../../context/cart-context';
import { ThemedView } from '@/components/themed-view';
import { RestaurantService, Categoria } from '../../../services/restaurant-service';

export default function MenuScreen() {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategoria, setActiveCategoria] = useState<string | null>(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCats(true);
        const data = await RestaurantService.obtenerCategorias();
        const allCategory: Categoria = { id: 'all', nombre: 'Todos' };
        setCategories([allCategory, ...data]);
        setActiveCategoria('all');
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      } finally {
        setLoadingCats(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!activeCategoria) return;

    const loadProducts = async () => {
      try {
        setLoadingProds(true);
        const catId = activeCategoria === 'all' ? undefined : activeCategoria;
        const data = await RestaurantService.obtenerMenu(catId);
        const mapped = data.map((p) => ({
          ...p,
          imagen: p.imagenUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
        }));
        setProducts(mapped);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoadingProds(false);
      }
    };
    loadProducts();
  }, [activeCategoria]);

  const handleAdd = (item: any) => {
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

  if (loadingCats) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B22222" />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => {
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

      {loadingProds ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#B22222" />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No hay productos en esta categoría</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Image 
                source={{ uri: item.imagen }} 
                style={styles.productImage} 
                resizeMode="cover"
              />
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
      )}
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
    height: '100%',
    minHeight: 110,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FAF9F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#8D6E63',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
