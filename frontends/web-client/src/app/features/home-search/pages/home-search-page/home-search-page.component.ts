import { Component } from '@angular/core';

import { HomeSearchFooterComponent } from '../../components/home-search-footer/home-search-footer.component';
import { HomeSearchHeaderComponent } from '../../components/home-search-header/home-search-header.component';
import { HomeSearchHeroSearchComponent } from '../../components/home-search-hero-search/home-search-hero-search.component';
import { HomeSearchMobileNavigationComponent } from '../../components/home-search-mobile-navigation/home-search-mobile-navigation.component';
import { HomeSearchMobileSelectorsComponent } from '../../components/home-search-mobile-selectors/home-search-mobile-selectors.component';
import { HomeSearchPopularDestinationsComponent } from '../../components/home-search-popular-destinations/home-search-popular-destinations.component';
import { HomeSearchRecentlyViewedComponent } from '../../components/home-search-recently-viewed/home-search-recently-viewed.component';
import { HomeSearchTrustBadgesComponent } from '../../components/home-search-trust-badges/home-search-trust-badges.component';

@Component({
  selector: 'app-home-search-page',
  imports: [
    HomeSearchHeaderComponent,
    HomeSearchMobileNavigationComponent,
    HomeSearchHeroSearchComponent,
    HomeSearchPopularDestinationsComponent,
    HomeSearchRecentlyViewedComponent,
    HomeSearchTrustBadgesComponent,
    HomeSearchMobileSelectorsComponent,
    HomeSearchFooterComponent,
  ],
  templateUrl: './home-search-page.component.html',
  styleUrl: './home-search-page.component.scss',
})
export class HomeSearchPageComponent {}
