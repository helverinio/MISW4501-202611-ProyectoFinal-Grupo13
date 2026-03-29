import { Component } from '@angular/core';

import { HomeSearchHeroSearchComponent } from '../../components/home-search-hero-search/home-search-hero-search.component';
import { HomeSearchPopularDestinationsComponent } from '../../components/home-search-popular-destinations/home-search-popular-destinations.component';
import { HomeSearchRecentlyViewedComponent } from '../../components/home-search-recently-viewed/home-search-recently-viewed.component';
import { HomeSearchTrustBadgesComponent } from '../../components/home-search-trust-badges/home-search-trust-badges.component';

@Component({
  selector: 'app-home-search-page',
  imports: [
    HomeSearchHeroSearchComponent,
    HomeSearchPopularDestinationsComponent,
    HomeSearchRecentlyViewedComponent,
    HomeSearchTrustBadgesComponent,
  ],
  templateUrl: './home-search-page.component.html',
  styleUrl: './home-search-page.component.scss',
})
export class HomeSearchPageComponent {}
