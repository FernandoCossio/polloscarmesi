import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderReporteCierre } from '../../components/header-reporte-cierre/header-reporte-cierre';
import { FiltrosReporteCierre } from '../../components/filtros-reporte-cierre/filtros-reporte-cierre';
import { StatsReporteCierre } from '../../components/stats-reporte-cierre/stats-reporte-cierre';
import { ContenidoReporteCierre } from '../../components/contenido-reporte-cierre/contenido-reporte-cierre';
import { ReporteService } from '../../services/reporte.service';
import { CierreCajaData, ReporteFiltros } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-reporte-cierre-caja',
  standalone: true,
  imports: [
    CommonModule,
    HeaderReporteCierre,
    FiltrosReporteCierre,
    StatsReporteCierre,
    ContenidoReporteCierre
  ],
  templateUrl: './reporte-cierre-caja.html',
  styleUrl: './reporte-cierre-caja.scss',
})
export class ReporteCierreCaja {
  private readonly reporteService = inject(ReporteService);

  reportData = signal<CierreCajaData | null>(null);
  cargado = signal<boolean>(false);
  loading = signal<boolean>(false);

  onBuscar(filters: ReporteFiltros): void {
    this.loading.set(true);
    this.cargado.set(true);
    this.reporteService.obtenerDatosCierreCaja(filters).subscribe({
      next: (data) => {
        this.reportData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando datos de cierre de caja', err);
        this.loading.set(false);
      }
    });
  }

  exportarExcel(filters: ReporteFiltros): void {
    this.reporteService.exportarCierreCajaExcel(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-cierre-caja-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error exportando Excel de cierre de caja', err);
      }
    });
  }

  exportarPdf(filters: ReporteFiltros): void {
    const newWindow = window.open('', '_blank');
    this.reporteService.exportarCierreCajaPdf(filters).subscribe({
      next: (res) => {
        if (res && res.url && newWindow) {
          newWindow.location.href = res.url;
        } else if (newWindow) {
          newWindow.close();
        }
      },
      error: (err) => {
        console.error('Error exportando PDF de cierre de caja', err);
        if (newWindow) {
          newWindow.close();
        }
      }
    });
  }
}
