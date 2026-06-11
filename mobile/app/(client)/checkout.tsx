import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/cart-context';
import { useAuth } from '../../context/auth-context';
import { RestaurantService } from '../../services/restaurant-service';
import { ThemedView } from '@/components/themed-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ADDRESS_OPTIONS } from '../../constants/addresses';
import { DRIVER_PROFILES } from '../../constants/drivers';

export default function CheckoutScreen() {
  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'qr'>('efectivo');
  const [selectedAddress, setSelectedAddress] = useState(ADDRESS_OPTIONS[0]);
  const [repartidores, setRepartidores] = useState<any[]>([]);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<string>('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getClosestDriver = () => {
    if (repartidores.length === 0) return null;
    let closest: any = null;
    let minDistance = Infinity;

    for (const rep of repartidores) {
      if (rep.coordenadasActuales) {
        const [repLat, repLon] = rep.coordenadasActuales.split(',').map(Number);
        if (!isNaN(repLat) && !isNaN(repLon)) {
          const dist = calculateDistance(selectedAddress.lat, selectedAddress.lon, repLat, repLon);
          if (dist < minDistance) {
            minDistance = dist;
            closest = { ...rep, distance: dist };
          }
        }
      }
    }
    return closest;
  };

  useEffect(() => {
    const fetchRepartidores = async () => {
      try {
        const list = await RestaurantService.obtenerRepartidoresDisponibles();
        setRepartidores(list || []);
      } catch (err) {
        console.error('Error fetching available drivers:', err);
      }
    };
    fetchRepartidores();
  }, []);

  const handleConfirm = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'El carrito está vacío');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        clienteId: user?.id || '1',
        direccionEntrega: selectedAddress.address,
        referencia: repartidorSeleccionado === 'none'
          ? `${selectedAddress.name} [MANUAL]`
          : selectedAddress.name,
        latitud: selectedAddress.lat,
        longitud: selectedAddress.lon,
        subtotal: cartTotal,
        descuento: 0,
        total: cartTotal + 10,
        detalles: items.map((item) => ({
          productoId: String(item.id),
          nombreProducto: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
        })),
      };

      const order = await RestaurantService.crearPedidoDelivery(payload);

      let confirmationMessage = 'Tu pedido ha sido registrado con éxito.';

      if (repartidorSeleccionado !== 'auto' && repartidorSeleccionado !== 'none') {
        try {
          await RestaurantService.asignarRepartidor(order.id, repartidorSeleccionado);
          const chosenDriver = repartidores.find(r => String(r.id) === String(repartidorSeleccionado));
          const profile = DRIVER_PROFILES[repartidorSeleccionado];
          const driverName = chosenDriver?.nombre && !chosenDriver.nombre.startsWith('Repartidor #')
            ? chosenDriver.nombre
            : (profile?.name || `Repartidor #${repartidorSeleccionado}`);
          const driverContact = chosenDriver?.telefono 
            ? `Tel: ${chosenDriver.telefono}`
            : (profile ? profile.email : '');
          const driverText = driverContact ? `${driverName} (${driverContact})` : driverName;
          confirmationMessage += `\n\nAsignación MANUAL forzada a: ${driverText}.`;
        } catch (assignErr: any) {
          console.warn('Error al forzar la asignación del repartidor:', assignErr.message);
        }
      } else if (repartidorSeleccionado === 'none') {
        confirmationMessage += `\n\nPedido creado SIN ASIGNAR. Puedes aceptarlo manualmente desde la pestaña "Disponibles" en la app del Repartidor.`;
      } else {
        // Asignación automática calculada
        const closest = getClosestDriver();
        if (closest) {
          const profile = DRIVER_PROFILES[closest.id.toString()];
          const driverName = closest.nombre && !closest.nombre.startsWith('Repartidor #')
            ? closest.nombre
            : (profile?.name || closest.nombre || `Repartidor #${closest.id}`);
          const driverContact = closest.telefono 
            ? `Tel: ${closest.telefono}`
            : (profile ? profile.email : '');
          const contactStr = driverContact ? ` (${driverContact})` : '';
          confirmationMessage += `\n\nAsignado AUTOMÁTICAMENTE por GPS a: ${driverName}${contactStr} (a ${closest.distance.toFixed(2)} km de ti).`;
        } else {
          const profile4 = DRIVER_PROFILES['4'];
          confirmationMessage += `\n\nAsignado al ${profile4.name} (${profile4.email}) como fallback por defecto.`;
        }
      }

      Alert.alert(
        '¡Pedido Confirmado!',
        confirmationMessage,
        [
          {
            text: 'Ok',
            onPress: () => {
              clearCart();
              router.replace('/(client)/(tabs)/orders');
            },
          },
        ]
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'No se pudo crear el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Dirección de Entrega (Simulador de GPS) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dirección de Entrega</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressOptionsContainer}>
            {ADDRESS_OPTIONS.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressOptionCard,
                  selectedAddress.id === addr.id && styles.activeAddressOption
                ]}
                onPress={() => setSelectedAddress(addr)}
              >
                <MaterialIcons
                  name={addr.icon}
                  size={20}
                  color={selectedAddress.id === addr.id ? '#B22222' : '#757575'}
                />
                <Text style={[styles.addressOptionName, selectedAddress.id === addr.id && styles.activeAddressText]}>
                  {addr.name}
                </Text>
                <Text style={styles.addressOptionText} numberOfLines={1}>
                  {addr.address}
                </Text>
                <Text style={styles.addressOptionCoords}>
                  Lat: {addr.lat.toFixed(4)}, Lon: {addr.lon.toFixed(4)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Resumen del Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Productos</Text>
          <View style={styles.summaryCard}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.cantidad}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.itemPrice}>{item.precio * item.cantidad} Bs.</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{cartTotal} Bs.</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Costo de Envío</Text>
              <Text style={styles.totalValue}>10 Bs.</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total a Pagar</Text>
              <Text style={styles.grandTotalValue}>{cartTotal + 10} Bs.</Text>
            </View>
          </View>
        </View>

        {/* Método de Pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Pago</Text>
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[styles.methodCard, metodoPago === 'efectivo' && styles.activeMethod]}
              onPress={() => setMetodoPago('efectivo')}
            >
              <MaterialIcons
                name="payments"
                size={28}
                color={metodoPago === 'efectivo' ? '#B22222' : '#8D6E63'}
              />
              <Text style={[styles.methodText, metodoPago === 'efectivo' && styles.activeMethodText]}>
                Efectivo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodCard, metodoPago === 'qr' && styles.activeMethod]}
              onPress={() => setMetodoPago('qr')}
            >
              <MaterialIcons
                name="qr-code-2"
                size={28}
                color={metodoPago === 'qr' ? '#B22222' : '#8D6E63'}
              />
              <Text style={[styles.methodText, metodoPago === 'qr' && styles.activeMethodText]}>
                Código QR
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Asignación de Repartidor (Simulador) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asignación de Repartidor</Text>
          <View style={styles.driverOptionsContainer}>
            <TouchableOpacity
              style={[
                styles.driverOptionCard,
                repartidorSeleccionado === 'auto' && styles.activeDriverCard
              ]}
              onPress={() => setRepartidorSeleccionado('auto')}
            >
              <MaterialIcons
                name="bolt"
                size={22}
                color={repartidorSeleccionado === 'auto' ? '#B22222' : '#757575'}
              />
              <View style={styles.driverOptionInfo}>
                <Text style={[styles.driverOptionName, repartidorSeleccionado === 'auto' && styles.activeDriverText]}>
                  Asignación Automática (Más cercano)
                </Text>
                {getClosestDriver() ? (
                  <Text style={styles.driverOptionSub}>
                    Se sugerirá a: {getClosestDriver()?.nombre && !getClosestDriver()?.nombre.startsWith('Repartidor #') ? getClosestDriver()?.nombre : (DRIVER_PROFILES[String(getClosestDriver()?.id)]?.name || getClosestDriver()?.nombre || `Repartidor #${getClosestDriver()?.id}`)} (a {getClosestDriver()?.distance?.toFixed(2)} km de ti)
                  </Text>
                ) : (
                  <Text style={styles.driverOptionSub}>
                    El sistema buscará al repartidor disponible más cercano por GPS (Ubicación activa).
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.driverOptionCard,
                repartidorSeleccionado === 'none' && styles.activeDriverCard
              ]}
              onPress={() => setRepartidorSeleccionado('none')}
            >
              <MaterialIcons
                name="lock-open"
                size={22}
                color={repartidorSeleccionado === 'none' ? '#B22222' : '#757575'}
              />
              <View style={styles.driverOptionInfo}>
                <Text style={[styles.driverOptionName, repartidorSeleccionado === 'none' && styles.activeDriverText]}>
                  Sin Asignar (Aceptación Manual)
                </Text>
                <Text style={styles.driverOptionSub}>
                  El pedido quedará libre para que cualquier repartidor lo acepte desde la pestaña &quot;Disponibles&quot;.
                </Text>
              </View>
            </TouchableOpacity>

            {repartidores.map((rep) => {
              let distanceText = 'Ubicación desconocida';
              if (rep.coordenadasActuales) {
                const [repLat, repLon] = rep.coordenadasActuales.split(',').map(Number);
                if (!isNaN(repLat) && !isNaN(repLon)) {
                  const dist = calculateDistance(selectedAddress.lat, selectedAddress.lon, repLat, repLon);
                  distanceText = `a ${dist.toFixed(2)} km de ti`;
                }
              }

              const profile = DRIVER_PROFILES[rep.id.toString()];
              const driverName = rep.nombre && !rep.nombre.startsWith('Repartidor #')
                ? rep.nombre 
                : (profile?.name || rep.nombre || `Repartidor #${rep.id}`);
              const infoText = rep.telefono 
                ? `Teléfono: ${rep.telefono}`
                : (profile ? `Email: ${profile.email}` : `ID: ${rep.id}`);

              return (
                <TouchableOpacity
                  key={rep.id}
                  style={[
                    styles.driverOptionCard,
                    repartidorSeleccionado === rep.id && styles.activeDriverCard
                  ]}
                  onPress={() => setRepartidorSeleccionado(rep.id)}
                >
                  <MaterialIcons
                    name="sports-motorsports"
                    size={22}
                    color={repartidorSeleccionado === rep.id ? '#B22222' : '#757575'}
                  />
                  <View style={styles.driverOptionInfo}>
                    <Text style={[styles.driverOptionName, repartidorSeleccionado === rep.id && styles.activeDriverText]}>
                      Asignar a: {driverName}
                    </Text>
                    <Text style={styles.driverOptionSub}>
                      {infoText} • Distancia: {distanceText}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Si no hay repartidores disponibles en línea, agregar opción de test de repartidor ID 3 */}
            {repartidores.length === 0 && (
              <TouchableOpacity
                style={[
                  styles.driverOptionCard,
                  repartidorSeleccionado === '4' && styles.activeDriverCard
                ]}
                onPress={() => setRepartidorSeleccionado('4')}
              >
                <MaterialIcons
                  name="sports-motorsports"
                  size={22}
                  color={repartidorSeleccionado === '4' ? '#B22222' : '#757575'}
                />
                <View style={styles.driverOptionInfo}>
                  <Text style={[styles.driverOptionName, repartidorSeleccionado === '4' && styles.activeDriverText]}>
                    Simular: {DRIVER_PROFILES['4']?.name || 'Repartidor Principal'}
                  </Text>
                  <Text style={styles.driverOptionSub}>
                    Email: {DRIVER_PROFILES['4']?.email || 'repartidor@restaurante.com'} • Fuerza la asignación directa de desarrollo.
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Botón de Confirmación */}
        <TouchableOpacity 
          style={[styles.confirmButton, isSubmitting && styles.disabledButton]} 
          onPress={handleConfirm} 
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar Pedido - {cartTotal + 10} Bs.</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContainer: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
    paddingLeft: 4,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EFEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  addressDetails: {
    marginLeft: 12,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  addressText: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EFEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B22222',
    minWidth: 24,
  },
  itemName: {
    fontSize: 14,
    color: '#3E2723',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3E2723',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#757575',
  },
  totalValue: {
    fontSize: 14,
    color: '#3E2723',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B22222',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 10,
  },
  methodCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EFEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    gap: 6,
  },
  activeMethod: {
    borderColor: '#B22222',
    backgroundColor: '#FFF8F8',
  },
  methodText: {
    fontSize: 12,
    color: '#8D6E63',
    fontWeight: '500',
  },
  activeMethodText: {
    color: '#B22222',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#B22222',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverOptionsContainer: {
    gap: 8,
  },
  driverOptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EFEA',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    gap: 12,
  },
  activeDriverCard: {
    borderColor: '#B22222',
    backgroundColor: '#FFF8F8',
  },
  driverOptionInfo: {
    flex: 1,
  },
  driverOptionName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  activeDriverText: {
    color: '#B22222',
  },
  driverOptionSub: {
    fontSize: 11,
    color: '#757575',
    marginTop: 2,
  },
  addressOptionsContainer: {
    gap: 10,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  addressOptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0EFEA',
    width: 170,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    gap: 4,
  },
  activeAddressOption: {
    borderColor: '#B22222',
    backgroundColor: '#FFF8F8',
  },
  activeAddressText: {
    color: '#B22222',
  },
  addressOptionName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  addressOptionText: {
    fontSize: 11,
    color: '#757575',
    marginTop: 2,
  },
  addressOptionCoords: {
    fontSize: 9,
    color: '#9E9E9E',
    marginTop: 4,
  },
});
