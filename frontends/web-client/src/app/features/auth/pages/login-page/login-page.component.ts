import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { LoginRequest } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';
import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, LoginFormComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);

  protected readonly activeTab = signal<'signin' | 'signup'>('signin');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected setTab(tab: 'signin' | 'signup'): void {
    this.activeTab.set(tab);
    this.errorMessage.set('');
  }

  protected onLogin(payload: LoginRequest): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(payload).subscribe({
      next: () => {
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/app';
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

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return this.i18n.t('auth.error.invalidCredentials');
    }

    if (error.status === 0) {
      return this.i18n.t('auth.error.connectionError');
    }

    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }

    return this.i18n.t('auth.error.unexpected');
  }
}
