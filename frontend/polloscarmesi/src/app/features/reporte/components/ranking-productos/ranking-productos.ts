import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProductoTop } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-ranking-productos',
  standalone: true,
  imports: [CommonModule, TableModule, BadgeModule, ProgressBarModule],
  templateUrl: './ranking-productos.html',
  styleUrl: './ranking-productos.scss',
})
export class RankingProductos {
  @Input() data: ProductoTop[] = [];
  @Input() cargado: boolean = false;

  get maxQuantity(): number {
    if (this.data.length === 0) return 1;
    const max = Math.max(...this.data.map(item => item.cantidadVendida || 0));
    return max > 0 ? max : 1;
  }

  getProgressWidth(qty: number): string {
    const pct = Math.round((qty / this.maxQuantity) * 100);
    return `${pct}%`;
  }
}
