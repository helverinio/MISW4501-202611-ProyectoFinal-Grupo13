import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';

import {
  PopularDestinationByCityApi,
  PopularDestinationsByCityResponse,
} from '../../../search-results/models/search-results.models';
import { SearchHotelsService } from '../../../search-results/services/search-hotels.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { CurrencyService } from '../../../../core/services/currency.service';

interface PopularDestination {
  cityCountry: string;
  minPriceUsd: number | null;
  availableHotelsCount: number;
  imageUrl: string;
  imageAlt: string;
}

@Component({
  selector: 'app-home-search-popular-destinations',
  templateUrl: './home-search-popular-destinations.component.html',
  styleUrl: './home-search-popular-destinations.component.scss',
})
export class HomeSearchPopularDestinationsComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly hotelsService = inject(SearchHotelsService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly currencyService = inject(CurrencyService);

  protected isLoading = true;
  protected hasLoadError = false;

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected popularDestinations: PopularDestination[] = [];

  ngOnInit(): void {
    this.hotelsService.getPopularDestinationsByCity(4).subscribe({
      next: (response: PopularDestinationsByCityResponse) => {
        this.ngZone.run(() => {
          this.popularDestinations = response.destinos.map((destination) =>
            this.mapDestination(destination),
          );
          this.hasLoadError = false;
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.popularDestinations = [];
          this.hasLoadError = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        });
      },
    });
  }

  protected convertAndFormat(usdValue: number | null): string {
    if (usdValue === null) {
      return '';
    }
    const converted = this.currencyService.convertFromUsd(usdValue);
    return converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  private mapDestination(destination: PopularDestinationByCityApi): PopularDestination {
    return {
      cityCountry: `${destination.ciudad}, ${destination.pais}`,
      minPriceUsd: destination.precio_minimo_noche,
      availableHotelsCount: destination.hoteles_disponibles_ciudad,
      imageUrl: this.resolveImageByCity(destination.ciudad),
      imageAlt: `${destination.ciudad} city destination photo`,
    };
  }

  private resolveImageByCity(cityName: string): string {
    const normalizedCity = cityName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const cityImageMap: Record<string, string> = {
      'mexico city': '/img/mexico.jpg',
      'buenos aires': '/img/buenos-aires.jpg',
      'rio de janeiro': '/img/rio.jpg',
      lima: '/img/lima.jpg',
      bogota: '/img/bogota.jpg',
    };

    return cityImageMap[normalizedCity] ?? '/img/destination-default.jpg';
  }
}
