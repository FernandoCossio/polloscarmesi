import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-dashboard-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-dashboard-admin.html',
  styleUrl: './header-dashboard-admin.scss',
})
export class HeaderDashboardAdmin implements OnInit {
  fechaActual: string = '';

  ngOnInit() {
    const opciones: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const hoy = new Date();
    const fechaStr = hoy.toLocaleDateString('es-ES', opciones);
    // Capitalize first letter (e.g. "Hoy, 12 de Junio de 2026")
    this.fechaActual = `Hoy, ${fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1)}`;
  }
}
