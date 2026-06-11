export interface DriverProfile {
  name: string;
  email: string;
  telefono: string;
}

export const DRIVER_PROFILES: Record<string, DriverProfile> = {
  '4': {
    name: 'Usuario Repartidor (Principal)',
    email: 'repartidor@restaurante.com',
    telefono: '59171355794',
  },
  '2': {
    name: 'Pedro Cajero (Cajero / Soporte)',
    email: 'cajero@restaurante.com',
    telefono: '59178945612',
  },
};
