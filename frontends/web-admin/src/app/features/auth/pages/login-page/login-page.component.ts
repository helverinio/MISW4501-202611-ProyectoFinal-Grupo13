import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { AdminLoginStep1Response } from '../../../../core/models/auth.models';
import { I18nService } from '../../../../core/services/i18n.service';
import { LanguageCode } from '../../../../core/i18n/translations';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  readonly loginForm;

  showMfaField = false;
  isSubmitting = false;
  errorMessage = '';
  challengeToken: string | null = null;
  showPassword = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
    readonly i18n: I18nService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      mfaCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    });
  }

  submit(): void {
    this.errorMessage = '';

    if (!this.showMfaField) {
      if (this.loginForm.controls.email.invalid || this.loginForm.controls.password.invalid) {
        this.loginForm.controls.email.markAsTouched();
        this.loginForm.controls.password.markAsTouched();
        return;
      }

      this.isSubmitting = true;
      this.authService
        .loginStep1({
          email: this.loginForm.controls.email.value ?? '',
          contrasena: this.loginForm.controls.password.value ?? '',
        })
        .subscribe({
          next: (response: AdminLoginStep1Response) => {
            this.ngZone.run(() => {
              this.isSubmitting = false;
              this.showMfaField = true;
              this.challengeToken = response.challenge_token;
              this.loginForm.controls.mfaCode.setValue('');
              this.loginForm.controls.mfaCode.markAsUntouched();
              this.cdr.detectChanges();
            });
          },
          error: (error: any) => {
            this.ngZone.run(() => {
              this.isSubmitting = false;
              this.errorMessage = error?.error?.error ?? 'No fue posible iniciar sesión';
              this.cdr.detectChanges();
            });
          },
        });
      return;
    }

    if (this.loginForm.controls.mfaCode.invalid || !this.challengeToken) {
      this.loginForm.controls.mfaCode.markAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authService
      .loginStep2({
        challenge_token: this.challengeToken,
        code: this.loginForm.controls.mfaCode.value ?? '',
      })
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            const redirectTo =
              this.route.snapshot.queryParamMap.get('redirectTo') || '/revenue-reports';
            void this.router.navigateByUrl(redirectTo);
          });
        },
        error: (error: any) => {
          this.ngZone.run(() => {
            this.isSubmitting = false;
            this.errorMessage = error?.error?.error ?? 'Código MFA inválido o expirado';
            this.cdr.detectChanges();
          });
        },
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  t(key: Parameters<I18nService['t']>[0]): string {
    return this.i18n.t(key);
  }

  get currentLanguage() {
    return this.i18n.currentLanguage();
  }

  setLanguage(lang: LanguageCode): void {
    this.i18n.setLanguage(lang);
  }
}
