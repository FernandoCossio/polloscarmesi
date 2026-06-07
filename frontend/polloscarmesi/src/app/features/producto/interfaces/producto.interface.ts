export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  disponible: boolean;
  imagenUrl?: string;
  categoria?: {
    id: string;
    nombre: string;
    icon?: string;
  };
}

export interface ProductoInput {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoriaId: string;
}
