import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pago-estado-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago-estado-badge.html',
  styleUrl: './pago-estado-badge.scss',
})
export class PagoEstadoBadge {
  @Input() estado!: string;
  @Input() mostrarIcono = true;

  get label(): string {
    if (this.estado === 'PENDIENTE') return 'Pendiente';
    if (this.estado === 'ACEPTADO') return 'Aceptado';
    if (this.estado === 'RECHAZADO') return 'Rechazado';
    if (this.estado === 'REVISION_MANUAL') return 'Revisión';
    return this.estado || '';
  }

  get iconClass(): string {
    if (this.estado === 'PENDIENTE') return 'pi pi-clock';
    if (this.estado === 'ACEPTADO') return 'pi pi-check-circle';
    if (this.estado === 'RECHAZADO') return 'pi pi-times-circle';
    if (this.estado === 'REVISION_MANUAL') return 'pi pi-eye';
    return '';
  }
}
