import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ReporteFiltros } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-filtros-reporte-rendimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePickerModule,
    InputTextModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './filtros-reporte-rendimiento.html',
  styleUrl: './filtros-reporte-rendimiento.scss',
})
export class FiltrosReporteRendimiento {
  @Input() loading = false;
  @Output() buscar = new EventEmitter<ReporteFiltros>();
  @Output() exportExcel = new EventEmitter<ReporteFiltros>();
  @Output() exportPdf = new EventEmitter<ReporteFiltros>();

  fechaInicio: Date | null = new Date(new Date().setDate(1));
  fechaFin: Date | null = new Date();
  limite: number = 10;

  getCurrentFilters(): ReporteFiltros {
    return {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
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
