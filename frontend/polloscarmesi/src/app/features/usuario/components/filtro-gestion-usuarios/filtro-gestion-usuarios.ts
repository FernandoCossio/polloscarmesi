import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-filtro-gestion-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    SelectModule
  ],
  templateUrl: './filtro-gestion-usuarios.html',
  styleUrl: './filtro-gestion-usuarios.scss',
})
export class FiltroGestionUsuarios {
  @Output() searchChange = new EventEmitter<string>();
  @Output() roleChange = new EventEmitter<string | null>();
  @Output() newUsuarioClick = new EventEmitter<void>();

  selectedRole: string | null = null;

  roleOptions = [
    { label: 'Todos los roles', value: null },
    { label: 'Cajero', value: 'CAJERO' },
    { label: 'Cocina', value: 'COCINA' },
    { label: 'Repartidor', value: 'REPARTIDOR' }
  ];

  onSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchChange.emit(inputElement.value);
  }

  onRoleChange(event: any): void {
    this.roleChange.emit(event.value);
  }
}
