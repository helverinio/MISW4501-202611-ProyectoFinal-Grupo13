import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { LoginRequest } from '../../../../core/models/auth.models';
import { I18nService } from '../../../../core/services/i18n.service';

interface LoginForm {
  usuario: FormControl<string>;
  contrasena: FormControl<string>;
}

@Component({
  selector: 'app-login-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
})
export class LoginFormComponent {
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) loading = false;
  @Input() errorMessage = '';

  @Output() loginSubmit = new EventEmitter<LoginRequest>();

  protected readonly form = new FormGroup<LoginForm>({
    usuario: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    contrasena: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  protected passwordVisible = false;

  protected togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loginSubmit.emit(this.form.getRawValue());
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }
}
