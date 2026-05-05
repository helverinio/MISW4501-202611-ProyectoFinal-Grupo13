import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { LoginRequest, RegisterUserRequest } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';
import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, LoginFormComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  protected readonly countryPhoneCodes = [
    { code: '+57', label: 'Colombia (+57)' },
    { code: '+1', label: 'USA (+1)' },
    { code: '+55', label: 'Brasil (+55)' },
    { code: '+52', label: 'Mexico (+52)' },
    { code: '+54', label: 'Argentina (+54)' },
    { code: '+56', label: 'Chile (+56)' },
    { code: '+51', label: 'Peru (+51)' },
    { code: '+593', label: 'Ecuador (+593)' },
    { code: '+58', label: 'Venezuela (+58)' },
    { code: '+34', label: 'Espana (+34)' },
    { code: '+44', label: 'Reino Unido (+44)' },
    { code: '+49', label: 'Alemania (+49)' },
  ] as const;

  protected readonly activeTab = signal<'signin' | 'signup'>('signin');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly signupLoading = signal(false);
  protected readonly signupSubmitted = signal(false);
  protected readonly signupErrorMessage = signal('');
  protected readonly signupSuccessMessage = signal('');

  protected readonly signupForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phonePrefix: ['+57'],
    phone: ['', [Validators.required]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
    confirmPassword: ['', [Validators.required]],
    termsAccepted: [false, [Validators.requiredTrue]],
    marketingAccepted: [false],
  });

  protected setTab(tab: 'signin' | 'signup'): void {
    this.activeTab.set(tab);
    this.errorMessage.set('');
    this.signupErrorMessage.set('');
    this.signupSuccessMessage.set('');
  }

  protected onLogin(payload: LoginRequest): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(payload).subscribe({
      next: () => {
        const redirectTo =
          this.route.snapshot.queryParamMap.get('redirectTo') || '/app/home-search';
        void this.router.navigateByUrl(redirectTo);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.resolveErrorMessage(error));
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  protected onSignup(): void {
    this.signupSubmitted.set(true);
    this.signupErrorMessage.set('');
    this.signupSuccessMessage.set('');

    const password = this.signupForm.controls.password.value;
    const confirmPassword = this.signupForm.controls.confirmPassword.value;

    if (password !== confirmPassword) {
      this.signupErrorMessage.set('Passwords do not match.');
      return;
    }

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.signupLoading.set(true);

    const payload = this.buildRegisterPayload();
    this.authService
      .register(payload)
      .pipe(finalize(() => this.signupLoading.set(false)))
      .subscribe({
        next: () => {
          this.onSignupSuccess(payload.email);
        },
        error: (error: HttpErrorResponse) => {
          this.signupErrorMessage.set(this.resolveSignupErrorMessage(error));
        },
      });
  }

  private onSignupSuccess(email: string): void {
    this.signupSuccessMessage.set(
      `Account created! We've sent a verification link to ${email}. Please check your inbox and verify your email before signing in.`,
    );
    this.signupForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phonePrefix: '+57',
      phone: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
      marketingAccepted: false,
    });
    this.signupSubmitted.set(false);
  }

  protected signupControlInvalid(
    controlName:
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'phone'
      | 'password'
      | 'confirmPassword'
      | 'termsAccepted',
  ): boolean {
    const control = this.signupForm.controls[controlName];
    return !!control && control.invalid && (control.touched || this.signupSubmitted());
  }

  protected showPasswordMismatch(): boolean {
    const password = this.signupForm.controls.password.value;
    const confirmPasswordControl = this.signupForm.controls.confirmPassword;
    const shouldShow = confirmPasswordControl.touched || this.signupSubmitted();

    return (
      shouldShow && !!confirmPasswordControl.value && password !== confirmPasswordControl.value
    );
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  private buildRegisterPayload(): RegisterUserRequest {
    const firstName = this.signupForm.controls.firstName.value.trim();
    const lastName = this.signupForm.controls.lastName.value.trim();
    const email = this.signupForm.controls.email.value.trim().toLowerCase();
    const password = this.signupForm.controls.password.value;
    const usernameSeed = `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, '.');
    const usuario = usernameSeed || email;

    return {
      nombre: `${firstName} ${lastName}`.trim(),
      email,
      usuario,
      contrasena: password,
    };
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return this.i18n.t('auth.error.invalidCredentials');
    }

    if (error.status === 403 && error.error?.code === 'EMAIL_NOT_VERIFIED') {
      return 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.';
    }

    if (error.status === 0) {
      return this.i18n.t('auth.error.connectionError');
    }

    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }

    return this.i18n.t('auth.error.unexpected');
  }

  private resolveSignupErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return typeof error.error?.error === 'string'
        ? error.error.error
        : 'An account with this email already exists.';
    }

    if (error.status === 0) {
      return this.i18n.t('auth.error.connectionError');
    }

    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }

    return 'Could not create account. Please try again.';
  }
}
