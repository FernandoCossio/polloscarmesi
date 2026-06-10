import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ReporteFiltros } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-filtros-reporte-venta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePickerModule,
    SelectModule,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './filtros-reporte-venta.html',
  styleUrl: './filtros-reporte-venta.scss',
})
export class FiltrosReporteVenta {
  @Input() loading = false;
  @Output() buscar = new EventEmitter<ReporteFiltros>();
  @Output() exportExcel = new EventEmitter<ReporteFiltros>();
  @Output() exportPdf = new EventEmitter<ReporteFiltros>();

  fechaInicio: Date | null = new Date(new Date().setDate(1));
  fechaFin: Date | null = new Date();
  
  tipoPedido: string = 'Todos';
  estadoPago: string = 'Todos';
  metodoPago: string = 'Todos';
  limite: number = 50;

  tiposPedido = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Presencial', value: 'PRESENCIAL' },
    { label: 'Delivery', value: 'DELIVERY' }
  ];

  estadosPago = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Aceptado', value: 'ACEPTADO' },
    { label: 'Rechazado', value: 'RECHAZADO' },
    { label: 'Revisión Manual', value: 'REVISION_MANUAL' }
  ];

  metodosPago = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'QR', value: 'QR' }
  ];

  constructor() {}

  getCurrentFilters(): ReporteFiltros {
    return {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      tipoPedido: this.tipoPedido === 'Todos' ? null : this.tipoPedido,
      estadoPedido: this.estadoPago === 'Todos' ? null : this.estadoPago,
      metodoPago: this.metodoPago === 'Todos' ? null : this.metodoPago,
      limite: this.limite || null
    };
  }

  onBuscar(): void {
    this.buscar.emit(this.getCurrentFilters());
  }

  onExportExcel(): void {
    this.exportExcel.emit(this.getCurrentFilters());
  }

  onExportPdf(): void {
    this.exportPdf.emit(this.getCurrentFilters());
  }
}
