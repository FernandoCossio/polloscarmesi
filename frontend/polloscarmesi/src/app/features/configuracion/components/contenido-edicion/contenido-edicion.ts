import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { Configuracion, ConfiguracionInput } from '../../interfaces/configuracion.interface';

@Component({
  selector: 'app-contenido-edicion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule
  ],
  templateUrl: './contenido-edicion.html',
  styleUrl: './contenido-edicion.scss',
})
export class ContenidoEdicion implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() configuracion: Configuracion | null = null;
  @Input() saving = false;

  @Output() save = new EventEmitter<ConfiguracionInput>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nombreRestaurante: ['', [Validators.required, Validators.minLength(3)]],
      ruc: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      horarioAtencion: ['', [Validators.required]],
      tiempoMaximoPreparacion: [30, [Validators.required, Validators.min(1)]],
      umbralAlertaCocina: [10, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['configuracion'] && this.configuracion) {
      this.form.patchValue({
        nombreRestaurante: this.configuracion.nombreRestaurante,
        ruc: this.configuracion.ruc,
        direccion: this.configuracion.direccion,
        telefono: this.configuracion.telefono,
        horarioAtencion: this.configuracion.horarioAtencion,
        tiempoMaximoPreparacion: this.configuracion.tiempoMaximoPreparacion,
        umbralAlertaCocina: this.configuracion.umbralAlertaCocina
      });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
