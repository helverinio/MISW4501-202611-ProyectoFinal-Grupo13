import { Component, Input, inject } from '@angular/core';

import { I18nService } from '../../../../core/services/i18n.service';
import { HotelResultVm } from '../../models/search-results.models';

@Component({
  selector: 'app-hotel-result-card',
  templateUrl: './hotel-result-card.component.html',
  styleUrl: './hotel-result-card.component.scss',
})
export class HotelResultCardComponent {
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) hotel!: HotelResultVm;

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }
}
