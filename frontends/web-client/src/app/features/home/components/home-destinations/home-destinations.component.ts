import { Component } from '@angular/core';

interface Destination {
  city: string;
  country: string;
  imageUrl: string;
}

@Component({
  selector: 'app-home-destinations',
  templateUrl: './home-destinations.component.html',
  styleUrl: './home-destinations.component.scss',
})
export class HomeDestinationsComponent {
  protected readonly destinations: Destination[] = [
    {
      city: 'Buenos Aires',
      country: 'Argentina',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/3f1b1f088c-a2b167e8c9f1d4eb1d80.png',
    },
    {
      city: 'Mexico City',
      country: 'Mexico',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/7c4d3bab0c-51c548ef1d0a0d3a8ac0.png',
    },
    {
      city: 'Lima',
      country: 'Peru',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/2c6c24aaff-3e75d8179c223d7ba761.png',
    },
    {
      city: 'Bogota',
      country: 'Colombia',
      imageUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/d2ee927c6f-1bdc7590cdc329fdeb8d.png',
    },
  ];
}
