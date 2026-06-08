import React from 'react';
import { Stack } from 'expo-router';

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#5D4037' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Entregas Pendientes' }} />
      <Stack.Screen name="order-detail/[id]" options={{ title: 'Detalle de Entrega' }} />
    </Stack>
  );
}
