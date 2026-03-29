import { Component, inject } from '@angular/core';

import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-search-results-loading',
  templateUrl: './search-results-loading.component.html',
  styleUrl: './search-results-loading.component.scss',
})
export class SearchResultsLoadingComponent {
  private readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }
}
