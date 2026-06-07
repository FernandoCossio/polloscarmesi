import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Categoria } from '../../interfaces/categoria.interface';

@Component({
  selector: 'app-categoria-card',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  @Input({ required: true }) categoria!: Categoria;
  @Output() edit = new EventEmitter<Categoria>();
  @Output() delete = new EventEmitter<Categoria>();



  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.categoria);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.categoria);
  }
}
