import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Pedido } from '../../interfaces/pedido.interface';
import { TipoPedidoBadge } from '../tipo-pedido-badge/tipo-pedido-badge';
import { PedidoEstadoBadge } from '../pedido-estado-badge/pedido-estado-badge';

@Component({
  selector: 'app-tabla-historial',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    TipoPedidoBadge,
    PedidoEstadoBadge
  ],
  templateUrl: './tabla-historial.html',
  styleUrl: './tabla-historial.scss',
})
export class TablaHistorial {
  @Input() pedidos: Pedido[] = [];

  @Output() verDetalles = new EventEmitter<Pedido>();
  @Output() cancelarPedido = new EventEmitter<Pedido>();

  getProductCount(pedido: Pedido): number {
    if (!pedido.detalles) return 0;
    return pedido.detalles.reduce((sum, det) => sum + det.cantidad, 0);
  }

  getHoraCreacion(fechaStr?: string): string {
    if (!fechaStr) return '';
    try {
      // Si la fecha viene del backend en formato LocalDateTime, suele estar en formato ISO o similar
      const date = new Date(fechaStr);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  canCancel(pedido: Pedido): boolean {
    return pedido.estado !== 'CANCELADO' && pedido.estado !== 'ENTREGADO';
  }

  onVer(pedido: Pedido): void {
    this.verDetalles.emit(pedido);
  }

  onCancelar(pedido: Pedido): void {
    this.cancelarPedido.emit(pedido);
  }
}
