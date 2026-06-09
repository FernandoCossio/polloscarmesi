import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert('Por favor ingrese su correo electrónico/usuario y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
      router.replace('/');
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
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
        {/* Email/Username Input */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color="#8D6E63" style={styles.inputIcon} />
          <TextInput
            placeholder="Usuario o Correo Electrónico"
            placeholderTextColor="#A18F8C"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input with Toggle */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="#8D6E63" style={styles.inputIcon} />
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor="#A18F8C"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons 
              name={showPassword ? "visibility" : "visibility-off"} 
              size={22} 
              color="#8D6E63" 
            />
          </TouchableOpacity>
        </View>

        {/* Single Login Button */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="login" size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  Iniciar Sesión
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
  eyeIcon: {
    padding: 4,
  },
  buttonsContainer: {
    marginTop: 10,
  },
  submitButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#B22222',
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

