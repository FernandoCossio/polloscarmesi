import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function RegisterScreen() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert('Campos incompletos', 'Por favor llena los campos obligatorios.');
      return;
    }

    setLoading(false);
    Alert.alert(
      'Cuenta Creada',
      '¡Tu registro ha sido exitoso! Ingresarás automáticamente.',
      [
        {
          text: 'Entendido',
          onPress: async () => {
            setLoading(true);
            await login(nombre, 'client');
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>
        Regístrate gratis
      </Text>
      <Text style={styles.subtitle}>
        Crea tu cuenta de Cliente para comenzar a pedir
      </Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={20} color="#8D6E63" style={styles.inputIcon} />
          <TextInput
            placeholder="Nombre Completo *"
            placeholderTextColor="#A18F8C"
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color="#8D6E63" style={styles.inputIcon} />
          <TextInput
            placeholder="Correo Electrónico *"
            placeholderTextColor="#A18F8C"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="phone" size={20} color="#8D6E63" style={styles.inputIcon} />
          <TextInput
            placeholder="Teléfono (Opcional)"
            placeholderTextColor="#A18F8C"
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="#8D6E63" style={styles.inputIcon} />
          <TextInput
            placeholder="Contraseña *"
            placeholderTextColor="#A18F8C"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>
            Crear Cuenta
          </Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 28,
  },
  form: {
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
  registerButton: {
    backgroundColor: '#B22222',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
