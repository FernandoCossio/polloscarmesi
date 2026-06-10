import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CierreCajaData } from '../../interfaces/reporte.interface';

@Component({
  selector: 'app-contenido-reporte-cierre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contenido-reporte-cierre.html',
  styleUrl: './contenido-reporte-cierre.scss',
})
export class ContenidoReporteCierre {
  @Input() data: CierreCajaData | null = null;
  @Input() cargado: boolean = false;

  get absDiferencia(): number {
    if (!this.data) return 0;
    return Math.abs(this.data.diferenciaEfectivo);
  }
}
