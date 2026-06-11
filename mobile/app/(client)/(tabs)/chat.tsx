import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  LogBox,
} from 'react-native';

LogBox.ignoreLogs(['[expo-av]: Expo AV has been deprecated']);
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import { useCart } from '../../../context/cart-context';
import { RestaurantService } from '../../../services/restaurant-service';
import { GATEWAY_URL, AuthService } from '../../../services/auth-service';
import { ThemedView } from '@/components/themed-view';
import { MessageBubble, ChatMessage, CartConfirmationItem } from '@/components/MessageBubble';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ChatScreen() {
  const { addToCart } = useCart();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy Carmesí-AI, tu asistente virtual. Puedes preguntarme sobre el menú o decirme cosas como "Quiero un combo familiar y un cuarto de pollo" para agregarlos a tu carrito. ¿En qué te ayudo hoy?',
      timestamp: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [menuProducts, setMenuProducts] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isPreparingRef = useRef(false);
  const shouldStopRef = useRef(false);

  useEffect(() => {
    return () => {
      const activeRecording = recordingRef.current;
      if (activeRecording) {
        activeRecording.stopAndUnloadAsync().catch((err) => {
          console.warn('Error unloading recording on unmount:', err);
        });
      }
    };
  }, []);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const menu = await RestaurantService.obtenerMenu();
        setMenuProducts(menu || []);
      } catch (err) {
        console.error('Error loading menu for chatbot:', err);
      }
    };
    loadMenu();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isLoading]);

  const startRecording = async () => {
    if (isPreparingRef.current) return;

    try {
      isPreparingRef.current = true;
      shouldStopRef.current = false;

      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          // Ignore
        }
        recordingRef.current = null;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permiso Requerido',
          'Para usar el chatbot con mensajes de voz, debes permitir el acceso al micrófono en los ajustes de la app.',
        );
        isPreparingRef.current = false;
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      if (shouldStopRef.current) {
        isPreparingRef.current = false;
        return;
      }

      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 64000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 64000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      if (shouldStopRef.current) {
        try {
          await newRecording.stopAndUnloadAsync();
        } catch {
          // Ignore
        }
        isPreparingRef.current = false;
        return;
      }

      recordingRef.current = newRecording;
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      Alert.alert('Error', 'No se pudo iniciar el grabador de audio.');
    } finally {
      isPreparingRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (isPreparingRef.current) {
      shouldStopRef.current = true;
      setIsRecording(false);
      return;
    }

    const activeRecording = recordingRef.current;
    if (!activeRecording) return;

    setIsRecording(false);
    recordingRef.current = null;

    try {
      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();
      if (uri) {
        await sendAudioMessage(uri);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Recorder does not exist')) {
        console.warn('Attempted to stop a recorder that was already stopped or did not exist.');
      } else {
        console.error('Error stopping audio recording:', err);
      }
    }
  };

  const sendAudioMessage = async (uri: string) => {
    setIsLoading(true);

    const userMsgId = String(Date.now());
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: 'Enviando mensaje de voz...',
        timestamp: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);

    try {
      if (!FileSystem || !FileSystem.uploadAsync) {
        throw new Error('FileSystem o uploadAsync no están definidos. Por favor, cierra la app en Expo Go y vuelve a escanear el QR.');
      }

      const token = AuthService.getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Utilizar la subida nativa de FileSystem para saltarse las limitaciones
      // de red del FormData de Javascript en Android
      const uploadResult = await FileSystem.uploadAsync(
        `${GATEWAY_URL}/api/v1/delivery/chat/audio`,
        uri,
        {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystemUploadType.MULTIPART,
          headers,
        }
      );

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Error en respuesta de servidor: ${uploadResult.status}`);
      }

      const result = JSON.parse(uploadResult.body);
      handleAIResponse(result);
    } catch (err: any) {
      console.error(`Error calling audio chatbot API: ${err?.message || err} | Stack: ${err?.stack} | URI: ${uri}`);
      Alert.alert(
        'Error de Depuración de Audio',
        `Mensaje: ${err?.message || err}\n\nStack: ${err?.stack ? err.stack.substring(0, 180) : 'No stack'}`
      );
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'ai',
          text: 'Disculpa, no pude procesar tu mensaje de voz. Por favor, intenta de nuevo o escribe tu mensaje por texto.',
          timestamp: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTextMessage = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    setIsLoading(true);

    const userMsgId = String(Date.now());
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);

    try {
      const token = AuthService.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${GATEWAY_URL}/api/v1/delivery/chat/texto`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mensaje: textToSend }),
      });

      if (!response.ok) {
        throw new Error('Error de servidor en chat');
      }

      const result = await response.json();
      handleAIResponse(result);
    } catch (err: any) {
      console.error('Error calling text chatbot API:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'ai',
          text: 'Disculpa, ocurrió un error al comunicarme con mi servidor. Por favor, comprueba tu conexión a internet.',
          timestamp: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const now = () =>
    new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const handleAIResponse = (result: any) => {
    const aiMsgId = String(Date.now());
    const text = result.respuesta_ia || 'Completado';

    if (result.tipo === 'ACCION_CARRITO' && result.items && result.items.length > 0) {
      // Enriquecer items con nombre del producto si lo tenemos en el menú local
      const enrichedItems: CartConfirmationItem[] = result.items.map((item: any) => {
        const product = menuProducts.find((p: any) => String(p.id) === String(item.productoId));
        return {
          productoId: String(item.productoId),
          cantidad: Number(item.cantidad) || 1,
          nombreProducto: product?.nombre,
        };
      });

      // Mostrar mensaje con tarjeta de confirmación pendiente
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text,
          timestamp: now(),
          cartConfirmation: { items: enrichedItems, confirmed: false },
        } as ChatMessage,
      ]);
    } else {
      // Respuesta de texto normal
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, sender: 'ai', text, timestamp: now() },
      ]);
    }
  };

  /** Confirmar: agrega los items al carrito y marca el mensaje como procesado */
  const handleConfirmCart = (items: CartConfirmationItem[]) => {
    let count = 0;
    for (const item of items) {
      const product = menuProducts.find((p: any) => String(p.id) === String(item.productoId));
      addToCart(
        {
          id: item.productoId,
          nombre: item.nombreProducto || product?.nombre || `Producto #${item.productoId}`,
          precio: product?.precio ?? 0,
          imagen: product?.imagenUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
        },
        item.cantidad,
      );
      count += item.cantidad;
    }
    // Marcar el mensaje de confirmación como procesado (quita los botones)
    setMessages((prev) =>
      prev.map((m) =>
        m.cartConfirmation && !m.cartConfirmation.confirmed
          ? { ...m, cartConfirmation: { ...m.cartConfirmation, confirmed: true } }
          : m,
      ),
    );
    // Añadir mensaje de confirmación de la IA
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'ai',
        text: `✅ ¡Listo! Agregué ${count} producto(s) a tu carrito. ¿Deseas algo más?`,
        timestamp: now(),
      },
    ]);
  };

  /** Cancelar: descarta la confirmación pendiente */
  const handleCancelCart = () => {
    setMessages((prev) =>
      prev.map((m) =>
        m.cartConfirmation && !m.cartConfirmation.confirmed
          ? { ...m, cartConfirmation: { ...m.cartConfirmation, confirmed: true } }
          : m,
      ),
    );
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'ai',
        text: 'De acuerdo, he cancelado el pedido. ¿En qué más te puedo ayudar?',
        timestamp: now(),
      },
    ]);
  };

  /** Repetir: cancela la confirmación y activa el micrófono */
  const handleRepeatOrder = () => {
    setMessages((prev) =>
      prev.map((m) =>
        m.cartConfirmation && !m.cartConfirmation.confirmed
          ? { ...m, cartConfirmation: { ...m.cartConfirmation, confirmed: true } }
          : m,
      ),
    );
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'ai',
        text: '🎧 Listo, escucho... ¡Habla ahora y dime qué quieres pedir!',
        timestamp: now(),
      },
    ]);
    // Activar micrófono automáticamente
    startRecording();
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ThemedView style={styles.chatArea}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onConfirmCart={handleConfirmCart}
              onCancelCart={handleCancelCart}
              onRepeatOrder={handleRepeatOrder}
            />
          ))}
          {isLoading && (
            <View style={styles.loadingBubbleContainer}>
              <View
                style={[
                  styles.bubble,
                  styles.aiBubble,
                  styles.loadingBubble,
                ]}
              >
                <ActivityIndicator size="small" color="#B22222" />
                <Text style={styles.loadingBubbleText}>Pensando...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Recording Visual Overlay */}
        {isRecording && (
          <View style={styles.recordingOverlay}>
            <View style={styles.recordingAlert}>
              <MaterialIcons
                name="mic"
                size={24}
                color="#D32F2F"
                style={styles.pulseIcon}
              />
              <Text style={styles.recordingAlertText}>
                Escuchando voz... Suelta para enviar
              </Text>
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Pregunta algo sobre el menú o pide comida..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
            editable={!isLoading && !isRecording}
            onSubmitEditing={sendTextMessage}
          />

          {inputText.trim() ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={sendTextMessage}
              disabled={isLoading}
            >
              <MaterialIcons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.micButton,
                isRecording && styles.recordingMicButton,
              ]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={isRecording ? 'stop' : 'mic'}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  chatArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderColor: '#F0EFEA',
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  loadingBubbleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingBubbleText: {
    fontSize: 13,
    color: '#757575',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0EFEA',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#3E2723',
    borderWidth: 1,
    borderColor: '#E8E7E3',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#B22222', // Rojo Carmesí
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  micButton: {
    backgroundColor: '#5D4037',
  },
  recordingMicButton: {
    backgroundColor: '#D32F2F',
    transform: [{ scale: 1.1 }],
  },
  recordingOverlay: {
    backgroundColor: '#FFF8F8',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFEBEE',
  },
  recordingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingAlertText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C62828',
  },
  pulseIcon: {},
});
