import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ReporteFiltros } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-filtros-reporte-cierre',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePickerModule,
    InputNumberModule,
    ButtonModule
  ],
  templateUrl: './filtros-reporte-cierre.html',
  styleUrl: './filtros-reporte-cierre.scss',
})
export class FiltrosReporteCierre {
  @Input() loading = false;
  @Output() buscar = new EventEmitter<ReporteFiltros>();
  @Output() exportExcel = new EventEmitter<ReporteFiltros>();
  @Output() exportPdf = new EventEmitter<ReporteFiltros>();

  fechaInicio: Date | null = new Date(new Date().setHours(0, 0, 0, 0));
  fechaFin: Date | null = new Date();
  saldoInicial: number = 0;
  efectivoContado: number | null = null;

  getCurrentFilters(): ReporteFiltros {
    return {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      saldoInicial: this.saldoInicial !== null ? this.saldoInicial : 0,
      efectivoContado: this.efectivoContado
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
