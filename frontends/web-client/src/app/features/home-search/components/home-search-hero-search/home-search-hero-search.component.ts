import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { I18nService } from '../../../../core/services/i18n.service';

interface GuestOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-home-search-hero-search',
  imports: [FormsModule],
  templateUrl: './home-search-hero-search.component.html',
  styleUrl: './home-search-hero-search.component.scss',
})
export class HomeSearchHeroSearchComponent {
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected destination = '';
  protected checkInDate = this.getDateOffset(1);
  protected checkOutDate = this.getDateOffset(7);
  protected guests = 1;
  protected submitAttempted = false;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const destination = params.get('busqueda');
      const checkInDate = params.get('fecha_ingreso');
      const checkOutDate = params.get('fecha_salida');
      const guests = Number(params.get('nro_personas') || 1);

      if (destination) {
        this.destination = destination;
      }

      if (checkInDate) {
        this.checkInDate = checkInDate;
      }

      if (checkOutDate) {
        this.checkOutDate = checkOutDate;
      }

      if (!Number.isNaN(guests) && guests >= 1) {
        this.guests = guests;
      }
    });
  }

  protected guestOptions(): GuestOption[] {
    return [
      { value: 1, label: this.t('homeSearch.hero.guest1') },
      { value: 2, label: this.t('homeSearch.hero.guest2') },
      { value: 3, label: this.t('homeSearch.hero.guest3') },
      { value: 4, label: this.t('homeSearch.hero.guest4') },
      { value: 5, label: this.t('homeSearch.hero.guest5Plus') },
    ];
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected get todayDate(): string {
    return this.getDateOffset(0);
  }

  protected get isDestinationInvalid(): boolean {
    return this.submitAttempted && !this.destination.trim();
  }

  protected get isCheckInInvalid(): boolean {
    return this.submitAttempted && !!this.checkInDate && this.checkInDate < this.todayDate;
  }

  protected get isCheckOutInvalid(): boolean {
    return (
      this.submitAttempted &&
      !!this.checkOutDate &&
      !!this.checkInDate &&
      this.checkOutDate <= this.checkInDate
    );
  }

  protected get hasSearchErrors(): boolean {
    return this.isDestinationInvalid || this.isCheckInInvalid || this.isCheckOutInvalid;
  }

  protected onDestinationInput(): void {
    if (!this.submitAttempted) {
      return;
    }
    this.submitAttempted = true;
  }

  protected onCheckInInput(value: string): void {
    this.checkInDate = value;
    if (this.checkOutDate && this.checkOutDate <= value) {
      this.checkOutDate = this.getDateOffsetFrom(value, 1);
    }
  }

  protected onCheckOutInput(value: string): void {
    this.checkOutDate = value;
  }

  protected onSearchHotels(): void {
    this.submitAttempted = true;

    if (!this.destination.trim() || !this.checkInDate || !this.checkOutDate || this.guests < 1) {
      return;
    }

    if (this.checkInDate < this.todayDate || this.checkOutDate <= this.checkInDate) {
      return;
    }

    void this.router.navigate(['/app/search-results'], {
      queryParams: {
        busqueda: this.destination.trim(),
        fecha_ingreso: this.checkInDate,
        fecha_salida: this.checkOutDate,
        nro_personas: this.guests,
      },
    });
  }

  private getDateOffset(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  private getDateOffsetFrom(baseDate: string, daysFromBase: number): string {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + daysFromBase);
    return date.toISOString().split('T')[0];
  }
}
