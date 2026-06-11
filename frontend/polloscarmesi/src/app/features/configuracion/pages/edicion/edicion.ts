import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HeaderEdicion } from '../../components/header-edicion/header-edicion';
import { ContenidoEdicion } from '../../components/contenido-edicion/contenido-edicion';
import { ConfiguracionService } from '../../services/configuracion.service';
import { Configuracion, ConfiguracionInput } from '../../interfaces/configuracion.interface';

@Component({
  selector: 'app-configuracion-edicion',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    HeaderEdicion,
    ContenidoEdicion
  ],
  providers: [MessageService],
  templateUrl: './edicion.html',
  styleUrl: './edicion.scss',
})
export class Edicion implements OnInit {
  private readonly configService = inject(ConfiguracionService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  configData = signal<Configuracion | null>(null);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.loading.set(true);
    this.configService.obtenerConfiguracion().subscribe({
      next: (data) => {
        this.configData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando la configuración', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la configuración del sistema',
          life: 3000
        });
        this.loading.set(false);
      }
    });
  }

  onSave(input: ConfiguracionInput): void {
    this.saving.set(true);
    this.configService.actualizarConfiguracion(input).subscribe({
      next: (updated) => {
        this.configData.set(updated);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Configuración actualizada correctamente',
          life: 3000
        });
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error actualizando la configuración', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la configuración',
          life: 3000
        });
        this.saving.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }
}
