import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatorModule } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductoService } from '../../services/producto.service';
import { Producto, ProductoInput } from '../../interfaces/producto.interface';
import { Categoria } from '../../interfaces/categoria.interface';
import { Header } from '../../components/header/header';
import { Filter } from '../../components/filter/filter';
import { Card } from '../../components/card/card';
import { Form } from '../../components/form/form';
import { ImageDialog } from '../../components/image-dialog/image-dialog';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    CommonModule,
    PaginatorModule,
    ToastModule,
    ConfirmDialogModule,
    Header,
    Filter,
    Card,
    Form,
    ImageDialog
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class List implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly productos = signal<Producto[]>([]);
  readonly categorias = signal<Categoria[]>([]);
  
  readonly searchQuery = signal('');
  readonly categoryFilterId = signal<string | null>(null);
  
  readonly first = signal(0);
  readonly rows = signal(5); // Default to 5 items per page for horizontal rows

  readonly filteredProductos = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const catId = this.categoryFilterId();
    
    return this.productos().filter((prod) => {
      const matchesSearch = query === '' || 
        prod.nombre.toLowerCase().includes(query) ||
        (prod.descripcion && prod.descripcion.toLowerCase().includes(query));
      
      const matchesCategory = !catId || (prod.categoria && prod.categoria.id === catId);
      
      return matchesSearch && matchesCategory;
    });
  });

  readonly paginatedProductos = computed(() => {
    const start = this.first();
    const end = start + this.rows();
    return this.filteredProductos().slice(start, end);
  });

  readonly formVisible = signal(false);
  readonly selectedProducto = signal<Producto | null>(null);
  readonly imageDialogVisible = signal(false);
  readonly selectedProductoForImage = signal<Producto | null>(null);

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias();
  }

  cargarProductos(): void {
    this.productoService.obtenerMenu().subscribe({
      next: (data) => {
        this.productos.set(data || []);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los productos',
          life: 3000
        });
      }
    });
  }

  cargarCategorias(): void {
    this.productoService.obtenerCategorias().subscribe({
      next: (data) => {
        this.categorias.set(data || []);
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.first.set(0);
  }

  onCategoryFilterChange(catId: string | null): void {
    this.categoryFilterId.set(catId);
    this.first.set(0);
  }

  onPageChange(event: any): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }

  getStartIndex(): number {
    if (this.filteredProductos().length === 0) return 0;
    return this.first() + 1;
  }

  getEndIndex(): number {
    const end = this.first() + this.rows();
    return Math.min(end, this.filteredProductos().length);
  }

  onNewProduct(): void {
    this.selectedProducto.set(null);
    this.formVisible.set(true);
  }

  onEdit(producto: Producto): void {
    this.selectedProducto.set({ ...producto });
    this.formVisible.set(true);
  }

  onToggleAvailability(event: { id: string; disponible: boolean }): void {
    this.productoService.actualizarDisponibilidadProducto(event.id, event.disponible).subscribe({
      next: (updated) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado de disponibilidad actualizado a ${updated.disponible ? 'Disponible' : 'No disponible'}`,
          life: 2000
        });
        this.cargarProductos();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar la disponibilidad',
          life: 3000
        });
      }
    });
  }

  onDelete(producto: Producto): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el producto "${producto.nombre}"?`,
      header: 'Confirmación de Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (producto.id) {
          this.productoService.eliminarProducto(producto.id).subscribe({
            next: (success) => {
              if (success) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Éxito',
                  detail: 'Producto eliminado correctamente',
                  life: 3000
                });
                this.cargarProductos();
              }
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar el producto',
                life: 3000
              });
            }
          });
        }
      }
    });
  }

  onCategoryCreated(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Categoría Creada',
      detail: 'La categoría se creó correctamente',
      life: 3000
    });
    this.cargarCategorias();
  }

  onSave(input: ProductoInput): void {
    const prod = this.selectedProducto();
    if (prod && prod.id) {
      // Update
      this.productoService.actualizarProducto(prod.id, input).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Producto actualizado correctamente',
            life: 3000
          });
          this.formVisible.set(false);
          this.cargarProductos();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el producto',
            life: 3000
          });
        }
      });
    } else {
      // Create
      this.productoService.crearProducto(input).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Producto creado correctamente',
            life: 3000
          });
          this.formVisible.set(false);
          this.cargarProductos();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el producto',
            life: 3000
          });
        }
      });
    }
  }

  onUploadImage(producto: Producto): void {
    this.selectedProductoForImage.set(producto);
    this.imageDialogVisible.set(true);
  }

  onImageUploaded(updatedProduct: Producto): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `Imagen para "${updatedProduct.nombre}" actualizada correctamente`,
      life: 3000
    });
    this.cargarProductos();
  }
}
