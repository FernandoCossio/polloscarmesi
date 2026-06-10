import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuario-estado-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-estado-badge.html',
  styleUrl: './usuario-estado-badge.scss',
})
export class UsuarioEstadoBadge {
  @Input() activo: boolean = false;

  get label(): string {
    return this.activo ? 'Activo' : 'Inactivo';
  }
}
