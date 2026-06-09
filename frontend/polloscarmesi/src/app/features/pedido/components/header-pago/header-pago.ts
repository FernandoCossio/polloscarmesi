import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-pago.html',
  styleUrl: './header-pago.scss',
})
export class HeaderPago {
  @Input() numeroFicha: string = '';
}
