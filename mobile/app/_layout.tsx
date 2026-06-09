import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/auth-context';
import { CartProvider } from '../context/cart-context';

export const unstable_settings = {
  anchor: 'index',
};

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments() as any;
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inClientGroup = segments[0] === '(client)';
    const inDriverGroup = segments[0] === '(driver)';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      if (user.role === 'client') {
        if (inAuthGroup || inDriverGroup || segments.length === 0 || segments[0] === 'index') {
          router.replace('/(client)/(tabs)');
        }
      } else if (user.role === 'driver') {
        if (inAuthGroup || inClientGroup || segments.length === 0 || segments[0] === 'index') {
          router.replace('/(driver)');
        }
      }
    }
  }, [user, isLoading, segments, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(driver)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootLayoutNav />
      </CartProvider>
    </AuthProvider>
  );
}