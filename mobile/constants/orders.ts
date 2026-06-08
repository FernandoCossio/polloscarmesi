export const ORDER_STATUS = {
  PREPARANDO: 'Preparando',
  ASIGNADO: 'Asignado',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

/**
 * Agrupa los estados activos (los que se muestran en la pestaña "Activos")
 */
export const ACTIVE_STATUSES: OrderStatus[] = [
  ORDER_STATUS.PREPARANDO,
  ORDER_STATUS.EN_CAMINO,
];

/**
 * Agrupa los estados finales (los que se muestran en la pestaña "Historial")
 */
export const PAST_STATUSES: OrderStatus[] = [
  ORDER_STATUS.ENTREGADO,
  ORDER_STATUS.CANCELADO,
];

export function mapBackendStatusToMobile(backendStatus: string): OrderStatus {
  const normalized = backendStatus.trim().toUpperCase();

  switch (normalized) {
    case 'PREPARANDO':
    case 'PREPARING':
    case 'COCINANDO':
      return ORDER_STATUS.PREPARANDO;
    case 'EN_CAMINO':
    case 'DELIVERING':
    case 'RUTA':
      return ORDER_STATUS.EN_CAMINO;
    case 'ENTREGADO':
    case 'DELIVERED':
    case 'FINALIZADO':
      return ORDER_STATUS.ENTREGADO;
    case 'CANCELADO':
    case 'CANCELLED':
    case 'RECHAZADO':
      return ORDER_STATUS.CANCELADO;
    default:
      return ORDER_STATUS.PREPARANDO;
  }
}
