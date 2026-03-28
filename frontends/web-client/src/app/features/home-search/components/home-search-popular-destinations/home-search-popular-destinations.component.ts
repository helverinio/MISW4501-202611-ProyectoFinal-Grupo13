import { Component, inject } from '@angular/core';

import { I18nService } from '../../../../core/services/i18n.service';

interface PopularDestination {
  cityCountry: string;
  priceKey: string;
  availableHotelsKey: string;
  imageUrl: string;
  imageAlt: string;
}

@Component({
  selector: 'app-home-search-popular-destinations',
  templateUrl: './home-search-popular-destinations.component.html',
  styleUrl: './home-search-popular-destinations.component.scss',
})
export class HomeSearchPopularDestinationsComponent {
  private readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected readonly popularDestinations: PopularDestination[] = [
    {
      cityCountry: 'Mexico City, Mexico',
      priceKey: 'homeSearch.popular.price.mexico',
      availableHotelsKey: 'homeSearch.popular.available.mexico',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/1d2f182897-5d1fd9b58300224b1c65.png',
      imageAlt: 'Mexico City skyline with colorful buildings and historic architecture',
    },
    {
      cityCountry: 'Buenos Aires, Argentina',
      priceKey: 'homeSearch.popular.price.argentina',
      availableHotelsKey: 'homeSearch.popular.available.argentina',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/00eb476e0d-bf0a4b3e253fa62fd9d1.png',
      imageAlt: 'Buenos Aires colorful La Boca neighborhood with tango dancers',
    },
    {
      cityCountry: 'Rio de Janeiro, Brazil',
      priceKey: 'homeSearch.popular.price.brazil',
      availableHotelsKey: 'homeSearch.popular.available.brazil',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/862ebce4d4-0308d88a89bfe7fb8b3b.png',
      imageAlt: 'Rio de Janeiro Christ the Redeemer statue with beautiful city view',
    },
    {
      cityCountry: 'Lima, Peru',
      priceKey: 'homeSearch.popular.price.peru',
      availableHotelsKey: 'homeSearch.popular.available.peru',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/b34adcb6d9-8d703560c0b959d0a430.png',
      imageAlt: 'Lima Peru historic center with colonial architecture and plaza',
    },
    {
      cityCountry: 'Bogotá, Colombia',
      priceKey: 'homeSearch.popular.price.colombia',
      availableHotelsKey: 'homeSearch.popular.available.colombia',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/82b708d1d5-ddb58a399476157f39d5.png',
      imageAlt: 'Bogota Colombia modern skyline with mountains in background',
    },
  ];
}
