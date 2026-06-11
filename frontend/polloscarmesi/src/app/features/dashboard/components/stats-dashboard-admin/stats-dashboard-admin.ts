import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardResumenResponse } from '../../interfaces/dashboard.interface';

@Component({
  selector: 'app-stats-dashboard-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-dashboard-admin.html',
  styleUrl: './stats-dashboard-admin.scss',
})
export class StatsDashboardAdmin {
  @Input() resumen: DashboardResumenResponse | null = null;

  isPositive(percentage: number): boolean {
    return percentage >= 0;
  }

  abs(percentage: number): number {
    return Math.abs(percentage);
  }
}
