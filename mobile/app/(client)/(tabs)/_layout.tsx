import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCart } from '../../../context/cart-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  const { itemCount } = useCart();

  const CARMESI_COLOR = '#B22222';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: CARMESI_COLOR,
        tabBarInactiveTintColor: '#888',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#B22222',
        },
        headerTintColor: '#fff',
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 75,
          paddingBottom: 16,
          paddingTop: 8,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Carta',
          headerTitle: 'Pollo Carmesí',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="menu" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrito',
          headerTitle: 'Mi Carrito',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <IconSymbol size={26} name="cart.fill" color={color} />
              {itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          headerTitle: 'Mis Pedidos',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Asistente',
          headerTitle: 'Asistente Carmesí',
          tabBarIcon: ({ color }) => <MaterialIcons size={26} name="forum" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          headerTitle: 'Mi Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: 'red',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
