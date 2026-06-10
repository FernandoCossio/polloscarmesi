import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CierreCajaData } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-stats-reporte-cierre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-reporte-cierre.html',
  styleUrl: './stats-reporte-cierre.scss',
})
export class StatsReporteCierre {
  @Input() data: CierreCajaData | null = null;

  get revisionOPendientes(): number {
    if (!this.data) return 0;
    return (this.data.cantidadPagosRevisionManual || 0) + (this.data.cantidadPagosPendientes || 0);
  }
}
