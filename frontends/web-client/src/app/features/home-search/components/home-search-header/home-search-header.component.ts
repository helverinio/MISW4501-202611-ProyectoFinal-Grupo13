import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { LanguageCode } from '../../../../core/i18n/translations';

@Component({
  selector: 'app-home-search-header',
  imports: [FormsModule],
  templateUrl: './home-search-header.component.html',
  styleUrl: './home-search-header.component.scss',
})
export class HomeSearchHeaderComponent {
  private readonly i18n = inject(I18nService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentLanguage = this.i18n.currentLanguage;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currency = signal<string>('USD');
  protected readonly isUserMenuOpen = signal<boolean>(false);

  protected onLanguageChange(lang: LanguageCode): void {
    this.i18n.setLanguage(lang);
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isUserMenuOpen.update((isOpen) => !isOpen);
  }

  protected onLogout(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserMenuOpen.set(false);

    this.authService.logout().subscribe(() => {
      void this.router.navigateByUrl('/login');
    });
  }

  @HostListener('document:click')
  protected closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }
}
