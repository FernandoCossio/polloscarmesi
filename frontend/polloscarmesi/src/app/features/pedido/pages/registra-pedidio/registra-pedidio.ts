import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HeaderPedido } from '../../components/header-pedido/header-pedido';
import { Menu } from '../../components/menu/menu';
import { ResumenPedido, CartItem } from '../../components/resumen-pedido/resumen-pedido';
import { ProductoService } from '@/app/features/producto/services/producto.service';
import { PedidoService } from '../../services/pedido.service';
import { Categoria } from '@/app/features/categoria/interfaces/categoria.interface';
import { Producto } from '@/app/features/producto/interfaces/producto.interface';

@Component({
  selector: 'app-registra-pedidio',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    HeaderPedido,
    Menu,
    ResumenPedido
  ],
  providers: [MessageService],
  templateUrl: './registra-pedidio.html',
  styleUrl: './registra-pedidio.scss',
})
export class RegistraPedidio implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly pedidoService = inject(PedidoService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  readonly categorias = signal<Categoria[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly selectedCategoriaId = signal<string | number | null>(null);
  readonly searchQuery = signal<string>('');
  readonly cartItems = signal<CartItem[]>([]);
  readonly descuento = signal<number>(0);

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  cargarCategorias(): void {
    this.productoService.obtenerCategorias().subscribe({
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

  cargarProductos(): void {
    const catId = this.selectedCategoriaId();
    this.productoService.obtenerMenu(catId !== null ? catId : undefined).subscribe({
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

  onSelectCategoria(id: string | number | null): void {
    this.selectedCategoriaId.set(id);
    this.cargarProductos();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  readonly filteredProductos = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const prods = this.productos();
    if (!query) {
      return prods;
    }
    return prods.filter((p) =>
      p.nombre.toLowerCase().includes(query) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(query))
    );
  });

  onAddProducto(producto: Producto): void {
    const items = [...this.cartItems()];
    const existing = items.find((item) => item.producto.id === producto.id);
    if (existing) {
      existing.cantidad += 1;
    } else {
      items.push({ producto, cantidad: 1 });
    }
    this.cartItems.set(items);
    this.messageService.add({
      severity: 'info',
      summary: 'Agregado',
      detail: `${producto.nombre} agregado al pedido`,
      life: 1500
    });
  }

  onIncreaseQuantity(producto: Producto): void {
    const items = [...this.cartItems()];
    const existing = items.find((item) => item.producto.id === producto.id);
    if (existing) {
      existing.cantidad += 1;
      this.cartItems.set(items);
    }
  }

  onDecreaseQuantity(producto: Producto): void {
    const items = [...this.cartItems()];
    const index = items.findIndex((item) => item.producto.id === producto.id);
    if (index !== -1) {
      if (items[index].cantidad > 1) {
        items[index].cantidad -= 1;
      } else {
        items.splice(index, 1);
      }
      this.cartItems.set(items);
    }
  }

  onUpdateDescuento(val: number): void {
    this.descuento.set(val);
  }

  onConfirmPedido(): void {
    if (this.cartItems().length === 0) return;

    const detalles = this.cartItems().map((item) => ({
      productoId: item.producto.id,
      cantidad: item.cantidad
    }));

    const input = {
      tipo: 'PRESENCIAL' as const,
      descuento: this.descuento(),
      detalles
    };

    this.pedidoService.crearPedidoPresencial(input).subscribe({
      next: (pedido) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Pedido Confirmado',
          detail: `Ficha N°: ${pedido.numeroFicha} generada automáticamente`,
          life: 5000
        });
        this.cartItems.set([]);
        this.descuento.set(0);
        // Redirigir a registrar pago con query params
        setTimeout(() => {
          this.router.navigate(['/registrar-pago'], { queryParams: { pedidoId: pedido.id } });
        }, 1000);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el pedido presencial',
          life: 3000
        });
      }
    });
  }
}
