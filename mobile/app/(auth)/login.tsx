import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MobileRole } from '../../constants/roles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [loadingRole, setLoadingRole] = useState<MobileRole | null>(null);
  const router = useRouter();

  const handleLogin = async (role: MobileRole) => {
    setLoadingRole(role);
    try {
      const username = email ? email.split('@')[0] : role === 'client' ? 'Fernando' : 'Carlos';
      await login(username, role);
      router.replace('/');
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.brandSection}>
        {/* Logo */}
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logoImage}
        />
        <Text style={styles.brandName}>
          Pollo Carmesí
          </Text>
        <Text style={styles.brandSlogan}>
          El sabor que te apasiona
          </Text>
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color="#8D6E63" style={styles.inputIcon} />
          <TextInput
            placeholder="Correo Electrónico"
            placeholderTextColor="#A18F8C"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="#8D6E63" style={styles.inputIcon} />
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#A18F8C"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.buttonsContainer}>
          {/* Botón para Cliente */}
          <TouchableOpacity
            style={[styles.loginButton, styles.clientButton]}
            onPress={() => handleLogin('client')}
            disabled={loadingRole !== null}
            activeOpacity={0.8}
          >
            {loadingRole === 'client' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="shopping-bag" size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  Ingresar Cliente
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Botón para Repartidor */}
          <TouchableOpacity
            style={[styles.loginButton, styles.driverButton]}
            onPress={() => handleLogin('driver')}
            disabled={loadingRole !== null}
            activeOpacity={0.8}
          >
            {loadingRole === 'driver' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="delivery-dining" size={22} color="#fff" />
                <Text style={styles.buttonText}>
                  Ingresar Repartidor
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ¿No tienes cuenta?
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.registerLink}>
                Regístrate aquí
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    padding: 24,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3E2723',
    letterSpacing: 0.5,
  },
  brandSlogan: {
    fontSize: 14,
    color: '#8D6E63',
    fontStyle: 'italic',
  },
  formSection: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E5DF',
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#3E2723',
  },
  buttonsContainer: {
    gap: 12,
    marginTop: 10,
  },
  loginButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  clientButton: {
    backgroundColor: '#B22222',
  },
  driverButton: {
    backgroundColor: '#8D6E63',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#757575',
    fontSize: 14,
  },
  registerLink: {
    color: '#B22222',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
