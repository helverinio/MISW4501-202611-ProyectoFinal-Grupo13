import { Component, inject } from '@angular/core';

import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-home-search-trust-badges',
  templateUrl: './home-search-trust-badges.component.html',
  styleUrl: './home-search-trust-badges.component.scss',
})
export class HomeSearchTrustBadgesComponent {
  private readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }
}
