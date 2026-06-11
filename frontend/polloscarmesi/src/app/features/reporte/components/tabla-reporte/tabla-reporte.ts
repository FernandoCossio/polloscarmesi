import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TipoPedidoBadge } from '@/app/features/pedido/components/tipo-pedido-badge/tipo-pedido-badge';
import { PagoEstadoBadge } from '../pago-estado-badge/pago-estado-badge';
import { PagoReporte } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-tabla-reporte',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TipoPedidoBadge, PagoEstadoBadge],
  templateUrl: './tabla-reporte.html',
  styleUrl: './tabla-reporte.scss',
})
export class TablaReporte {
  @Input() data: PagoReporte[] = [];
  @Output() actionClick = new EventEmitter<PagoReporte>();

  onActionClick(row: PagoReporte): void {
    this.actionClick.emit(row);
  }
}
