import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Pedido } from '../../interfaces/pedido.interface';

@Component({
  selector: 'app-card-pedido',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './card-pedido.html',
  styleUrl: './card-pedido.scss',
})
export class CardPedido implements OnInit, OnDestroy {
  @Input({ required: true }) pedido!: Pedido;
  @Output() listo = new EventEmitter<Pedido>();

  elapsedTime = '00 min';
  private timerId: any;

  ngOnInit(): void {
    this.updateElapsedTime();
    this.timerId = setInterval(() => this.updateElapsedTime(), 60000); // update every minute
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private updateElapsedTime(): void {
    if (!this.pedido || !this.pedido.fechaCreacion) {
      this.elapsedTime = '00 min';
      return;
    }
    try {
      const creacion = new Date(this.pedido.fechaCreacion);
      const ahora = new Date();
      const diffMs = ahora.getTime() - creacion.getTime();
      const diffMins = Math.max(0, Math.floor(diffMs / 60000));
      this.elapsedTime = `${diffMins.toString().padStart(2, '0')} min`;
    } catch {
      this.elapsedTime = '00 min';
    }
  }

  get elapsedMinutes(): number {
    if (!this.pedido || !this.pedido.fechaCreacion) return 0;
    try {
      const creacion = new Date(this.pedido.fechaCreacion);
      const ahora = new Date();
      return Math.max(0, Math.floor((ahora.getTime() - creacion.getTime()) / 60000));
    } catch {
      return 0;
    }
  }

  get displayedItems() {
    if (!this.pedido.detalles) return [];
    return this.pedido.detalles.slice(0, 4);
  }

  get remainingItemsCount(): number {
    if (!this.pedido.detalles) return 0;
    return this.pedido.detalles.length - 4;
  }

  onListoClick(): void {
    this.listo.emit(this.pedido);
  }
}
