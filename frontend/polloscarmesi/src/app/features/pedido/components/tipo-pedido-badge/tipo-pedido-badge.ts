import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipoPedido } from '../../interfaces/pedido.interface';

@Component({
  selector: 'app-tipo-pedido-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tipo-pedido-badge.html',
  styleUrl: './tipo-pedido-badge.scss',
})
export class TipoPedidoBadge {
  @Input() tipo!: TipoPedido;
  @Input() mostrarIcono = true;

  get label(): string {
    if (this.tipo === 'PRESENCIAL') return 'Presencial';
    if (this.tipo === 'DELIVERY') return 'Delivery';
    return this.tipo || '';
  }

  get iconClass(): string {
    if (this.tipo === 'PRESENCIAL') return 'pi pi-user';
    if (this.tipo === 'DELIVERY') return 'pi pi-truck';
    return '';
  }
}
