import { Component } from '@angular/core';

import { HomeDestinationsComponent } from '../../components/home-destinations/home-destinations.component';
import { HomeFeaturesComponent } from '../../components/home-features/home-features.component';
import { HomeHeroComponent } from '../../components/home-hero/home-hero.component';

@Component({
  selector: 'app-home-page',
  imports: [HomeHeroComponent, HomeFeaturesComponent, HomeDestinationsComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {}
