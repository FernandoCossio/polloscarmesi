import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardPedido } from '../../components/card-pedido/card-pedido';
import { PedidoService } from '../../services/pedido.service';
import { Pedido } from '../../interfaces/pedido.interface';

@Component({
  selector: 'app-cola-pedidos',
  standalone: true,
  imports: [CommonModule, ToastModule, CardPedido],
  providers: [MessageService],
  templateUrl: './cola-pedidos.html',
  styleUrl: './cola-pedidos.scss',
})
export class ColaPedidos implements OnInit, OnDestroy {
  private readonly pedidoService = inject(PedidoService);
  private readonly messageService = inject(MessageService);

  readonly pedidos = signal<Pedido[]>([]);
  readonly loading = signal<boolean>(true);

  private pollIntervalId: any;

  readonly pedidosCount = computed(() => this.pedidos().length);

  ngOnInit(): void {
    this.cargarCola();
    // Poll the kitchen queue every 20 seconds
    this.pollIntervalId = setInterval(() => this.cargarCola(true), 20000);
  }

  ngOnDestroy(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
  }

  cargarCola(isPolling = false): void {
    if (!isPolling) {
      this.loading.set(true);
    }
    this.pedidoService.obtenerColaCocina().subscribe({
      next: (data) => {
        this.pedidos.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        if (!isPolling) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la cola de cocina.',
            life: 3000
          });
          this.loading.set(false);
        }
      }
    });
  }

  onListo(pedido: Pedido): void {
    this.pedidoService.actualizarEstadoPedidoCocina(pedido.id, 'LISTO').subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Pedido Listo',
          detail: `Pedido #${pedido.numeroFicha} listo para entrega.`,
          life: 3000
        });
        // Immediately reload queue
        this.cargarCola(true);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo actualizar el estado del pedido #${pedido.numeroFicha}.`,
          life: 3000
        });
      }
    });
  }
}
