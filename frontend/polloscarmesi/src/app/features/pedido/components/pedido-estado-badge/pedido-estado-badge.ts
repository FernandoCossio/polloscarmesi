import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadoPedido } from '../../interfaces/pedido.interface';

@Component({
  selector: 'app-pedido-estado-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedido-estado-badge.html',
  styleUrl: './pedido-estado-badge.scss',
})
export class PedidoEstadoBadge {
  @Input() estado!: EstadoPedido;
  @Input() mostrarIcono = true;

  get label(): string {
    switch (this.estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'CONFIRMADO': return 'Confirmado';
      case 'EN_PREPARACION': return 'En preparación';
      case 'EN_CAMINO': return 'En camino';
      case 'LISTO': return 'Listo';
      case 'ENTREGADO': return 'Entregado';
      case 'CANCELADO': return 'Cancelado';
      default: return this.estado || '';
    }
  }

  get iconClass(): string {
    switch (this.estado) {
      case 'PENDIENTE': return 'pi pi-clock';
      case 'CONFIRMADO': return 'pi pi-check';
      case 'EN_PREPARACION': return 'pi pi-cog pi-spin';
      case 'EN_CAMINO': return 'pi pi-truck';
      case 'LISTO': return 'pi pi-bell';
      case 'ENTREGADO': return 'pi pi-check-circle';
      case 'CANCELADO': return 'pi pi-times-circle';
      default: return '';
    }
  }
}
