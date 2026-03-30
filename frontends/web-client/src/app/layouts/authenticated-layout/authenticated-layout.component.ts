import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HomeSearchHeaderComponent } from '../../features/home-search/components/home-search-header/home-search-header.component';
import { HomeSearchMobileNavigationComponent } from '../../features/home-search/components/home-search-mobile-navigation/home-search-mobile-navigation.component';
import { HomeSearchMobileSelectorsComponent } from '../../features/home-search/components/home-search-mobile-selectors/home-search-mobile-selectors.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';

@Component({
  selector: 'app-authenticated-layout',
  imports: [
    RouterOutlet,
    HomeSearchHeaderComponent,
    HomeSearchMobileNavigationComponent,
    PublicFooterComponent,
    HomeSearchMobileSelectorsComponent,
  ],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.scss',
})
export class AuthenticatedLayoutComponent {}
