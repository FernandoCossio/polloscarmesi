export const BACKEND_ROLES = {
  CLIENTE: 'Cliente',
  REPARTIDOR: 'Repartidor',
} as const;

export const MOBILE_ROLES = {
  CLIENT: 'client',
  DRIVER: 'driver',
} as const;

export type MobileRole = typeof MOBILE_ROLES[keyof typeof MOBILE_ROLES];

export function mapBackendRoleToMobile(backendRole: string): MobileRole {
  const normalized = backendRole.trim().toLowerCase();

  if (normalized === BACKEND_ROLES.REPARTIDOR.toLowerCase() || normalized === 'repartidor' || normalized === 'driver') {
    return MOBILE_ROLES.DRIVER;
  }
  
  return MOBILE_ROLES.CLIENT;
}
