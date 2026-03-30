import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../core/services/i18n.service';
import { LanguageCode } from '../../../core/i18n/translations';

@Component({
  selector: 'app-public-header',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
})
export class PublicHeaderComponent {
  private readonly i18n = inject(I18nService);

  protected readonly currentLanguage = this.i18n.currentLanguage;
  protected readonly currency = signal<string>('ARS');

  readonly languages: Array<{ label: string; value: LanguageCode }> = [
    { label: '🇺🇸 English', value: 'en' },
    { label: '🇪🇸 Español', value: 'es' },
    { label: '🇧🇷 Português', value: 'pt' },
  ];

  readonly currencies: string[] = ['USD', 'ARS', 'CLP', 'PEN', 'COP', 'MXN'];

  protected onLanguageChange(lang: LanguageCode): void {
    this.i18n.setLanguage(lang);
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }
}
