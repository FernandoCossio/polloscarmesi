import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pedido-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats {
  @Input() totalPedidos: number = 0;
  @Input() ingresosTurno: number = 0;
  @Input() pedidosCancelados: number = 0;
}
