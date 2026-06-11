import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ReporteFiltros } from '../../interfaces/reporte.interface';
import { AuthService } from '@/app/features/auth/services/auth.service';
import { ROLE_CAJERO } from '@/app/core/constants/role.constant';

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
export class FiltrosReporteCierre implements OnInit {
  @Input() loading = false;
  @Output() buscar = new EventEmitter<ReporteFiltros>();
  @Output() exportExcel = new EventEmitter<ReporteFiltros>();
  @Output() exportPdf = new EventEmitter<ReporteFiltros>();

  private readonly authService = inject(AuthService);

  fechaInicio: Date | null = new Date(new Date().setHours(0, 0, 0, 0));
  fechaFin: Date | null = new Date();
  saldoInicial: number = 0;
  efectivoContado: number | null = null;

  isCajero = false;
  minDate: Date | undefined;
  maxDate: Date | undefined;

  ngOnInit(): void {
    this.isCajero = this.authService.hasAnyRole([ROLE_CAJERO]);
    if (this.isCajero) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      this.minDate = todayStart;
      this.maxDate = todayEnd;

      this.fechaInicio = new Date(todayStart);
      this.fechaFin = new Date();
    }
  }

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
