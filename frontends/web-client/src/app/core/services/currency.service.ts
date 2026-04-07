import { Injectable, signal } from '@angular/core';

export type SupportedCurrency = 'USD' | 'ARS' | 'CLP' | 'PEN' | 'COP' | 'MXN';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private readonly ratesFromUsd: Record<SupportedCurrency, number> = {
    USD: 1,
    ARS: 900,
    CLP: 960,
    PEN: 3.75,
    COP: 3950,
    MXN: 17,
  };

  private readonly currentCurrencySignal = signal<SupportedCurrency>(this.getStoredCurrency());
  readonly currentCurrency = this.currentCurrencySignal.asReadonly();

  setCurrency(currency: string): void {
    if (this.isSupportedCurrency(currency)) {
      this.currentCurrencySignal.set(currency);
      localStorage.setItem('app_currency', currency);
    }
  }

  getCurrency(): SupportedCurrency {
    return this.currentCurrencySignal();
  }

  convertFromUsd(amountUsd: number): number {
    const rate = this.ratesFromUsd[this.currentCurrencySignal()];
    return amountUsd * rate;
  }

  private isSupportedCurrency(currency: string): currency is SupportedCurrency {
    return ['USD', 'ARS', 'CLP', 'PEN', 'COP', 'MXN'].includes(currency);
  }

  private getStoredCurrency(): SupportedCurrency {
    const stored = localStorage.getItem('app_currency');
    if (stored && this.isSupportedCurrency(stored)) {
      return stored;
    }
    return 'USD';
  }
}
