import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { RegisterAdminResponse } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-setup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-setup-page.component.html',
})
export class AdminSetupPageComponent {
  readonly registerForm;
  readonly verifyForm;

  setupData: RegisterAdminResponse | null = null;
  qrCodeUrl = '';
  registerError = '';
  verifyError = '';
  verifySuccess = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
    });

    this.verifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    });
  }

  registerAdmin(): void {
    this.registerError = '';
    this.verifySuccess = '';
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.authService
      .registerAdmin({
        nombre: this.registerForm.controls.nombre.value ?? '',
        email: this.registerForm.controls.email.value ?? '',
        contrasena: this.registerForm.controls.contrasena.value ?? '',
      })
      .subscribe({
        next: (response: RegisterAdminResponse) => {
          this.setupData = response;
          this.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(response.otpauth_uri)}`;
          this.verifyForm.controls.email.setValue(response.email);
        },
        error: (error: any) => {
          this.registerError = error?.error?.error ?? 'No fue posible registrar administrador';
        },
      });
  }

  verifySetup(): void {
    this.verifyError = '';
    this.verifySuccess = '';

    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.authService
      .verifySetup(this.verifyForm.controls.email.value ?? '', this.verifyForm.controls.code.value ?? '')
      .subscribe({
        next: () => {
          this.verifySuccess = 'MFA activado correctamente. Ya puedes iniciar sesión.';
        },
        error: (error: any) => {
          this.verifyError = error?.error?.error ?? 'No fue posible verificar el código';
        },
      });
  }
}
