import { Component, inject } from '@angular/core';

import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-home-search-mobile-navigation',
  templateUrl: './home-search-mobile-navigation.component.html',
  styleUrl: './home-search-mobile-navigation.component.scss',
})
export class HomeSearchMobileNavigationComponent {
  private readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }
}
