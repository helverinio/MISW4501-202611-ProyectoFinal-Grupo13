import { Component, EventEmitter, Input, Output, inject } from '@angular/core';

import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-search-results-error',
  templateUrl: './search-results-error.component.html',
  styleUrl: './search-results-error.component.scss',
})
export class SearchResultsErrorComponent {
  private readonly i18n = inject(I18nService);

  @Input() message = '';
  @Output() readonly retry = new EventEmitter<void>();

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected onRetry(): void {
    this.retry.emit();
  }
}
