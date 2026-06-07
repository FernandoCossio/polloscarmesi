export interface Categoria {
  id?: number | string;
  nombre: string;
  descripcion?: string;
  icon?: string;
}

export interface CategoriaInput {
  nombre: string;
  descripcion?: string;
  icon?: string;
}
