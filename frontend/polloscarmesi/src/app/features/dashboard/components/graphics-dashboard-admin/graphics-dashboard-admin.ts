import { afterNextRender, Component, effect, inject, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { LayoutService } from '@/app/layout/service/layout.service';
import { GraficoLineaResponse, GraficoBarrasResponse } from '../../interfaces/dashboard.interface';

@Component({
  selector: 'app-graphics-dashboard-admin',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './graphics-dashboard-admin.html',
  styleUrl: './graphics-dashboard-admin.scss',
})
export class GraphicsDashboardAdmin implements OnChanges {
  @Input() ventasPorHora: GraficoLineaResponse[] = [];
  @Input() topProductos: GraficoBarrasResponse[] = [];

  layoutService = inject(LayoutService);

  chartData = signal<any>(null);
  chartOptions = signal<any>(null);

  maxVendidoVal: number = 1;

  constructor() {
    afterNextRender(() => {
      setTimeout(() => {
        this.initChart();
      }, 150);
    });

    effect(() => {
      this.layoutService.layoutConfig().darkTheme;
      setTimeout(() => {
        this.initChart();
      }, 150);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ventasPorHora'] || changes['topProductos']) {
      this.initChart();
      if (this.topProductos && this.topProductos.length > 0) {
        this.maxVendidoVal = Math.max(...this.topProductos.map(p => Number(p.valor)), 1);
      }
    }
  }

  getPercent(valor: number): number {
    return (Number(valor) / this.maxVendidoVal) * 100;
  }

  initChart() {
    if (!this.ventasPorHora || this.ventasPorHora.length === 0) {
      return;
    }

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
    const borderColor = documentStyle.getPropertyValue('--surface-border') || '#dee2e6';
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
    const primaryColor = documentStyle.getPropertyValue('--p-primary-500') || '#8D4E2D';

    const labels = this.ventasPorHora.map(v => v.label);
    const data = this.ventasPorHora.map(v => v.valor);

    this.chartData.set({
      labels: labels,
      datasets: [
        {
          label: 'Ventas (Bs.)',
          data: data,
          fill: true,
          borderColor: primaryColor,
          tension: 0.4,
          backgroundColor: primaryColor + '15',
          borderWidth: 2.5,
          pointBackgroundColor: primaryColor,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: primaryColor
        }
      ]
    });

    this.chartOptions.set({
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      maintainAspectRatio: false,
      aspectRatio: 1.5,
      scales: {
        x: {
          ticks: {
            color: textMutedColor,
            font: {
              size: 11
            }
          },
          grid: {
            color: 'transparent',
            drawTicks: false
          }
        },
        y: {
          ticks: {
            color: textMutedColor,
            font: {
              size: 11
            }
          },
          grid: {
            color: borderColor,
            drawTicks: false
          }
        }
      }
    });
  }
}
