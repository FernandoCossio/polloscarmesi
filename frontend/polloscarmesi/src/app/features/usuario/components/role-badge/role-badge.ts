import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-badge.html',
  styleUrl: './role-badge.scss',
})
export class RoleBadge {
  @Input() role!: string;

  get label(): string {
    if (!this.role) return '';
    const r = this.role.toUpperCase();
    if (r === 'CAJERO') return 'Cajero';
    if (r === 'COCINA') return 'Cocina';
    if (r === 'REPARTIDOR') return 'Repartidor';
    if (r === 'ADMINISTRADOR') return 'Administrador';
    return this.role;
  }

  get normalizedRoleClass(): string {
    if (!this.role) return '';
    return this.role.toLowerCase();
  }
}
