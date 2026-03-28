import { Component } from '@angular/core';

interface PopularDestination {
  cityCountry: string;
  price: string;
  availableHotels: string;
  imageUrl: string;
  imageAlt: string;
}

@Component({
  selector: 'app-home-search-popular-destinations',
  templateUrl: './home-search-popular-destinations.component.html',
  styleUrl: './home-search-popular-destinations.component.scss',
})
export class HomeSearchPopularDestinationsComponent {
  protected readonly popularDestinations: PopularDestination[] = [
    {
      cityCountry: 'Mexico City, Mexico',
      price: 'From $45/night',
      availableHotels: '347 hotels available',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/1d2f182897-5d1fd9b58300224b1c65.png',
      imageAlt: 'Mexico City skyline with colorful buildings and historic architecture',
    },
    {
      cityCountry: 'Buenos Aires, Argentina',
      price: 'From $38/night',
      availableHotels: '289 hotels available',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/00eb476e0d-bf0a4b3e253fa62fd9d1.png',
      imageAlt: 'Buenos Aires colorful La Boca neighborhood with tango dancers',
    },
    {
      cityCountry: 'Rio de Janeiro, Brazil',
      price: 'From $52/night',
      availableHotels: '412 hotels available',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/862ebce4d4-0308d88a89bfe7fb8b3b.png',
      imageAlt: 'Rio de Janeiro Christ the Redeemer statue with beautiful city view',
    },
    {
      cityCountry: 'Lima, Peru',
      price: 'From $42/night',
      availableHotels: '198 hotels available',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/b34adcb6d9-8d703560c0b959d0a430.png',
      imageAlt: 'Lima Peru historic center with colonial architecture and plaza',
    },
    {
      cityCountry: 'Bogotá, Colombia',
      price: 'From $35/night',
      availableHotels: '156 hotels available',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/82b708d1d5-ddb58a399476157f39d5.png',
      imageAlt: 'Bogota Colombia modern skyline with mountains in background',
    },
  ];
}
