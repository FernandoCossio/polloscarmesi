import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { FormattedMessageText } from './FormattedMessageText';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface CartConfirmationItem {
  productoId: string;
  cantidad: number;
  nombreProducto?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  /** Si el mensaje es una confirmación de carrito pendiente */
  cartConfirmation?: {
    items: CartConfirmationItem[];
    confirmed: boolean; // true si ya fue procesado (para no re-renderizar botones)
  };
}

interface MessageBubbleProps {
  msg: ChatMessage;
  onConfirmCart?: (items: CartConfirmationItem[]) => void;
  onCancelCart?: () => void;
  onRepeatOrder?: () => void;
}

export function MessageBubble({
  msg,
  onConfirmCart,
  onCancelCart,
  onRepeatOrder,
}: MessageBubbleProps) {
  const isUser = msg.sender === 'user';
  const hasConfirmation =
    msg.cartConfirmation && !msg.cartConfirmation.confirmed;

  return (
    <View
      style={[
        styles.messageBubbleContainer,
        isUser ? styles.userBubbleContainer : styles.aiBubbleContainer,
      ]}
    >
      <View style={styles.bubbleWrapper}>
        {/* Burbuja del mensaje */}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
            hasConfirmation && styles.confirmationBubble,
          ]}
        >
          <FormattedMessageText text={msg.text} isUser={isUser} />
          <Text
            style={[
              styles.timestamp,
              isUser ? styles.userTimestamp : styles.aiTimestamp,
            ]}
          >
            {msg.timestamp}
          </Text>
        </View>

        {/* Tarjeta de items del carrito */}
        {hasConfirmation && msg.cartConfirmation && (
          <View style={styles.confirmationCard}>
            {/* Lista de items */}
            <View style={styles.itemsList}>
              {msg.cartConfirmation.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.itemBadge}>
                    <Text style={styles.itemBadgeText}>{item.cantidad}×</Text>
                  </View>
                  <Text style={styles.itemName}>
                    {item.nombreProducto || `Producto #${item.productoId}`}
                  </Text>
                </View>
              ))}
            </View>

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={onCancelCart}
                activeOpacity={0.75}
              >
                <MaterialIcons name="close" size={16} color="#C62828" />
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.repeatBtn]}
                onPress={onRepeatOrder}
                activeOpacity={0.75}
              >
                <MaterialIcons name="mic" size={16} color="#5D4037" />
                <Text style={styles.repeatBtnText}>Repetir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.confirmBtn]}
                onPress={() =>
                  onConfirmCart && onConfirmCart(msg.cartConfirmation!.items)
                }
                activeOpacity={0.75}
              >
                <MaterialIcons name="check" size={16} color="#fff" />
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageBubbleContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  userBubbleContainer: {
    justifyContent: 'flex-end',
  },
  aiBubbleContainer: {
    justifyContent: 'flex-start',
  },
  bubbleWrapper: {
    maxWidth: '90%',
    gap: 6,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
  },
  confirmationBubble: {
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#5D4037',
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderColor: '#F0EFEA',
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  timestamp: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'right',
  },
  userTimestamp: {
    color: '#D7CCC8',
  },
  aiTimestamp: {
    color: '#888',
  },

  // ── Tarjeta de confirmación ─────────────────────────────────
  confirmationCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
    overflow: 'hidden',
  },
  itemsList: {
    padding: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemBadge: {
    backgroundColor: '#B22222',
    borderRadius: 10,
    minWidth: 28,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  itemBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemName: {
    fontSize: 13,
    color: '#3E2723',
    fontWeight: '500',
    flex: 1,
  },

  // ── Botones ─────────────────────────────────────────────────
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#FFE082',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 4,
  },
  cancelBtn: {
    backgroundColor: '#FFF8F8',
    borderRightWidth: 1,
    borderRightColor: '#FFE082',
  },
  repeatBtn: {
    backgroundColor: '#FFF8E1',
    borderRightWidth: 1,
    borderRightColor: '#FFE082',
  },
  confirmBtn: {
    backgroundColor: '#B22222',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C62828',
  },
  repeatBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D4037',
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
