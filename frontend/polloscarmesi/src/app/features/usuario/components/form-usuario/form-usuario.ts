import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { Usuario } from '../../interfaces/usuario.interface';

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    SelectModule,
    CheckboxModule
  ],
  templateUrl: './form-usuario.html',
  styleUrl: './form-usuario.scss',
})
export class FormUsuario implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() usuario: Usuario | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<any>();

  form: FormGroup;

  rolOptions = [
    { label: 'Cajero', value: 'CAJERO' },
    { label: 'Cocina', value: 'COCINA' },
    { label: 'Repartidor', value: 'REPARTIDOR' }
  ];

  constructor() {
    this.form = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rol: ['CAJERO', [Validators.required]],
      activo: [true]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario']) {
      if (this.usuario) {
        // Edit mode
        this.form.get('username')?.disable();
        this.form.get('password')?.setValidators([Validators.minLength(8)]);
        
        let userRol = 'CAJERO';
        if (this.usuario.roles && this.usuario.roles.length > 0) {
          userRol = this.usuario.roles[0];
        }

        this.form.patchValue({
          nombreCompleto: this.usuario.nombreCompleto,
          username: this.usuario.username,
          email: this.usuario.email,
          telefono: this.usuario.telefono || '',
          password: '',
          rol: userRol,
          activo: this.usuario.activo
        });
      } else {
        // Create mode
        this.form.get('username')?.enable();
        this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
        this.form.reset({
          nombreCompleto: '',
          username: '',
          email: '',
          telefono: '',
          password: '',
          rol: 'CAJERO',
          activo: true
        });
      }
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  close(): void {
    this.visibleChange.emit(false);
  }

  onSubmit(): void {
    if (this.form.valid) {
      // Return form value, making sure to include disabled username field if needed
      const rawValue = this.form.getRawValue();
      this.save.emit(rawValue);
    }
  }
}
