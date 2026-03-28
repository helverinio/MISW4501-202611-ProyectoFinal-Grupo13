import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { LoginSidePanelComponent } from '../../components/login-side-panel/login-side-panel.component';
import { LoginRequest } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [LoginSidePanelComponent, LoginFormComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected loading = false;
  protected errorMessage = '';

  protected onLogin(payload: LoginRequest): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(payload).subscribe({
      next: () => {
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/app';
        void this.router.navigateByUrl(redirectTo);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.resolveErrorMessage(error);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Invalid credentials. Check your username and password.';
    }

    if (error.status === 0) {
      return 'Unable to connect to authentication service. Verify backend host configuration.';
    }

    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }

    return 'Unexpected authentication error. Please retry.';
  }
}
