import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

  protected readonly currentLanguage = this.i18n.currentLanguage;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currency = signal<string>('USD');

  protected readonly languages: Array<{ label: string; value: LanguageCode }> = [
    { label: '🇺🇸 English', value: 'en' },
    { label: '🇪🇸 Español', value: 'es' },
    { label: '🇧🇷 Português', value: 'pt' },
  ];

  protected readonly currencies: string[] = ['USD', 'ARS', 'CLP', 'PEN', 'COP', 'MXN'];

  protected onLanguageChange(lang: LanguageCode): void {
    this.i18n.setLanguage(lang);
  }
}
