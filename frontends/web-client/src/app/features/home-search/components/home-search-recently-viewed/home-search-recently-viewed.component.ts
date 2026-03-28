import { Component, inject } from '@angular/core';

import { I18nService } from '../../../../core/services/i18n.service';

interface RecentlyViewedHotel {
  hotelName: string;
  rating: string;
  cityCountry: string;
  nightlyPrice: string;
  imageUrl: string;
  imageAlt: string;
}

@Component({
  selector: 'app-home-search-recently-viewed',
  templateUrl: './home-search-recently-viewed.component.html',
  styleUrl: './home-search-recently-viewed.component.scss',
})
export class HomeSearchRecentlyViewedComponent {
  private readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected readonly recentlyViewedHotels: RecentlyViewedHotel[] = [
    {
      hotelName: 'Hotel Oceanic View',
      rating: '4.8',
      cityCountry: 'Cancun, Mexico',
      nightlyPrice: '$89',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/f926958104-91aca9572a757359f7b5.png',
      imageAlt: 'luxury hotel room with ocean view and modern amenities',
    },
    {
      hotelName: 'Casa Colonial Boutique',
      rating: '4.6',
      cityCountry: 'Cartagena, Colombia',
      nightlyPrice: '$67',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/653fa34617-94b31fae593146f46588.png',
      imageAlt: 'boutique hotel in historic district with colonial architecture',
    },
    {
      hotelName: 'Metropolitan Plaza',
      rating: '4.7',
      cityCountry: 'São Paulo, Brazil',
      nightlyPrice: '$75',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/eeb99269d5-493c899769cb771ac883.png',
      imageAlt: 'modern city hotel with rooftop pool and skyline views',
    },
  ];
}
