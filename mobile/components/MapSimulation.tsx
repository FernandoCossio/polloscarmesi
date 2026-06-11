import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Animated } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface MapSimulationProps {
  estado: string;
  latitud: number;
  longitud: number;
  repartidorCoordenadasActuales?: string | null;
  isSimulating?: boolean;
  simProgressOverride?: number | null;
  currentCoordsOverride?: string | null;
  showSimulationHeader?: boolean;
}

// Calcular distancias Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function MapSimulation({
  estado,
  latitud,
  longitud,
  repartidorCoordenadasActuales,
  isSimulating = false,
  simProgressOverride = null,
  currentCoordsOverride = null,
  showSimulationHeader = false,
}: MapSimulationProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  const activeAnimation = isSimulating || (estado === 'EN_CAMINO' && !isSimulating);

  useEffect(() => {
    if (activeAnimation && estado !== 'ENTREGADO') {
      const pulseAnimation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 2.2,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.6);
    }
  }, [activeAnimation, estado, opacityAnim, pulseAnim]);

  const startLat = -17.784;
  const startLon = -63.183;
  const destLat = Number(latitud) || -17.7833;
  const destLon = Number(longitud) || -63.1821;

  let repLat = startLat;
  let repLon = startLon;

  if (repartidorCoordenadasActuales) {
    const coords = repartidorCoordenadasActuales.split(',').map(Number);
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      repLat = coords[0];
      repLon = coords[1];
    }
  }

  const totalDist = calculateDistance(startLat, startLon, destLat, destLon);
  const remDist = calculateDistance(repLat, repLon, destLat, destLon);

  // Fracción completada
  let progressFraction = totalDist > 0 ? 1 - remDist / totalDist : 0;
  progressFraction = Math.max(0, Math.min(1, progressFraction));

  // Si el estado es ENTREGADO, la barra se completa al 100%
  const isEntregado = estado === 'ENTREGADO';
  
  // Usar los overrides si están presentes (para la simulación del repartidor)
  const displayPercent = simProgressOverride !== null 
    ? simProgressOverride 
    : (isEntregado ? 100 : progressFraction * 100);

  const displayCoords = currentCoordsOverride !== null
    ? currentCoordsOverride
    : `${repLat.toFixed(4)}, ${repLon.toFixed(4)}`;

  const currentRemainingDist = isEntregado ? 0 : remDist;
  const estMinutes = Math.ceil(currentRemainingDist * 3.5);

  return (
    <View style={styles.mapSimulationContainer}>
      {showSimulationHeader ? (
        <View style={styles.simulationHeader}>
          {isSimulating ? (
            <ActivityIndicator size="small" color="#B22222" />
          ) : (
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
          )}
          <Text style={styles.simulationTitle}>
            {isSimulating ? 'Ruta de Entrega en Progreso...' : 'Ruta Completada (Llegada al Destino)'}
          </Text>
        </View>
      ) : (
        <Text style={styles.mapLabel}>Ruta: Sucursal ➔ Dirección de Entrega</Text>
      )}

      {/* Dibuja la línea horizontal */}
      <View style={styles.mapTrackLine}>
        {/* Icono de Tienda a la izquierda */}
        <View style={[styles.mapNode, styles.mapNodeLeft]}>
          <MaterialIcons name="store" size={20} color="#5D4037" />
          <Text style={styles.mapNodeText}>Restaurante</Text>
        </View>

        {/* Icono de Motorizado en movimiento */}
        <View style={[styles.mapDriverNode, { left: `${displayPercent}%` }]}>
          <MaterialIcons name="delivery-dining" size={24} color="#B22222" />
          {!isEntregado && (
            <Animated.View
              style={[
                styles.driverIndicatorPulse,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: opacityAnim,
                },
              ]}
            />
          )}
        </View>

        {/* Icono de Casa a la derecha */}
        <View style={[styles.mapNode, styles.mapNodeRight]}>
          <MaterialIcons name="home" size={20} color="#5D4037" />
          <Text style={styles.mapNodeText}>{showSimulationHeader ? 'Cliente' : 'Tu Casa'}</Text>
        </View>
      </View>

      {/* Información de Telemetría */}
      {showSimulationHeader ? (
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Coordenadas Actuales</Text>
            <Text style={styles.telemetryValue}>{displayCoords}</Text>
          </View>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Progreso</Text>
            <Text style={styles.telemetryValue}>{Math.round(displayPercent)}%</Text>
          </View>
        </View>
      ) : (
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Distancia Restante</Text>
            <Text style={styles.telemetryValue}>
              {currentRemainingDist > 0.05
                ? `${currentRemainingDist.toFixed(2)} km`
                : 'Llegando...'}
            </Text>
          </View>
          <View style={styles.telemetryItem}>
            <Text style={styles.telemetryLabel}>Tiempo Estimado</Text>
            <Text style={styles.telemetryValue}>
              {isEntregado
                ? 'Entregado'
                : estMinutes > 0
                ? `${estMinutes} mins`
                : 'Inmediato'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapSimulationContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EFEA',
    gap: 16,
  },
  simulationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simulationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B22222',
  },
  mapLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8D6E63',
    textTransform: 'uppercase',
  },
  mapTrackLine: {
    height: 60,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#D7CCC8',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  mapNode: {
    position: 'absolute',
    bottom: -32,
    alignItems: 'center',
    width: 80,
  },
  mapNodeLeft: {
    left: -40,
  },
  mapNodeRight: {
    right: -40,
  },
  mapNodeText: {
    fontSize: 10,
    color: '#757575',
    marginTop: 4,
    fontWeight: '500',
  },
  mapDriverNode: {
    position: 'absolute',
    bottom: 2,
    marginLeft: -12,
    alignItems: 'center',
    zIndex: 10,
  },
  driverIndicatorPulse: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(178, 34, 34, 0.2)',
    zIndex: -1,
  },
  telemetryCard: {
    flexDirection: 'row',
    backgroundColor: '#FAF9F6',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  telemetryLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    textTransform: 'uppercase',
  },
  telemetryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B22222',
  },
});
