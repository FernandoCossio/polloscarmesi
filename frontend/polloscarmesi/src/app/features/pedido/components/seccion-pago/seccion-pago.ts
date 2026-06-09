import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { MetodoPago } from '../../interfaces/pedido.interface';

@Component({
  selector: 'app-seccion-pago',
  standalone: true,
  imports: [CommonModule, ButtonModule, InputNumberModule, FormsModule],
  templateUrl: './seccion-pago.html',
  styleUrl: './seccion-pago.scss',
})
export class SeccionPago implements OnInit {
  @Input() total: number = 0;

  @Output() metodoChange = new EventEmitter<MetodoPago>();
  @Output() montoRecibidoChange = new EventEmitter<number>();
  @Output() isValidChange = new EventEmitter<boolean>();

  selectedMetodo: MetodoPago = 'EFECTIVO';
  montoRecibido: number = 0;

  ngOnInit(): void {
    this.updateValues();
  }

  ngOnChanges(): void {
    if (this.selectedMetodo === 'QR') {
      this.montoRecibido = this.total;
    }
    this.updateValues();
  }

  selectMetodo(metodo: MetodoPago): void {
    this.selectedMetodo = metodo;
    if (metodo === 'QR') {
      this.montoRecibido = this.total;
    } else {
      this.montoRecibido = 0;
    }
    this.updateValues();
  }

  onMontoInput(event: any): void {
    this.montoRecibido = event.value !== null ? event.value : 0;
    this.updateValues();
  }

  get cambio(): number {
    if (this.selectedMetodo === 'QR') return 0;
    const diff = this.montoRecibido - this.total;
    return diff < 0 ? 0 : diff;
  }

  get isValid(): boolean {
    return this.montoRecibido >= this.total;
  }

  private updateValues(): void {
    this.metodoChange.emit(this.selectedMetodo);
    this.montoRecibidoChange.emit(this.montoRecibido);
    this.isValidChange.emit(this.isValid);
  }
}
