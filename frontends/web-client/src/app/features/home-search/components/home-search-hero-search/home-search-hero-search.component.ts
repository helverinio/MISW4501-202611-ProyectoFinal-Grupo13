import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-home-search-hero-search',
  imports: [FormsModule],
  templateUrl: './home-search-hero-search.component.html',
  styleUrl: './home-search-hero-search.component.scss',
})
export class HomeSearchHeroSearchComponent {
  private readonly i18n = inject(I18nService);

  protected destination = '';
  protected checkInDate = this.getDateOffset(1);
  protected checkOutDate = this.getDateOffset(7);
  protected guests = this.t('homeSearch.hero.guest1');

  protected guestOptions(): string[] {
    return [
      this.t('homeSearch.hero.guest1'),
      this.t('homeSearch.hero.guest2'),
      this.t('homeSearch.hero.guest3'),
      this.t('homeSearch.hero.guest4'),
      this.t('homeSearch.hero.guest5Plus'),
    ];
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected onSearchHotels(): void {
    if (!this.destination.trim()) {
      return;
    }
  }

  private getDateOffset(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }
}
