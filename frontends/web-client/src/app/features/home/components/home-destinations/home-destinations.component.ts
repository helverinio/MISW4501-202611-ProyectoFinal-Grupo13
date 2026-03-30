import { Component, inject } from '@angular/core';
import { I18nService } from '../../../../core/services/i18n.service';

interface Destination {
  id: string;
  city: string;
  country: string;
  imageUrl: string;
  alt: string;
}

@Component({
  selector: 'app-home-destinations',
  templateUrl: './home-destinations.component.html',
  styleUrl: './home-destinations.component.scss',
})
export class HomeDestinationsComponent {
  private readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected readonly destinations: Destination[] = [
    {
      id: 'dest-1',
      city: 'Buenos Aires',
      country: 'Argentina',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/3f1b1f088c-a2b167e8c9f1d4eb1d80.png',
      alt: 'Buenos Aires Argentina skyline cityscape with modern buildings and landmarks',
    },
    {
      id: 'dest-2',
      city: 'Mexico City',
      country: 'Mexico',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/7c4d3bab0c-51c548ef1d0a0d3a8ac0.png',
      alt: 'Mexico City historic center with cathedral and colorful colonial buildings',
    },
    {
      id: 'dest-3',
      city: 'Lima',
      country: 'Peru',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/2c6c24aaff-3e75d8179c223d7ba761.png',
      alt: 'Lima Peru coastal city view with modern buildings and ocean',
    },
    {
      id: 'dest-4',
      city: 'Bogotá',
      country: 'Colombia',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/d2ee927c6f-1bdc7590cdc329fdeb8d.png',
      alt: 'Bogota Colombia cityscape with mountains in background and modern architecture',
    },
  ];
}
