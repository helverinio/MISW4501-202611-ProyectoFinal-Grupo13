import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { LanguageCode } from '../../../../core/i18n/translations';

@Component({
  selector: 'app-home-search-header',
  imports: [FormsModule, RouterLink],
  templateUrl: './home-search-header.component.html',
  styleUrl: './home-search-header.component.scss',
})
export class HomeSearchHeaderComponent {
  private readonly i18n = inject(I18nService);
  private readonly authService = inject(AuthService);
  private readonly currencyService = inject(CurrencyService);
  private readonly router = inject(Router);

  protected readonly currentLanguage = this.i18n.currentLanguage;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currency = this.currencyService.currentCurrency;
  protected readonly isUserMenuOpen = signal<boolean>(false);
  protected readonly currentUrl = signal<string>(this.router.url);
  protected readonly isSearchResults = computed(() =>
    this.currentUrl().startsWith('/app/search-results'),
  );

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.currentUrl.set(this.router.url));
  }

  protected onLanguageChange(lang: LanguageCode): void {
    this.i18n.setLanguage(lang);
  }

  protected onCurrencyChange(currency: string): void {
    this.currencyService.setCurrency(currency);
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

  protected isHomeSearch(): boolean {
    return this.currentUrl().startsWith('/app/home-search');
  }

  protected isSearchResultsPage(): boolean {
    return this.currentUrl().startsWith('/app/search-results');
  }

  @HostListener('document:click')
  protected closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  @HostListener('window:popstate')
  protected refreshCurrentUrl(): void {
    this.currentUrl.set(this.router.url);
  }
}
