import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Producto } from '../../interfaces/producto.interface';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  @Input({ required: true }) producto!: Producto;
  @Output() edit = new EventEmitter<Producto>();
  @Output() delete = new EventEmitter<Producto>();
  @Output() availabilityToggle = new EventEmitter<{ id: string; disponible: boolean }>();

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.producto);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.producto);
  }

  onToggleAvailability(event: Event): void {
    event.stopPropagation();
    this.availabilityToggle.emit({
      id: this.producto.id,
      disponible: !this.producto.disponible
    });
  }
}
