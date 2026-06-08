import React from 'react';
import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="checkout" 
        options={{ 
          headerShown: true, 
          title: 'Confirmar Pedido',
          headerStyle: { backgroundColor: '#B22222' },
          headerTintColor: '#fff',
        }} 
      />
    </Stack>
  );
}
