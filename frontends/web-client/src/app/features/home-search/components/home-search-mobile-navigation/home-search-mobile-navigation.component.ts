import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-home-search-mobile-navigation',
  imports: [RouterLink],
  templateUrl: './home-search-mobile-navigation.component.html',
  styleUrl: './home-search-mobile-navigation.component.scss',
})
export class HomeSearchMobileNavigationComponent {
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected isHomeSearch(): boolean {
    return this.router.url.startsWith('/app/home-search');
  }

  protected isSearchResultsPage(): boolean {
    return this.router.url.startsWith('/app/search-results');
  }
}
