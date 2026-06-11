import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../interfaces/usuario.interface';
import { HeaderGestionUsuarios } from '../../components/header-gestion-usuarios/header-gestion-usuarios';
import { FiltroGestionUsuarios } from '../../components/filtro-gestion-usuarios/filtro-gestion-usuarios';
import { CardUsuario } from '../../components/card-usuario/card-usuario';
import { FormUsuario } from '../../components/form-usuario/form-usuario';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    PaginatorModule,
    ToastModule,
    ConfirmDialogModule,
    HeaderGestionUsuarios,
    FiltroGestionUsuarios,
    CardUsuario,
    FormUsuario
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.scss',
})
export class GestionUsuarios implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly searchQuery = signal('');
  readonly roleFilter = signal<string | null>(null);

  readonly first = signal(0);
  readonly rows = signal(5);

  readonly filteredUsuarios = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();

    return this.usuarios().filter((user) => {
      const matchesSearch = query === '' ||
        user.nombreCompleto.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole = !role || user.roles.some(r => r.toUpperCase() === role.toUpperCase());

      return matchesSearch && matchesRole;
    });
  });

  readonly paginatedUsuarios = computed(() => {
    const start = this.first();
    const end = start + this.rows();
    return this.filteredUsuarios().slice(start, end);
  });

  readonly formVisible = signal(false);
  readonly selectedUsuario = signal<Usuario | null>(null);

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuarioService.listarPersonal().subscribe({
      next: (response) => {
        this.usuarios.set(response.data || []);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los usuarios de personal',
          life: 3000
        });
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.first.set(0);
  }

  onRoleFilterChange(role: string | null): void {
    this.roleFilter.set(role);
    this.first.set(0);
  }

  onPageChange(event: any): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }

  getStartIndex(): number {
    if (this.filteredUsuarios().length === 0) return 0;
    return this.first() + 1;
  }

  getEndIndex(): number {
    const end = this.first() + this.rows();
    return Math.min(end, this.filteredUsuarios().length);
  }

  onNewUsuario(): void {
    this.selectedUsuario.set(null);
    this.formVisible.set(true);
  }

  onEdit(usuario: Usuario): void {
    this.selectedUsuario.set({ ...usuario });
    this.formVisible.set(true);
  }

  onToggleStatus(usuario: Usuario): void {
    const nuevoEstado = !usuario.activo;
    const desc = nuevoEstado ? 'ACTIVAR' : 'DESACTIVAR';
    
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea ${desc} al usuario "${usuario.nombreCompleto}"?`,
      header: 'Confirmación de Cambio de Estado',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      acceptButtonStyleClass: nuevoEstado ? 'p-button-success' : 'p-button-danger',
      accept: () => {
        this.usuarioService.cambiarEstado(usuario.uuid, nuevoEstado).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`,
              life: 3000
            });
            this.cargarUsuarios();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cambiar el estado del usuario',
              life: 3000
            });
          }
        });
      }
    });
  }

  onSave(input: any): void {
    const selected = this.selectedUsuario();
    if (selected && selected.uuid) {
      // Update
      const updatePayload = {
        email: input.email,
        nombreCompleto: input.nombreCompleto,
        telefono: input.telefono,
        password: input.password || null,
        rol: input.rol
      };
      this.usuarioService.actualizarPersonal(selected.uuid, updatePayload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario actualizado correctamente',
            life: 3000
          });
          this.formVisible.set(false);
          this.cargarUsuarios();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el usuario',
            life: 3000
          });
        }
      });
    } else {
      // Create
      const createPayload = {
        username: input.username,
        email: input.email,
        nombreCompleto: input.nombreCompleto,
        telefono: input.telefono,
        password: input.password,
        rol: input.rol,
        activo: input.activo
      };
      this.usuarioService.crearPersonal(createPayload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario creado correctamente',
            life: 3000
          });
          this.formVisible.set(false);
          this.cargarUsuarios();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el usuario',
            life: 3000
          });
        }
      });
    }
  }
}
