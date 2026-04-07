import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AmenityI18nService } from '../../../../core/services/amenity-i18n.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { HotelResultVm } from '../../models/search-results.models';

@Component({
  selector: 'app-hotel-result-card',
  templateUrl: './hotel-result-card.component.html',
  styleUrl: './hotel-result-card.component.scss',
})
export class HotelResultCardComponent {
  private readonly amenityI18n = inject(AmenityI18nService);
  private readonly i18n = inject(I18nService);
  private readonly currencyService = inject(CurrencyService);
  private readonly router = inject(Router);

  protected readonly currentLanguage = this.i18n.currentLanguage;
  protected readonly currentCurrency = this.currencyService.currentCurrency;

  @Input({ required: true }) hotel!: HotelResultVm;

  protected onViewDetails(): void {
    void this.router.navigate(['/app/hoteles', this.hotel.id], {
      queryParamsHandling: 'preserve',
    });
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected amenityLabel(amenity: string): string {
    return this.amenityI18n.translate(amenity, this.currentLanguage());
  }

  protected formatPrice(amountUsd: number): string {
    const currency = this.currentCurrency();
    const converted = this.currencyService.convertFromUsd(amountUsd);

    return new Intl.NumberFormat(this.getLocale(), {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'COP' || currency === 'CLP' ? 0 : 2,
    }).format(converted);
  }

  private getLocale(): string {
    const lang = this.currentLanguage();
    if (lang === 'es') {
      return 'es-CO';
    }
    if (lang === 'pt') {
      return 'pt-BR';
    }
    return 'en-US';
  }
}
