import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Producto } from '@/app/features/producto/interfaces/producto.interface';
import { Categoria } from '@/app/features/categoria/interfaces/categoria.interface';

@Component({
  selector: 'app-pedido-menu',
  standalone: true,
  imports: [CommonModule, InputTextModule, ButtonModule, IconFieldModule, InputIconModule],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu {
  @Input() productos: Producto[] = [];
  @Input() categorias: Categoria[] = [];
  @Input() selectedCategoriaId: string | number | null = null;
  @Input() searchQuery: string = '';

  @Output() selectCategoria = new EventEmitter<string | number | null>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() addProducto = new EventEmitter<Producto>();

  onSearchInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchChange.emit(inputElement.value);
  }

  onSelectCategory(id: string | number | null | undefined): void {
    this.selectCategoria.emit(id || null);
  }

  onAddProduct(product: Producto): void {
    if (product.disponible) {
      this.addProducto.emit(product);
    }
  }
}
