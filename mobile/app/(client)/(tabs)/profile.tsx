import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../context/auth-context';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      {/* Encabezado del Perfil */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="account-circle" size={80} color="#B22222" />
        </View>
        <Text style={styles.userName}>{user?.username || 'Cliente Sabor'}</Text>
        <Text style={styles.userRole}>Cliente Pollo Carmesí</Text>
      </View>

      {/* Detalles del Perfil */}
      <View style={styles.detailsList}>
        <View style={styles.detailItem}>
          <MaterialIcons name="email" size={22} color="#8D6E63" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Correo Electrónico</Text>
            <Text style={styles.detailValue}>cliente@carmesi.com</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="phone" size={22} color="#8D6E63" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Teléfono</Text>
            <Text style={styles.detailValue}>+591 76543210</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="location-on" size={22} color="#8D6E63" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Dirección Guardada</Text>
            <Text style={styles.detailValue}>Av. Busch, Calle 4 #123, Santa Cruz</Text>
          </View>
        </View>
      </View>

      {/* Botón de Cierre de Sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    padding: 20,
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EFEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  userRole: {
    fontSize: 13,
    color: '#8D6E63',
    marginTop: 4,
    fontWeight: '500',
  },
  detailsList: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EFEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    gap: 16,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 14,
    color: '#3E2723',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#B22222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 28,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
