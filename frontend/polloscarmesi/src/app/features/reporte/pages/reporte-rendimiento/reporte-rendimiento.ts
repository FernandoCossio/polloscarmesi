import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderReporteRendimiento } from '../../components/header-reporte-rendimiento/header-reporte-rendimiento';
import { FiltrosReporteRendimiento } from '../../components/filtros-reporte-rendimiento/filtros-reporte-rendimiento';
import { StatsReporteRendimiento } from '../../components/stats-reporte-rendimiento/stats-reporte-rendimiento';
import { RankingProductos } from '../../components/ranking-productos/ranking-productos';
import { ReporteService } from '../../services/reporte.service';
import { ProductoTop, ReporteFiltros } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-reporte-rendimiento',
  standalone: true,
  imports: [
    CommonModule,
    HeaderReporteRendimiento,
    FiltrosReporteRendimiento,
    StatsReporteRendimiento,
    RankingProductos
  ],
  templateUrl: './reporte-rendimiento.html',
  styleUrl: './reporte-rendimiento.scss',
})
export class ReporteRendimiento {
  private readonly reporteService = inject(ReporteService);

  reportData = signal<ProductoTop[]>([]);
  cargado = signal<boolean>(false);
  loading = signal<boolean>(false);

  onBuscar(filters: ReporteFiltros): void {
    this.loading.set(true);
    this.cargado.set(true);
    this.reporteService.obtenerDatosReporteProductos(filters).subscribe({
      next: (data) => {
        this.reportData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando ranking de productos', err);
        this.loading.set(false);
      }
    });
  }

  exportarExcel(filters: ReporteFiltros): void {
    this.reporteService.exportarExcel(filters, 'productos').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-productos-${Date.now()}.xlsx`;
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
    this.reporteService.exportarPdf(filters, 'productos').subscribe({
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
}
