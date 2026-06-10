export interface Usuario {
  uuid: string;
  username: string;
  email: string;
  nombreCompleto: string;
  telefono?: string;
  activo: boolean;
  roles: string[];
}

export interface UsuarioCrearInput {
  username: string;
  email: string;
  nombreCompleto: string;
  telefono?: string;
  password?: string;
  rol: string;
  activo: boolean;
}

export interface UsuarioActualizarInput {
  email: string;
  nombreCompleto: string;
  telefono?: string;
  password?: string;
  rol: string;
}
