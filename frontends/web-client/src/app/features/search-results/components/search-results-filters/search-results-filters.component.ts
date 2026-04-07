import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AmenityI18nService } from '../../../../core/services/amenity-i18n.service';
import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-search-results-filters',
  imports: [FormsModule],
  templateUrl: './search-results-filters.component.html',
  styleUrl: './search-results-filters.component.scss',
})
export class SearchResultsFiltersComponent {
  private readonly amenityI18n = inject(AmenityI18nService);
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) minPrice = 0;
  @Input({ required: true }) maxPrice = 300;
  @Input({ required: true }) selectedMinPrice = 0;
  @Input({ required: true }) selectedMaxPrice = 300;
  @Input({ required: true }) availableAmenities: string[] = [];
  @Input({ required: true }) selectedAmenities: string[] = [];
  @Input({ required: true }) selectedRating: number | null = null;
  @Input({ required: true }) freeCancellationOnly = false;

  @Output() readonly minPriceChange = new EventEmitter<number>();
  @Output() readonly maxPriceChange = new EventEmitter<number>();
  @Output() readonly amenityToggle = new EventEmitter<string>();
  @Output() readonly ratingChange = new EventEmitter<number | null>();
  @Output() readonly freeCancellationOnlyChange = new EventEmitter<boolean>();
  @Output() readonly clearAll = new EventEmitter<void>();

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected amenityLabel(amenity: string): string {
    return this.amenityI18n.translate(amenity, this.i18n.getLanguage());
  }

  protected isSelectedAmenity(amenity: string): boolean {
    return this.selectedAmenities.includes(amenity);
  }

  protected onPriceSliderChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    this.maxPriceChange.emit(value);
  }

  protected onMinInputChange(value: number): void {
    this.minPriceChange.emit(Number(value));
  }

  protected onMaxInputChange(value: number): void {
    this.maxPriceChange.emit(Number(value));
  }

  protected onAmenityToggle(amenity: string): void {
    this.amenityToggle.emit(amenity);
  }

  protected onRatingChange(value: number): void {
    this.ratingChange.emit(value);
  }

  protected onFreeCancellationChange(value: boolean): void {
    this.freeCancellationOnlyChange.emit(value);
  }

  protected onClearAll(): void {
    this.clearAll.emit();
  }
}
