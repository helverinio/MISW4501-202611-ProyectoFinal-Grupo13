import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AmenityI18nService } from '../../../../core/services/amenity-i18n.service';
import { CurrencyService, SupportedCurrency } from '../../../../core/services/currency.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { HotelByIdResponse, HotelRoomResponse } from '../../models/search-results.models';
import { SearchHotelsService } from '../../services/search-hotels.service';

interface RoomCardVm {
  id: string;
  type: string;
  roomNumber: number;
  capacityLabel: string;
  pricePerNight: number;
  totalPrice: number;
  availabilityLabel: string;
  availabilityClass: string;
}

@Component({
  selector: 'app-hotel-details-page',
  imports: [CommonModule],
  templateUrl: './hotel-details-page.component.html',
  styleUrl: './hotel-details-page.component.scss',
})
export class HotelDetailsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly amenityI18n = inject(AmenityI18nService);
  private readonly i18n = inject(I18nService);
  private readonly currencyService = inject(CurrencyService);
  private readonly searchHotelsService = inject(SearchHotelsService);

  protected readonly currentLanguage = this.i18n.currentLanguage;
  protected readonly currentCurrency = this.currencyService.currentCurrency;

  protected readonly loading = signal<boolean>(true);
  protected readonly errorMessage = signal<string>('');
  protected readonly hotel = signal<HotelByIdResponse | null>(null);
  protected readonly rooms = signal<HotelRoomResponse[]>([]);

  protected readonly amenities = signal<string[]>([]);
  protected readonly checkInDate = signal<string>('');
  protected readonly checkOutDate = signal<string>('');
  protected readonly guests = signal<number>(2);

  protected readonly nights = computed(() => {
    const checkIn = this.checkInDate();
    const checkOut = this.checkOutDate();
    if (!checkIn || !checkOut) {
      return 1;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const value = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return value > 0 ? value : 1;
  });

  protected readonly roomCards = computed<RoomCardVm[]>(() => {
    const nights = this.nights();

    return this.rooms()
      .slice()
      .sort((a, b) => this.getRoomBasePrice(a) - this.getRoomBasePrice(b))
      .slice(0, 4)
      .map((room, index) => {
        const pricePerNight = this.getRoomBasePrice(room);
        const totalPrice = pricePerNight * nights;

        return {
          id: room.id,
          type: this.roomTypeLabel(room.tipo),
          roomNumber: room.nro_habitacion,
          capacityLabel: `${room.capacidad} ${this.getGuestWord(room.capacidad)}`,
          pricePerNight,
          totalPrice,
          availabilityLabel: index < 2 ? this.label('freeCancellationShort') : this.label('limitedAvailability'),
          availabilityClass: index < 2 ? 'text-emerald-600' : 'text-amber-600',
        };
      });
  });

  protected readonly heroPrice = computed(() => {
    const cards = this.roomCards();
    if (!cards.length) {
      return 0;
    }
    return cards[0].pricePerNight;
  });

  protected readonly totalPrice = computed(() => this.heroPrice() * this.nights());

  protected readonly taxesAndFees = computed(() => Math.round(this.totalPrice() * 0.1));

  protected readonly grandTotal = computed(() => this.totalPrice() + this.taxesAndFees());

  protected readonly galleryImages = computed(() => {
    const hotelName = this.hotel()?.nombre || 'Hotel';
    return [
      {
        url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/a92f3d7c4f-1e0ee6b02919a514b9a7.png',
        alt: `${hotelName} main image`,
      },
      {
        url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/4e6f48b055-69f26aafd8c0769cf47f.png',
        alt: `${hotelName} room image`,
      },
      {
        url: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/b93f2dc3c3-e6d426362ae13b17a8c0.png',
        alt: `${hotelName} pool image`,
      },
    ];
  });

  protected readonly formattedCheckIn = computed(() => this.formatDate(this.checkInDate()));

  protected readonly formattedCheckOut = computed(() => this.formatDate(this.checkOutDate()));

  protected readonly overviewDescription = computed(() => {
    const description = this.hotel()?.descripcion?.trim();
    if (!description) {
      return this.label('defaultDescription');
    }

    // Backend descriptions currently come seeded in Spanish.
    // For non-Spanish UI, show a localized fallback summary to avoid mixed-language content.
    if (this.currentLanguage() !== 'es') {
      return this.label('defaultDescription');
    }

    return description;
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const hotelId = params.get('hotelId');

      if (!hotelId) {
        this.errorMessage.set('No se encontró el identificador del hotel.');
        this.loading.set(false);
        return;
      }

      this.loadHotel(hotelId);
    });

    this.route.queryParamMap.subscribe((params) => {
      this.checkInDate.set(params.get('fecha_ingreso') || '');
      this.checkOutDate.set(params.get('fecha_salida') || '');

      const guests = Number(params.get('nro_personas') || 2);
      this.guests.set(Number.isNaN(guests) || guests < 1 ? 2 : guests);
    });
  }

  protected goBack(): void {
    void this.router.navigate(['/app/search-results']);
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected amenityLabel(amenity: string): string {
    return this.amenityI18n.translate(amenity, this.currentLanguage());
  }

  protected label(
    key:
      | 'searchResults'
      | 'freeCancellation'
      | 'securePayment'
      | 'morePhotos'
      | 'overview'
      | 'defaultDescription'
      | 'emptyAmenities'
      | 'availableRooms'
      | 'noRooms'
      | 'room'
      | 'freeCancellationShort'
      | 'limitedAvailability'
      | 'select'
      | 'reserveNow'
      | 'noChargeYet'
      | 'taxesFees'
      | 'notAvailable',
  ): string {
    const lang = this.currentLanguage();

    const dictionary = {
      en: {
        searchResults: 'Search Results',
        freeCancellation: 'Free Cancellation',
        securePayment: 'Secure Payment',
        morePhotos: '+12 more photos',
        overview: 'Overview',
        defaultDescription:
          'This hotel offers comfortable rooms, strategic location and a reliable booking experience for your trip.',
        emptyAmenities: 'No amenities registered for this hotel.',
        availableRooms: 'Available Rooms',
        noRooms: 'No rooms available for this hotel right now.',
        room: 'Room',
        freeCancellationShort: 'Free cancellation',
        limitedAvailability: 'Limited availability',
        select: 'Select',
        reserveNow: 'Reserve Now',
        noChargeYet: 'You will not be charged yet',
        taxesFees: 'Taxes & fees',
        notAvailable: 'N/A',
      },
      es: {
        searchResults: 'Resultados de busqueda',
        freeCancellation: 'Cancelacion gratis',
        securePayment: 'Pago seguro',
        morePhotos: '+12 fotos mas',
        overview: 'Descripcion general',
        defaultDescription:
          'Este hotel ofrece habitaciones comodas, ubicacion estrategica y una experiencia de reserva confiable para tu viaje.',
        emptyAmenities: 'Este hotel no tiene amenidades registradas.',
        availableRooms: 'Habitaciones disponibles',
        noRooms: 'No hay habitaciones disponibles para este hotel en este momento.',
        room: 'Habitacion',
        freeCancellationShort: 'Cancelacion gratis',
        limitedAvailability: 'Disponibilidad limitada',
        select: 'Seleccionar',
        reserveNow: 'Reservar ahora',
        noChargeYet: 'Todavia no se realizara ningun cobro',
        taxesFees: 'Impuestos y cargos',
        notAvailable: 'N/D',
      },
      pt: {
        searchResults: 'Resultados da busca',
        freeCancellation: 'Cancelamento gratis',
        securePayment: 'Pagamento seguro',
        morePhotos: '+12 fotos',
        overview: 'Visao geral',
        defaultDescription:
          'Este hotel oferece quartos confortaveis, localizacao estrategica e uma experiencia de reserva confiavel para sua viagem.',
        emptyAmenities: 'Nao ha comodidades registradas para este hotel.',
        availableRooms: 'Quartos disponiveis',
        noRooms: 'Nao ha quartos disponiveis para este hotel agora.',
        room: 'Quarto',
        freeCancellationShort: 'Cancelamento gratis',
        limitedAvailability: 'Disponibilidade limitada',
        select: 'Selecionar',
        reserveNow: 'Reservar agora',
        noChargeYet: 'Voce ainda nao sera cobrado',
        taxesFees: 'Impostos e taxas',
        notAvailable: 'N/D',
      },
    } as const;

    return dictionary[lang][key];
  }

  protected formatPrice(amountUsd: number): string {
    const currency = this.currentCurrency();
    const locale = this.getLocale();
    const converted = this.currencyService.convertFromUsd(amountUsd);

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'COP' || currency === 'CLP' ? 0 : 2,
    }).format(converted);
  }

  protected getGuestsLabel(count: number): string {
    return `${count} ${this.getGuestWord(count)}`;
  }

  protected roomTypeLabel(rawType: string): string {
    const lang = this.currentLanguage();
    const normalized = rawType
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const keyByType: Record<string, 'single' | 'double' | 'triple' | 'deluxeSuite' | 'presidentialSuite'> = {
      'habitacion sencilla': 'single',
      'habitacion doble': 'double',
      'habitacion triple': 'triple',
      'suite deluxe': 'deluxeSuite',
      'suite presidencial': 'presidentialSuite',
    };

    const key = keyByType[normalized];
    if (!key) {
      return rawType;
    }

    const dictionary = {
      en: {
        single: 'Single Room',
        double: 'Double Room',
        triple: 'Triple Room',
        deluxeSuite: 'Deluxe Suite',
        presidentialSuite: 'Presidential Suite',
      },
      es: {
        single: 'Habitacion Sencilla',
        double: 'Habitacion Doble',
        triple: 'Habitacion Triple',
        deluxeSuite: 'Suite Deluxe',
        presidentialSuite: 'Suite Presidencial',
      },
      pt: {
        single: 'Quarto Simples',
        double: 'Quarto Duplo',
        triple: 'Quarto Triplo',
        deluxeSuite: 'Suite Deluxe',
        presidentialSuite: 'Suite Presidencial',
      },
    } as const;

    return dictionary[lang][key];
  }

  private loadHotel(hotelId: string): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      hotel: this.searchHotelsService.getHotelById(hotelId),
      rooms: this.searchHotelsService.getRoomsByHotelId(hotelId),
    }).subscribe({
      next: ({ hotel, rooms }) => {
        this.hotel.set(hotel);
        this.rooms.set(rooms);
        this.amenities.set(this.parseAmenities(hotel.amenidades));
        this.loading.set(false);
      },
      error: (error) => {
        const backendError = error?.error?.error as string | undefined;
        this.errorMessage.set(backendError || 'No fue posible obtener la informacion del hotel.');
        this.loading.set(false);
      },
    });
  }

  private getRoomBasePrice(room: HotelRoomResponse): number {
    const seed = this.seededNumber(room.id);
    const type = room.tipo.toLowerCase();

    let base = 90;
    if (type.includes('suite')) {
      base = 220;
    } else if (type.includes('triple')) {
      base = 150;
    } else if (type.includes('doble')) {
      base = 130;
    } else if (type.includes('sencilla')) {
      base = 95;
    }

    return base + (seed % 35);
  }

  private seededNumber(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private parseAmenities(rawAmenities: string | null): string[] {
    if (!rawAmenities) {
      return [];
    }

    return rawAmenities
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private formatDate(value: string): string {
    if (!value) {
      return this.label('notAvailable');
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.getLocale(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(parsed);
  }

  private getLocale(): string {
    const lang = this.currentLanguage();
    if (lang === 'es') {
      return 'es-CO';
    }
    if (lang === 'pt') {
      return 'pt-BR';
    }
    return 'en-US';
  }

  private getGuestWord(count: number): string {
    const lang = this.currentLanguage();

    if (lang === 'es') {
      return count === 1 ? 'huesped' : 'huespedes';
    }

    if (lang === 'pt') {
      return count === 1 ? 'hospede' : 'hospedes';
    }

    return count === 1 ? 'guest' : 'guests';
  }
}
