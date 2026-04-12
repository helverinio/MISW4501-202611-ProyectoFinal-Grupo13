import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';

import { AuthService } from '../../../../core/services/auth.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { I18nService } from '../../../../core/services/i18n.service';
import {
  RecentlyViewedHotelResponse,
  ReservationService,
} from '../../../search-results/services/reservation.service';

interface RecentlyViewedHotel {
  hotelName: string;
  rating: string;
  cityCountry: string;
  nightlyPriceUsd: number;
  imageUrl: string | null;
  imageAlt: string;
}

@Component({
  selector: 'app-home-search-recently-viewed',
  templateUrl: './home-search-recently-viewed.component.html',
  styleUrl: './home-search-recently-viewed.component.scss',
})
export class HomeSearchRecentlyViewedComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly authService = inject(AuthService);
  private readonly reservationService = inject(ReservationService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly currencyService = inject(CurrencyService);

  protected isLoading = true;
  protected hasLoadError = false;
  protected recentlyViewedHotels: RecentlyViewedHotel[] = [];

  protected get shouldShow(): boolean {
    return this.isLoading || this.hasLoadError || this.recentlyViewedHotels.length > 0;
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected convertAndFormat(usdValue: number): string {
    const converted = this.currencyService.convertFromUsd(usdValue);
    return converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    const token = this.authService.getAccessToken();
    if (!user || !token || !this.authService.isAuthenticated()) {
      this.isLoading = false;
      return;
    }

    this.reservationService.getRecentlyViewedHotels(String(user.id)).subscribe({
      next: (response: RecentlyViewedHotelResponse[]) => {
        this.ngZone.run(() => {
          this.recentlyViewedHotels = response.map((r) => this.mapHotel(r));
          this.hasLoadError = false;
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.recentlyViewedHotels = [];
          this.hasLoadError = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      },
    });
  }

  private mapHotel(r: RecentlyViewedHotelResponse): RecentlyViewedHotel {
    const city = r.city ?? '';
    const country = r.country ?? '';
    const cityCountry = city && country ? `${city}, ${country}` : city || country || '—';
    const rating = r.rating !== null ? r.rating.toFixed(1) : '—';

    return {
      hotelName: r.hotel_name,
      rating,
      cityCountry,
      nightlyPriceUsd: r.nightly_price,
      imageUrl: null,
      imageAlt: r.hotel_name,
    };
  }
}
