import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DashboardService } from '../../services/dashboard.service';
import { PedidoService } from '../../../pedido/services/pedido.service';
import { HeaderDashboardAdmin } from '../../components/header-dashboard-admin/header-dashboard-admin';
import { StatsDashboardAdmin } from '../../components/stats-dashboard-admin/stats-dashboard-admin';
import { GraphicsDashboardAdmin } from '../../components/graphics-dashboard-admin/graphics-dashboard-admin';
import { TableDashboardAdmin } from '../../components/table-dashboard-admin/table-dashboard-admin';
import { DashboardResumenResponse, GraficoLineaResponse, GraficoBarrasResponse } from '../../interfaces/dashboard.interface';
import { Pedido } from '../../../pedido/interfaces/pedido.interface';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    HeaderDashboardAdmin,
    StatsDashboardAdmin,
    GraphicsDashboardAdmin,
    TableDashboardAdmin,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly pedidoService = inject(PedidoService);

  resumen = signal<DashboardResumenResponse | null>(null);
  ventasPorHora = signal<GraficoLineaResponse[]>([]);
  topProductos = signal<GraficoBarrasResponse[]>([]);
  pedidos = signal<Pedido[]>([]);
  
  loading = signal<boolean>(true);

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading.set(true);
    const hoyStr = new Date().toISOString().split('T')[0];

    // Cargar en paralelo
    this.dashboardService.getResumenKPIs().subscribe({
      next: (data) => this.resumen.set(data),
      error: (err) => console.error('Error al cargar resumen KPIs', err)
    });

    this.dashboardService.getVentasPorHora().subscribe({
      next: (data) => this.ventasPorHora.set(data),
      error: (err) => console.error('Error al cargar ventas por hora', err)
    });

    this.dashboardService.getTopProductos().subscribe({
      next: (data) => this.topProductos.set(data),
      error: (err) => console.error('Error al cargar top productos', err)
    });

    this.pedidoService.obtenerPedidosPorFecha(hoyStr).subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) => {
          const tA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
          const tB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
          return tB - tA;
        });
        this.pedidos.set(sorted.slice(0, 5));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar pedidos del día', err);
        this.loading.set(false);
      }
    });
  }
}
