import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Usuario } from '../../interfaces/usuario.interface';
import { RoleBadge } from '../role-badge/role-badge';
import { UsuarioEstadoBadge } from '../usuario-estado-badge/usuario-estado-badge';

@Component({
  selector: 'app-card-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    RoleBadge,
    UsuarioEstadoBadge
  ],
  templateUrl: './card-usuario.html',
  styleUrl: './card-usuario.scss',
})
export class CardUsuario {
  @Input({ required: true }) usuario!: Usuario;
  @Output() edit = new EventEmitter<Usuario>();
  @Output() toggleStatus = new EventEmitter<Usuario>();

  get initials(): string {
    if (!this.usuario || !this.usuario.nombreCompleto) return '';
    const parts = this.usuario.nombreCompleto.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  get avatarBackground(): string {
    if (!this.usuario || !this.usuario.username) return '#e2e8f0';
    let hash = 0;
    const str = this.usuario.username;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#dbeafe', // blue-100
      '#ffe4e6', // rose-100
      '#ffedd5', // orange-100
      '#dcfce7', // green-100
      '#f3e8ff', // purple-100
      '#ccfbf1', // teal-100
      '#fef9c3'  // yellow-100
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.usuario);
  }

  onToggleStatus(event: Event): void {
    event.stopPropagation();
    this.toggleStatus.emit(this.usuario);
  }
}
