import { Component } from '@angular/core';

interface RecentlyViewedHotel {
  hotelName: string;
  rating: string;
  cityCountry: string;
  nightlyPrice: string;
  cancellationText: string;
  imageUrl: string;
  imageAlt: string;
}

@Component({
  selector: 'app-home-search-recently-viewed',
  templateUrl: './home-search-recently-viewed.component.html',
  styleUrl: './home-search-recently-viewed.component.scss',
})
export class HomeSearchRecentlyViewedComponent {
  protected readonly recentlyViewedHotels: RecentlyViewedHotel[] = [
    {
      hotelName: 'Hotel Oceanic View',
      rating: '4.8',
      cityCountry: 'Cancun, Mexico',
      nightlyPrice: '$89',
      cancellationText: 'Free cancellation',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/f926958104-91aca9572a757359f7b5.png',
      imageAlt: 'luxury hotel room with ocean view and modern amenities',
    },
    {
      hotelName: 'Casa Colonial Boutique',
      rating: '4.6',
      cityCountry: 'Cartagena, Colombia',
      nightlyPrice: '$67',
      cancellationText: 'Free cancellation',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/653fa34617-94b31fae593146f46588.png',
      imageAlt: 'boutique hotel in historic district with colonial architecture',
    },
    {
      hotelName: 'Metropolitan Plaza',
      rating: '4.7',
      cityCountry: 'São Paulo, Brazil',
      nightlyPrice: '$75',
      cancellationText: 'Free cancellation',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/eeb99269d5-493c899769cb771ac883.png',
      imageAlt: 'modern city hotel with rooftop pool and skyline views',
    },
  ];
}
