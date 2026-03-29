import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { I18nService } from '../../../../core/services/i18n.service';
import {
  mapResponseToCriteria,
  mapResponseToHotels,
} from '../../mappers/search-results.mapper';
import {
  HotelResultVm,
  SearchAvailableHotelsRequest,
  SearchCriteriaVm,
  SortOption,
} from '../../models/search-results.models';
import { SearchHotelsService } from '../../services/search-hotels.service';
import { HotelResultCardComponent } from '../../components/hotel-result-card/hotel-result-card.component';
import { SearchResultsEmptyComponent } from '../../components/search-results-empty/search-results-empty.component';
import { SearchResultsErrorComponent } from '../../components/search-results-error/search-results-error.component';
import { SearchResultsFiltersComponent } from '../../components/search-results-filters/search-results-filters.component';
import { SearchResultsHeaderComponent } from '../../components/search-results-header/search-results-header.component';
import { SearchResultsLoadingComponent } from '../../components/search-results-loading/search-results-loading.component';
import { SearchResultsSummaryComponent } from '../../components/search-results-summary/search-results-summary.component';

@Component({
  selector: 'app-search-results-page',
  imports: [
    CommonModule,
    SearchResultsSummaryComponent,
    SearchResultsFiltersComponent,
    SearchResultsHeaderComponent,
    HotelResultCardComponent,
    SearchResultsLoadingComponent,
    SearchResultsErrorComponent,
    SearchResultsEmptyComponent,
  ],
  templateUrl: './search-results-page.component.html',
  styleUrl: './search-results-page.component.scss',
})
export class SearchResultsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly searchHotelsService = inject(SearchHotelsService);

  protected readonly loading = signal<boolean>(true);
  protected readonly errorMessage = signal<string>('');
  protected readonly criteria = signal<SearchCriteriaVm>({
    destination: '',
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    nights: 1,
  });
  protected readonly hotels = signal<HotelResultVm[]>([]);
  protected readonly selectedAmenities = signal<string[]>([]);
  protected readonly selectedRating = signal<number | null>(null);
  protected readonly freeCancellationOnly = signal<boolean>(false);
  protected readonly selectedMinPrice = signal<number>(0);
  protected readonly selectedMaxPrice = signal<number>(300);
  protected readonly sortBy = signal<SortOption>('popularity');
  protected readonly visibleCount = signal<number>(10);

  protected readonly minPrice = computed(() => {
    const all = this.hotels().map((hotel) => hotel.pricePerNight);
    return all.length ? Math.min(...all) : 0;
  });

  protected readonly maxPrice = computed(() => {
    const all = this.hotels().map((hotel) => hotel.pricePerNight);
    return all.length ? Math.max(...all) : 300;
  });

  protected readonly availableAmenities = computed(() => {
    const values = new Set<string>();
    for (const hotel of this.hotels()) {
      for (const amenity of hotel.amenities) {
        values.add(amenity);
      }
    }
    return Array.from(values);
  });

  protected readonly filteredHotels = computed(() => {
    const min = this.selectedMinPrice();
    const max = this.selectedMaxPrice();
    const selectedAmenities = this.selectedAmenities();
    const rating = this.selectedRating();
    const freeOnly = this.freeCancellationOnly();

    const filtered = this.hotels().filter((hotel) => {
      const matchesPrice = hotel.pricePerNight >= min && hotel.pricePerNight <= max;
      const matchesAmenities =
        !selectedAmenities.length ||
        selectedAmenities.every((amenity) => hotel.amenities.includes(amenity));
      const matchesRating = rating === null || hotel.rating >= rating;
      const matchesCancellation = !freeOnly || hotel.freeCancellation;

      return matchesPrice && matchesAmenities && matchesRating && matchesCancellation;
    });

    return this.applySort(filtered, this.sortBy());
  });

  protected readonly visibleHotels = computed(() =>
    this.filteredHotels().slice(0, this.visibleCount()),
  );

  protected readonly canLoadMore = computed(
    () => this.visibleHotels().length < this.filteredHotels().length,
  );

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const destination = (params.get('busqueda') || '').trim();
      const checkInDate = params.get('fecha_ingreso') || '';
      const checkOutDate = params.get('fecha_salida') || '';
      const guests = Number(params.get('nro_personas') || 1);

      if (!destination || !checkInDate || !checkOutDate || Number.isNaN(guests) || guests < 1) {
        this.loading.set(false);
        this.errorMessage.set(this.t('searchResults.validation.missingParams'));
        return;
      }

      const payload: SearchAvailableHotelsRequest = {
        busqueda: destination,
        fecha_ingreso: checkInDate,
        fecha_salida: checkOutDate,
        nro_personas: guests,
      };

      this.executeSearch(payload);
    });
  }

  protected onModifySearch(): void {
    void this.router.navigate(['/app/home-search'], {
      queryParams: {
        busqueda: this.criteria().destination,
        fecha_ingreso: this.criteria().checkInDate,
        fecha_salida: this.criteria().checkOutDate,
        nro_personas: this.criteria().guests,
      },
    });
  }

  protected onSortChange(value: SortOption): void {
    this.sortBy.set(value);
  }

  protected onToggleAmenity(amenity: string): void {
    const current = this.selectedAmenities();
    this.selectedAmenities.set(
      current.includes(amenity)
        ? current.filter((value) => value !== amenity)
        : [...current, amenity],
    );
  }

  protected onClearAllFilters(): void {
    this.selectedAmenities.set([]);
    this.selectedRating.set(null);
    this.freeCancellationOnly.set(false);
    this.selectedMinPrice.set(this.minPrice());
    this.selectedMaxPrice.set(this.maxPrice());
    this.visibleCount.set(10);
  }

  protected onLoadMore(): void {
    this.visibleCount.update((current) => current + 10);
  }

  protected onRetry(): void {
    const current = this.criteria();
    if (!current.destination || !current.checkInDate || !current.checkOutDate || !current.guests) {
      return;
    }

    this.executeSearch({
      busqueda: current.destination,
      fecha_ingreso: current.checkInDate,
      fecha_salida: current.checkOutDate,
      nro_personas: current.guests,
    });
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  private executeSearch(payload: SearchAvailableHotelsRequest): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.searchHotelsService.searchAvailableHotels(payload).subscribe({
      next: (response) => {
        const mappedCriteria = mapResponseToCriteria(response);
        const mappedHotels = mapResponseToHotels(response);

        this.criteria.set(mappedCriteria);
        this.hotels.set(mappedHotels);
        this.selectedMinPrice.set(this.minPrice());
        this.selectedMaxPrice.set(this.maxPrice());
        this.visibleCount.set(10);
        this.loading.set(false);
      },
      error: (error) => {
        const backendError = error?.error?.error as string | undefined;
        this.errorMessage.set(backendError || this.t('searchResults.states.errorDescription'));
        this.hotels.set([]);
        this.loading.set(false);
      },
    });
  }

  private applySort(hotels: HotelResultVm[], sortBy: SortOption): HotelResultVm[] {
    const items = [...hotels];

    if (sortBy === 'priceAsc') {
      return items.sort((a, b) => a.pricePerNight - b.pricePerNight);
    }

    if (sortBy === 'priceDesc') {
      return items.sort((a, b) => b.pricePerNight - a.pricePerNight);
    }

    if (sortBy === 'rating') {
      return items.sort((a, b) => b.rating - a.rating);
    }

    if (sortBy === 'distance') {
      return items.sort((a, b) => a.locationText.localeCompare(b.locationText));
    }

    return items.sort((a, b) => b.availableRooms - a.availableRooms);
  }
}
