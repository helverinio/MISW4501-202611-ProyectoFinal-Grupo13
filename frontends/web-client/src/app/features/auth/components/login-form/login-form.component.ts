import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { LoginRequest } from '../../../../core/models/auth.models';

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

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loginSubmit.emit(this.form.getRawValue());
  }
}
