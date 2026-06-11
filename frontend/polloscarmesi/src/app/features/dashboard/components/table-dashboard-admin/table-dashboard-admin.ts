import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Pedido } from '../../../pedido/interfaces/pedido.interface';

@Component({
  selector: 'app-table-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule],
  templateUrl: './table-dashboard-admin.html',
  styleUrl: './table-dashboard-admin.scss',
})
export class TableDashboardAdmin {
  @Input() pedidos: Pedido[] = [];

  router = inject(Router);

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'ENTREGADO':
        return 'success';
      case 'PENDIENTE':
        return 'warn';
      case 'EN_PREPARACION':
      case 'CONFIRMADO':
      case 'LISTO':
        return 'info';
      case 'CANCELADO':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getHora(fechaCreacion?: string): string {
    if (!fechaCreacion) return '--:--';
    try {
      const date = new Date(fechaCreacion);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '--:--';
    }
  }

  getClientInitials(clienteId?: string | number): string {
    if (!clienteId) return 'CF';
    return `C${clienteId}`;
  }

  getClientName(clienteId?: string | number): string {
    if (!clienteId) return 'Consumidor Final';
    return `Cliente #${clienteId}`;
  }
}
