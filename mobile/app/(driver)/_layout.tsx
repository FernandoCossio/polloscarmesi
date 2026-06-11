import React from 'react';
import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#5D4037' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={({ navigation }) => ({ 
          title: 'Entregas Pendientes',
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('history')}>
              <Text style={{ color: '#fff', marginRight: 15, fontWeight: 'bold' }}>Historial</Text>
            </TouchableOpacity>
          )
        })} 
      />
      <Stack.Screen name="history" options={{ title: 'Historial de Entregas' }} />
      <Stack.Screen name="order-detail/[id]" options={{ title: 'Detalle de Entrega' }} />
    </Stack>
  );
}
