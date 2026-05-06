import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

type VerificationStatus = 'verifying' | 'success' | 'invalid' | 'expired';

@Component({
  selector: 'app-verify-email-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email-page.component.html',
})
export class VerifyEmailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly status = signal<VerificationStatus>('verifying');
  protected readonly userEmail = signal<string>('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');

    if (email) {
      this.userEmail.set(email);
    }

    if (!token) {
      this.status.set('invalid');
      return;
    }

    this.verifyToken(token);
  }

  private verifyToken(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.status.set('success');
        setTimeout(() => {
          void this.router.navigate(['/login']);
        }, 5000);
      },
      error: (error) => {
        if (error?.status === 410 || error?.error?.code === 'TOKEN_EXPIRED') {
          this.status.set('expired');
          return;
        }
        this.status.set('invalid');
      },
    });
  }
}
