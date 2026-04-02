import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { I18nService } from '../../../../core/services/i18n.service';
import { SortOption } from '../../models/search-results.models';

@Component({
  selector: 'app-search-results-header',
  imports: [FormsModule],
  templateUrl: './search-results-header.component.html',
  styleUrl: './search-results-header.component.scss',
})
export class SearchResultsHeaderComponent {
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) totalHotels = 0;
  @Input({ required: true }) destination = '';
  @Input({ required: true }) sortBy: SortOption = 'popularity';
  @Output() readonly sortByChange = new EventEmitter<SortOption>();

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected onSortChange(value: string): void {
    this.sortByChange.emit(value as SortOption);
  }
}
