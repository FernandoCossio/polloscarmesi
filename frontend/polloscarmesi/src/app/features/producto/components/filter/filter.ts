import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { Categoria } from '../../interfaces/categoria.interface';

@Component({
  selector: 'app-producto-filter',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    SelectModule
  ],
  templateUrl: './filter.html',
  styleUrl: './filter.scss',
})
export class Filter {
  @Input() set categorias(value: Categoria[] | null) {
    const list = value || [];
    this.dropdownOptions = [
      { id: null, nombre: 'Todas las categorías', icon: 'grid_view' },
      ...list.map(cat => ({ id: cat.id, nombre: cat.nombre, icon: cat.icon }))
    ];
  }

  @Output() searchChange = new EventEmitter<string>();
  @Output() categoriaChange = new EventEmitter<string | null>();
  @Output() newProductClick = new EventEmitter<void>();

  dropdownOptions: any[] = [{ id: null, nombre: 'Todas las categorías', icon: 'grid_view' }];

  onSearchInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchChange.emit(inputElement.value);
  }

  onCategoriaChange(event: any): void {
    this.categoriaChange.emit(event.value);
  }
}
