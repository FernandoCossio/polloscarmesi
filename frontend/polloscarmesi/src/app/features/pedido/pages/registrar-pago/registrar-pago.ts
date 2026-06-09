import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { HeaderPago } from '../../components/header-pago/header-pago';
import { SeccionPago } from '../../components/seccion-pago/seccion-pago';
import { SeccionComprobante } from '../../components/seccion-comprobante/seccion-comprobante';
import { PedidoService } from '../../services/pedido.service';
import { Pedido, MetodoPago } from '../../interfaces/pedido.interface';

@Component({
  selector: 'app-registrar-pago',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ButtonModule,
    HeaderPago,
    SeccionPago,
    SeccionComprobante
  ],
  providers: [MessageService],
  templateUrl: './registrar-pago.html',
  styleUrl: './registrar-pago.scss',
})
export class RegistrarPago implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pedidoService = inject(PedidoService);
  private readonly messageService = inject(MessageService);

  readonly pedido = signal<Pedido | null>(null);
  readonly loading = signal<boolean>(true);

  // Form State
  metodo: MetodoPago = 'EFECTIVO';
  montoRecibido: number = 0;
  comprobanteFile: File | null = null;
  isValidPayment: boolean = false;
  submitting: boolean = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const pedidoId = params['pedidoId'];
      if (pedidoId) {
        this.cargarPedido(pedidoId);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se especificó un ID de pedido válido.',
          life: 3000
        });
        this.router.navigate(['/registrar-pedido']);
      }
    });
  }

  cargarPedido(id: string | number): void {
    this.loading.set(true);
    this.pedidoService.obtenerPedido(id).subscribe({
      next: (data) => {
        this.pedido.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los detalles del pedido.',
          life: 3000
        });
        this.loading.set(false);
        this.router.navigate(['/registrar-pedido']);
      }
    });
  }

  onMetodoChange(metodo: MetodoPago): void {
    this.metodo = metodo;
    if (metodo !== 'QR') {
      this.comprobanteFile = null;
    }
  }

  onMontoRecibidoChange(monto: number): void {
    this.montoRecibido = monto;
  }

  onIsValidChange(valid: boolean): void {
    this.isValidPayment = valid;
  }

  onFileSelect(file: File | null): void {
    this.comprobanteFile = file;
  }

  get totalItemsCount(): number {
    const ped = this.pedido();
    if (!ped || !ped.detalles) return 0;
    return ped.detalles.reduce((sum, det) => sum + det.cantidad, 0);
  }

  cancelar(): void {
    this.router.navigate(['/registrar-pedido']);
  }

  registrarPago(): void {
    const ped = this.pedido();
    if (!ped || !this.isValidPayment || this.submitting) return;

    const input = {
      pedidoId: ped.id,
      metodo: this.metodo,
      montoRecibido: this.montoRecibido
    };

    let comprobanteSubido = true;
    this.submitting = true;
    this.pedidoService.registrarPago(input).pipe(
      switchMap((pago) => {
        if (this.metodo === 'QR' && this.comprobanteFile) {
          return this.pedidoService.subirComprobantePago(pago.id, this.comprobanteFile).pipe(
            catchError(() => {
              comprobanteSubido = false;
              return of(pago);
            })
          );
        }
        return of(pago);
      }),
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: comprobanteSubido ? 'success' : 'warn',
          summary: comprobanteSubido ? 'Pago Registrado' : 'Pago Registrado (sin comprobante)',
          detail: comprobanteSubido
            ? 'El pago ha sido registrado exitosamente.'
            : 'El pago se registró, pero no se pudo subir el comprobante.',
          life: 3000
        });
        setTimeout(() => {
          this.router.navigate(['/registrar-pedido']);
        }, 1500);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo completar el registro del pago.',
          life: 3000
        });
      }
    });
  }
}
