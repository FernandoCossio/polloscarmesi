import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../context/auth-context';
import { ThemedView } from '@/components/themed-view';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#B22222" />
      </ThemedView>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role === 'client') {
    return <Redirect href="/(client)/(tabs)" />;
  }

  if (user.role === 'driver') {
    return <Redirect href="/(driver)" />;
  }

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" color="#B22222" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
