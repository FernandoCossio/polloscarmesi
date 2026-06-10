import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { TablaReporte } from '../tabla-reporte/tabla-reporte';
import { PagoReporte } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-vista-previa-reporte-venta',
  standalone: true,
  imports: [CommonModule, ButtonModule, BadgeModule, TablaReporte],
  templateUrl: './vista-previa-reporte-venta.html',
  styleUrl: './vista-previa-reporte-venta.scss',
})
export class VistaPreviaReporteVenta {
  @Input() data: PagoReporte[] = [];
  @Input() cargado: boolean = false;
  @Output() viewReceipt = new EventEmitter<number>();

  get totalAcumulado(): number {
    return this.data.reduce((sum, item) => sum + (item.montoTotal || 0), 0);
  }

  onActionClick(row: PagoReporte): void {
    this.viewReceipt.emit(row.id);
  }
}
