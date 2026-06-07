import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { Categoria, CategoriaInput } from '../../interfaces/categoria.interface';
import { ICONOS_CATEGORIA } from '../../constants/iconos.constant';

@Component({
  selector: 'app-categoria-form',
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
  @Input() visible = false;
  @Input() categoria: Categoria | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<CategoriaInput>();

  form: FormGroup;
  iconosList = ICONOS_CATEGORIA;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      icon: ['restaurant', [Validators.required]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoria'] && this.categoria) {
      this.form.patchValue({
        nombre: this.categoria.nombre,
        descripcion: this.categoria.descripcion || '',
        icon: this.categoria.icon || 'restaurant'
      });
    } else if (changes['visible'] && !this.visible) {
      this.form.reset({
        nombre: '',
        descripcion: '',
        icon: 'restaurant'
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
