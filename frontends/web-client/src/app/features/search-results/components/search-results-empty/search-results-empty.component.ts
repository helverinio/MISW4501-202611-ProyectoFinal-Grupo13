import { Component, EventEmitter, Output, inject } from '@angular/core';

import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-search-results-empty',
  templateUrl: './search-results-empty.component.html',
  styleUrl: './search-results-empty.component.scss',
})
export class SearchResultsEmptyComponent {
  private readonly i18n = inject(I18nService);

  @Output() readonly clearFilters = new EventEmitter<void>();

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected onClearFilters(): void {
    this.clearFilters.emit();
  }
}
