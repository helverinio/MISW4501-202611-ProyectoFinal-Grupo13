import { Component, EventEmitter, Input, Output, inject } from '@angular/core';

import { I18nService } from '../../../../core/services/i18n.service';
import { SearchCriteriaVm } from '../../models/search-results.models';

@Component({
  selector: 'app-search-results-summary',
  templateUrl: './search-results-summary.component.html',
  styleUrl: './search-results-summary.component.scss',
})
export class SearchResultsSummaryComponent {
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) criteria!: SearchCriteriaVm;
  @Output() readonly modify = new EventEmitter<void>();

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected onModifyClick(): void {
    this.modify.emit();
  }
}
