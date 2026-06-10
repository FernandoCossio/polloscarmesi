export interface Configuracion {
  nombreRestaurante: string;
  ruc: string;
  direccion: string;
  telefono: string;
  horarioAtencion: string;
  tiempoMaximoPreparacion: number;
  umbralAlertaCocina: number;
  coordenadas: string;
}

export interface ConfiguracionInput {
  nombreRestaurante: string;
  ruc: string;
  direccion: string;
  telefono: string;
  horarioAtencion: string;
  tiempoMaximoPreparacion: number;
  umbralAlertaCocina: number;
  coordenadas: string;
}
