import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface AddressOption {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}

export const ADDRESS_OPTIONS: AddressOption[] = [
  { id: 'casa', name: 'Mi Casa', address: 'Av. Busch, Calle 4 #123, Santa Cruz', lat: -17.7833, lon: -63.1821, icon: 'home' },
  { id: 'uagrm', name: 'UAGRM - FICCT', address: 'Av. Centenario (Facultad de Tecnología)', lat: -17.7756, lon: -63.1945, icon: 'school' },
  { id: 'ventura', name: 'Ventura Mall', address: 'Av. San Martín, Equipetrol Norte', lat: -17.7595, lon: -63.1925, icon: 'local-mall' },
];
