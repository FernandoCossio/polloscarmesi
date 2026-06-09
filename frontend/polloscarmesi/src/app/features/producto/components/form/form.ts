import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { Producto, ProductoInput } from '../../interfaces/producto.interface';
import { Categoria } from '../../interfaces/categoria.interface';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    SelectModule
  ],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class Form implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);

  @Input() visible = false;
  @Input() producto: Producto | null = null;
  @Input() categorias: Categoria[] | null = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<ProductoInput>();
  @Output() categoryCreated = new EventEmitter<Categoria>();

  form: FormGroup;
  
  // Inline category creation sub-dialog controls
  catDialogVisible = false;
  catForm: FormGroup;
  catPresetIcons: string[] = [
    'restaurant',
    'lunch_dining',
    'dinner_dining',
    'restaurant_menu',
    'ramen_dining',
    'fastfood',
    'local_pizza',
    'bakery_dining',
    'icecream',
    'cake',
    'emoji_food_beverage',
    'local_cafe',
    'liquor',
    'local_bar',
    'wine_bar',
    'local_drink',
    'egg',
    'set_meal',
    'takeout_dining'
  ];

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      precio: [null, [Validators.required, Validators.min(0.01)]],
      categoriaId: ['', [Validators.required]]
    });

    this.catForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      icon: ['restaurant', [Validators.required]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['producto'] && this.producto) {
      this.form.patchValue({
        nombre: this.producto.nombre,
        descripcion: this.producto.descripcion || '',
        precio: this.producto.precio,
        categoriaId: this.producto.categoria?.id || ''
      });
    } else if (changes['visible'] && !this.visible) {
      this.form.reset({
        nombre: '',
        descripcion: '',
        precio: null,
        categoriaId: ''
      });
    }
  }

  selectCatIcon(icon: string): void {
    this.catForm.get('icon')?.setValue(icon);
  }

  openNewCategoryDialog(): void {
    this.catForm.reset({
      nombre: '',
      descripcion: '',
      icon: 'restaurant'
    });
    this.catDialogVisible = true;
  }

  saveCategory(): void {
    if (this.catForm.valid) {
      this.productoService.crearCategoria(this.catForm.value).subscribe({
        next: (nuevaCat) => {
          this.categoryCreated.emit(nuevaCat);
          // Auto-select the newly created category
          this.form.get('categoriaId')?.setValue(nuevaCat.id);
          this.catDialogVisible = false;
        }
      });
    }
  }

  close(): void {
    this.visibleChange.emit(false);
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }
}
