import { Injectable, signal } from '@angular/core';
import { AdminTranslation, LanguageCode, translations } from '../i18n/translations';

const VALID_LANGUAGES: LanguageCode[] = ['en', 'es', 'pt'];

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly currentLanguageSignal = signal<LanguageCode>(this.getStoredLanguage());
  readonly currentLanguage = this.currentLanguageSignal.asReadonly();

  t(key: keyof AdminTranslation): string {
    return translations[this.currentLanguageSignal()][key] ?? key;
  }

  setLanguage(lang: LanguageCode): void {
    this.currentLanguageSignal.set(lang);
    localStorage.setItem('admin_language', lang);
  }

  private getStoredLanguage(): LanguageCode {
    const stored = localStorage.getItem('admin_language');
    return stored && (VALID_LANGUAGES as string[]).includes(stored)
      ? (stored as LanguageCode)
      : 'es';
  }
}
