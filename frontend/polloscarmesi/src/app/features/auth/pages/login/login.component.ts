import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '@/app/features/auth/services/auth.service';
import { AppFloatingConfigurator } from '@/app/layout/component/app.floatingconfigurator';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, RippleModule, AppFloatingConfigurator],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username: string = '';

  password: string = '';

  checked: boolean = false;

  isSubmitting = false;
  errorMessage: string | null = null;

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Ingrese usuario y contraseña';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.isSubmitting = false;
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Credenciales inválidas';
      },
    });
  }
}
