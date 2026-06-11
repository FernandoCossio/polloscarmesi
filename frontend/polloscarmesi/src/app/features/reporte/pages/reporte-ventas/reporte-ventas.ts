import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderReporteVenta } from '../../components/header-reporte-venta/header-reporte-venta';
import { FiltrosReporteVenta } from '../../components/filtros-reporte-venta/filtros-reporte-venta';
import { VistaPreviaReporteVenta } from '../../components/vista-previa-reporte-venta/vista-previa-reporte-venta';
import { ReporteService } from '../../services/reporte.service';
import { PagoReporte, ReporteFiltros } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-reporte-ventas',
  standalone: true,
  imports: [
    CommonModule,
    HeaderReporteVenta,
    FiltrosReporteVenta,
    VistaPreviaReporteVenta
  ],
  templateUrl: './reporte-ventas.html',
  styleUrl: './reporte-ventas.scss',
})
export class ReporteVentas {
  private readonly reporteService = inject(ReporteService);

  reportData = signal<PagoReporte[]>([]);
  cargado = signal<boolean>(false);
  loading = signal<boolean>(false);

  onBuscar(filters: ReporteFiltros): void {
    this.loading.set(true);
    this.cargado.set(true);
    this.reporteService.obtenerDatosReporte(filters).subscribe({
      next: (data) => {
        this.reportData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando datos del reporte', err);
        this.loading.set(false);
      }
    });
  }

  exportarExcel(filters: ReporteFiltros): void {
    this.reporteService.exportarExcel(filters, 'ventas').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-ventas-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error exportando Excel', err);
      }
    });
  }

  exportarPdf(filters: ReporteFiltros): void {
    const newWindow = window.open('', '_blank');
    this.reporteService.exportarPdf(filters, 'ventas').subscribe({
      next: (res) => {
        if (res && res.url && newWindow) {
          newWindow.location.href = res.url;
        } else if (newWindow) {
          newWindow.close();
        }
      },
      error: (err) => {
        console.error('Error exportando PDF', err);
        if (newWindow) {
          newWindow.close();
        }
      }
    });
  }

  onViewReceipt(pagoId: number): void {
    const newWindow = window.open('', '_blank');
    this.reporteService.obtenerRecibo(pagoId).subscribe({
      next: (res) => {
        if (res && res.url && newWindow) {
          newWindow.location.href = res.url;
        } else if (newWindow) {
          newWindow.close();
        }
      },
      error: (err) => {
        console.error('Error obteniendo recibo', err);
        if (newWindow) {
          newWindow.close();
        }
      }
    });
  }
}
