import { Injectable, signal } from '@angular/core';
import { LanguageCode, Translation, translations } from '../i18n/translations';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly currentLanguageSignal = signal<LanguageCode>(this.getStoredLanguage());
  readonly currentLanguage = this.currentLanguageSignal.asReadonly();

  constructor() {
    // Restaurar idioma guardado al cargar el servicio
    const stored = localStorage.getItem('app_language');
    if (stored && this.isValidLanguage(stored)) {
      this.currentLanguageSignal.set(stored as LanguageCode);
    }
  }

  /**
   * Obtiene la traducción para una clave específica
   */
  t(key: keyof Translation): string {
    const lang = this.currentLanguageSignal();
    return translations[lang][key] ?? key;
  }

  /**
   * Cambia el idioma actual
   */
  setLanguage(lang: LanguageCode): void {
    if (this.isValidLanguage(lang)) {
      this.currentLanguageSignal.set(lang);
      localStorage.setItem('app_language', lang);
    }
  }

  /**
   * Obtiene el idioma actual
   */
  getLanguage(): LanguageCode {
    return this.currentLanguageSignal();
  }

  /**
   * Obtiene todas las traducciones del idioma actual
   */
  getAllTranslations(): Translation {
    return translations[this.currentLanguageSignal()];
  }

  /**
   * Valida si el idioma es válido
   */
  private isValidLanguage(lang: string): lang is LanguageCode {
    return ['en', 'es', 'pt'].includes(lang);
  }

  /**
   * Obtiene el idioma almacenado o el idioma por defecto
   */
  private getStoredLanguage(): LanguageCode {
    const stored = localStorage.getItem('app_language');
    if (stored && this.isValidLanguage(stored)) {
      return stored;
    }
    // Por defecto usar español en Latinoamérica
    return 'es';
  }
}
