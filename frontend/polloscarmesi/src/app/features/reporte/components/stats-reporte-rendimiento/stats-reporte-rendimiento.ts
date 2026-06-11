import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoTop } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-stats-reporte-rendimiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-reporte-rendimiento.html',
  styleUrl: './stats-reporte-rendimiento.scss',
})
export class StatsReporteRendimiento {
  @Input() data: ProductoTop[] = [];

  get topProducto(): ProductoTop | null {
    return this.data.length > 0 ? this.data[0] : null;
  }

  get totalUnidades(): number {
    return this.data.reduce((sum, item) => sum + (item.cantidadVendida || 0), 0);
  }

  get totalRecaudado(): number {
    return this.data.reduce((sum, item) => sum + (item.totalRecaudado || 0), 0);
  }
}
