import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { Producto } from '@/app/features/producto/interfaces/producto.interface';

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-resumen-pedido',
  standalone: true,
  imports: [CommonModule, ButtonModule, InputNumberModule, FormsModule],
  templateUrl: './resumen-pedido.html',
  styleUrl: './resumen-pedido.scss',
})
export class ResumenPedido {
  @Input() items: CartItem[] = [];
  @Input() descuento: number = 0;

  @Output() increaseQuantity = new EventEmitter<Producto>();
  @Output() decreaseQuantity = new EventEmitter<Producto>();
  @Output() updateDescuento = new EventEmitter<number>();
  @Output() confirmPedido = new EventEmitter<void>();

  get subtotal(): number {
    return this.items.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0);
  }

  get total(): number {
    const val = this.subtotal - this.descuento;
    return val < 0 ? 0 : val;
  }

  onIncrease(producto: Producto): void {
    this.increaseQuantity.emit(producto);
  }

  onDecrease(producto: Producto): void {
    this.decreaseQuantity.emit(producto);
  }

  onDescuentoChange(event: any): void {
    const val = event.value !== null ? event.value : 0;
    this.updateDescuento.emit(val);
  }

  onConfirm(): void {
    if (this.items.length > 0) {
      this.confirmPedido.emit();
    }
  }
}
