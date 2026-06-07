import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoriaService } from '../../services/categoria.service';
import { Categoria, CategoriaInput } from '../../interfaces/categoria.interface';
import { Header } from '../../components/header/header';
import { Filter } from '../../components/filter/filter';
import { Card } from '../../components/card/card';
import { Form } from '../../components/form/form';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [
    CommonModule,
    PaginatorModule,
    ToastModule,
    ConfirmDialogModule,
    Header,
    Filter,
    Card,
    Form
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List implements OnInit {
  private readonly categoriaService = inject(CategoriaService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly categorias = signal<Categoria[]>([]);
  readonly searchQuery = signal('');
  readonly first = signal(0);
  readonly rows = signal(8);

  readonly filteredCategorias = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.categorias();
    }
    return this.categorias().filter((cat) =>
      cat.nombre.toLowerCase().includes(query) ||
      (cat.descripcion && cat.descripcion.toLowerCase().includes(query))
    );
  });

  readonly paginatedCategorias = computed(() => {
    const start = this.first();
    const end = start + this.rows();
    return this.filteredCategorias().slice(start, end);
  });

  readonly formVisible = signal(false);
  readonly selectedCategoria = signal<Categoria | null>(null);

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerCategorias().subscribe({
      next: (data) => {
        this.categorias.set(data || []);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las categorías',
          life: 3000
        });
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.first.set(0);
  }

  onPageChange(event: any): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }

  getStartIndex(): number {
    if (this.filteredCategorias().length === 0) return 0;
    return this.first() + 1;
  }

  getEndIndex(): number {
    const end = this.first() + this.rows();
    return Math.min(end, this.filteredCategorias().length);
  }

  onNewCategory(): void {
    this.selectedCategoria.set(null);
    this.formVisible.set(true);
  }

  onEdit(categoria: Categoria): void {
    this.selectedCategoria.set({ ...categoria });
    this.formVisible.set(true);
  }

  onDelete(categoria: Categoria): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar la categoría "${categoria.nombre}"?`,
      header: 'Confirmación de Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (categoria.id) {
          this.categoriaService.eliminarCategoria(categoria.id).subscribe({
            next: (success) => {
              if (success) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Éxito',
                  detail: 'Categoría eliminada correctamente',
                  life: 3000
                });
                this.cargarCategorias();
              }
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar la categoría',
                life: 3000
              });
            }
          });
        }
      }
    });
  }

  onSave(input: CategoriaInput): void {
    const cat = this.selectedCategoria();
    if (cat && cat.id) {
      this.categoriaService.actualizarCategoria(cat.id, input).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Categoría actualizada correctamente',
            life: 3000
          });
          this.formVisible.set(false);
          this.cargarCategorias();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la categoría',
            life: 3000
          });
        }
      });
    } else {
      this.categoriaService.crearCategoria(input).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Categoría creada correctamente',
            life: 3000
          });
          this.formVisible.set(false);
          this.cargarCategorias();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la categoría',
            life: 3000
          });
        }
      });
    }
  }
}
