import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { HeaderHistorial } from '../../components/header-historial/header-historial';
import { Stats } from '../../components/stats/stats';
import { TablaHistorial } from '../../components/tabla-historial/tabla-historial';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../interfaces/pedido.interface';

@Component({
  selector: 'app-historial-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    HeaderHistorial,
    Stats,
    TablaHistorial
  ],
  providers: [MessageService],
  templateUrl: './historial-pedidos.html',
  styleUrl: './historial-pedidos.scss',
})
export class HistorialPedidos implements OnInit {
  private readonly pedidoService = inject(PedidoService);
  private readonly messageService = inject(MessageService);

  readonly pedidos = signal<Pedido[]>([]);
  readonly loading = signal<boolean>(true);

  // Dialog States
  selectedPedido = signal<Pedido | null>(null);
  verDetallesVisible = signal<boolean>(false);
  cancelarVisible = signal<boolean>(false);
  motivoCancelacion = signal<string>('');

  // Stats Calculations
  readonly totalPedidos = computed(() => this.pedidos().length);
  
  readonly ingresosTurno = computed(() => {
    return this.pedidos()
      .filter((p) => p.estado !== 'CANCELADO')
      .reduce((sum, p) => sum + p.total, 0);
  });

  readonly pedidosCancelados = computed(() => {
    return this.pedidos().filter((p) => p.estado === 'CANCELADO').length;
  });

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.loading.set(true);
    // Obtener la fecha de hoy en formato YYYY-MM-DD local
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const fechaStr = `${year}-${month}-${day}`;

    this.pedidoService.obtenerPedidosPorFecha(fechaStr).subscribe({
      next: (data) => {
        this.pedidos.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los pedidos del turno.',
          life: 3000
        });
        this.loading.set(false);
      }
    });
  }

  onVerDetalles(pedido: Pedido): void {
    this.selectedPedido.set(pedido);
    this.verDetallesVisible.set(true);
  }

  onCancelarPedido(pedido: Pedido): void {
    this.selectedPedido.set(pedido);
    this.motivoCancelacion.set('');
    this.cancelarVisible.set(true);
  }

  confirmarCancelacion(): void {
    const ped = this.selectedPedido();
    const motivo = this.motivoCancelacion().trim();
    if (!ped || !motivo) return;

    this.pedidoService.cancelarPedido(ped.id, motivo).subscribe({
      next: (updatedPedido) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Pedido Cancelado',
          detail: `Pedido #${updatedPedido.numeroFicha} ha sido cancelado exitosamente.`,
          life: 5000
        });
        this.cancelarVisible.set(false);
        this.cargarPedidos();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cancelar el pedido.',
          life: 3000
        });
      }
    });
  }
}
