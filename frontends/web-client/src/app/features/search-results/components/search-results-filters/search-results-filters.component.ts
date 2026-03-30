import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { I18nService } from '../../../../core/services/i18n.service';

interface AmenityOption {
  value: string;
  labelKey: string;
}

@Component({
  selector: 'app-search-results-filters',
  imports: [FormsModule],
  templateUrl: './search-results-filters.component.html',
  styleUrl: './search-results-filters.component.scss',
})
export class SearchResultsFiltersComponent {
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) minPrice = 0;
  @Input({ required: true }) maxPrice = 300;
  @Input({ required: true }) selectedMinPrice = 0;
  @Input({ required: true }) selectedMaxPrice = 300;
  @Input({ required: true }) selectedAmenities: string[] = [];
  @Input({ required: true }) selectedRating: number | null = null;
  @Input({ required: true }) freeCancellationOnly = false;

  @Output() readonly minPriceChange = new EventEmitter<number>();
  @Output() readonly maxPriceChange = new EventEmitter<number>();
  @Output() readonly amenityToggle = new EventEmitter<string>();
  @Output() readonly ratingChange = new EventEmitter<number | null>();
  @Output() readonly freeCancellationOnlyChange = new EventEmitter<boolean>();
  @Output() readonly clearAll = new EventEmitter<void>();

  protected readonly amenities: AmenityOption[] = [
    { value: 'Free WiFi', labelKey: 'searchResults.amenity.freeWifi' },
    { value: 'Swimming Pool', labelKey: 'searchResults.amenity.swimmingPool' },
    { value: 'Free Breakfast', labelKey: 'searchResults.amenity.freeBreakfast' },
    { value: 'Free Parking', labelKey: 'searchResults.amenity.freeParking' },
    { value: 'Fitness Center', labelKey: 'searchResults.amenity.fitnessCenter' },
    { value: 'Pet Friendly', labelKey: 'searchResults.amenity.petFriendly' },
  ];

  protected t(key: string): string {
    return this.i18n.t(key as any);
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
