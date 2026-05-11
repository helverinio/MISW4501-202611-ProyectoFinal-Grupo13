import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import {
  AdminReviewResponse,
  AdminReview,
  ReviewsFilterParams,
  SENTIMENT_OPTIONS,
  SORT_BY_OPTIONS,
  RATING_OPTIONS,
} from '../../../../core/models/reviews.models';
import { AdminTranslation, LanguageCode } from '../../../../core/i18n/translations';
import { I18nService } from '../../../../core/services/i18n.service';
import { ReviewsService } from '../../../../core/services/reviews.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RateManagementService } from '../../../../core/services/rate-management.service';
import { Hotel } from '../../../../core/models/rate-management.models';
import { AdminFooterComponent } from '../../../../shared/components/admin-footer/admin-footer.component';

@Component({
  selector: 'app-reviews-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminFooterComponent],
  templateUrl: './reviews-page.component.html',
})
export class ReviewsPageComponent implements OnInit {
  // Filter state
  selectedHotelId: string | null = null;
  selectedRating: number | null = null;
  selectedSentiment: string | null = null;
  searchText = '';
  dateFrom = '';
  dateTo = '';
  sortBy = 'created_at_desc';

  // Pagination state
  currentPage = 1;
  itemsPerPage = 10;

  // Data
  hotels: Hotel[] = [];
  reviews: AdminReview[] = [];
  kpis: any = null;
  totalReviews = 0;
  totalPages = 0;

  // UI state
  loading = false;
  loadingHotels = false;
  error: string | null = null;
  isEmpty = false;

  // Options for dropdowns
  readonly sentimentOptions = SENTIMENT_OPTIONS;
  readonly sortOptions = SORT_BY_OPTIONS;
  readonly ratingOptions = RATING_OPTIONS;
  readonly Math = Math; // Expose Math for template

  private requestSequence = 0;

  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly rateManagementService: RateManagementService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.loadHotels();
    this.loadReviews();
  }

  private loadHotels(): void {
    this.loadingHotels = true;
     this.rateManagementService.getMisHoteles().subscribe({
       next: (hotels: Hotel[]) => {
        this.hotels = hotels;
        this.loadingHotels = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error loading hotels:', err);
        this.error = this.t('reviews.errors.loading_hotels');
        this.loadingHotels = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadReviews(): void {
    this.loading = true;
    this.error = null;
    this.isEmpty = false;
    this.requestSequence++;
    const currentSequence = this.requestSequence;

    const params: ReviewsFilterParams = {
      page: this.currentPage,
      per_page: this.itemsPerPage,
      sort_by: this.sortBy as any,
    };

    if (this.selectedHotelId && this.selectedHotelId !== 'all') {
      params.hotel_id = this.selectedHotelId;
    }
    if (this.selectedRating != null && !isNaN(this.selectedRating)) {
      params.rating = this.selectedRating;
    }
    if (this.selectedSentiment) {
      params.sentiment = this.selectedSentiment as any;
    }
    if (this.searchText.trim()) {
      params.search = this.searchText.trim();
    }
    if (this.dateFrom) {
      params.date_from = new Date(this.dateFrom).toISOString();
    }
    if (this.dateTo) {
      params.date_to = new Date(this.dateTo).toISOString();
    }

    this.reviewsService
      .getAdminReviews(params)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response: AdminReviewResponse) => {
          // Ignore stale responses from previous requests
          if (currentSequence !== this.requestSequence) {
            return;
          }

          this.reviews = response.reviews;
          this.kpis = response.kpis;
          this.totalReviews = response.total;
          this.totalPages = response.total_pages;
          this.isEmpty = response.total === 0;
        },
        error: (err) => {
          if (currentSequence === this.requestSequence) {
            console.error('Error loading reviews:', err);
            this.error = this.t('reviews.errors.loading_reviews');
          }
        },
      });
  }

  clearFilters(): void {
    this.selectedHotelId = null;
    this.selectedRating = null;
    this.selectedSentiment = null;
    this.searchText = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.sortBy = 'created_at_desc';
    this.currentPage = 1;
    this.loadReviews();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReviews();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getRatingStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  isStarFilled(starValue: number, rating: number): boolean {
    return starValue <= rating;
  }

  getSentimentBadgeClass(sentiment: string): string {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getSentimentLabel(sentiment: string): string {
    return this.t(`reviews.sentiments.${sentiment}` as any);
  }

  /**
   * Translation helper - proxy to I18nService.t()
   */
  t(key: keyof AdminTranslation): string {
    return this.i18n.t(key);
  }

  currentUser() {
    return this.authService.currentUser();
  }

  get currentLanguage() {
    return this.i18n.currentLanguage();
  }

  setLanguage(lang: LanguageCode): void {
    this.i18n.setLanguage(lang);
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
