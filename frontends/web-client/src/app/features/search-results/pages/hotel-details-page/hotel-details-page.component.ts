import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { AmenityI18nService } from '../../../../core/services/amenity-i18n.service';
import { CurrencyService, SupportedCurrency } from '../../../../core/services/currency.service';
import { I18nService } from '../../../../core/services/i18n.service';
import {
  HotelByIdResponse,
  HotelRoomResponse,
  SearchAvailableHotelsRequest,
  SearchAvailableHotelsResponse,
} from '../../models/search-results.models';
import { SearchHotelsService } from '../../services/search-hotels.service';

interface RoomCardVm {
  id: string;
  type: string;
  roomNumber: number;
  capacity: number;
  capacityLabel: string;
  pricePerNight: number;
  totalPrice: number;
  canReserve: boolean;
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
  protected readonly holdTimeoutMessage = signal<string>('');
  protected readonly destination = signal<string>('');
  protected readonly hotel = signal<HotelByIdResponse | null>(null);
  protected readonly rooms = signal<HotelRoomResponse[]>([]);
  protected readonly selectedRoomCard = signal<RoomCardVm | null>(null);

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
      .sort((a, b) => {
        const aHasPrice = this.hasRoomPrice(a);
        const bHasPrice = this.hasRoomPrice(b);

        if (aHasPrice !== bHasPrice) {
          return aHasPrice ? -1 : 1;
        }

        return this.getRoomNightlyPrice(a) - this.getRoomNightlyPrice(b);
      })
      .map((room, index) => {
        const canReserve = this.hasRoomPrice(room);
        const pricePerNight = this.getRoomNightlyPrice(room);
        const totalPrice = this.getRoomTotalPrice(room, nights);

        return {
          id: room.id,
          type: this.roomTypeLabel(room.tipo),
          roomNumber: room.nro_habitacion,
          capacity: room.capacidad,
          capacityLabel: `${room.capacidad} ${this.getGuestWord(room.capacidad)}`,
          pricePerNight,
          totalPrice,
          canReserve,
          availabilityLabel: !canReserve
            ? this.label('notAvailable')
            : index < 2
              ? this.label('freeCancellationShort')
              : this.label('limitedAvailability'),
          availabilityClass: !canReserve
            ? 'text-gray-500'
            : index < 2
              ? 'text-emerald-600'
              : 'text-amber-600',
        };
      });
  });

  protected readonly activeRoomCard = computed<RoomCardVm | null>(() => {
    const selectedId = this.selectedRoomCard()?.id;
    if (selectedId) {
      const selected = this.roomCards().find((room) => room.id === selectedId && room.canReserve);
      if (selected) {
        return selected;
      }
    }

    return this.roomCards().find((room) => room.canReserve) ?? null;
  });

  protected readonly guestsExceedCapacity = computed(() => {
    const room = this.activeRoomCard();
    if (!room) return false;
    return this.guests() > room.capacity;
  });

  protected readonly heroPrice = computed(() => this.activeRoomCard()?.pricePerNight ?? 0);

  protected readonly totalPrice = computed(() => this.heroPrice() * this.nights());

  protected readonly discountAmount = computed(() => {
    const discountRate = this.getAdvanceDiscountRate(this.checkInDate());
    return Math.round(this.totalPrice() * discountRate * 100) / 100;
  });

  protected readonly taxableAmount = computed(() =>
    Math.max(this.totalPrice() - this.discountAmount(), 0),
  );

  protected readonly taxesAndFees = computed(
    () => Math.round(this.taxableAmount() * 0.1 * 100) / 100,
  );

  protected readonly grandTotal = computed(() => this.taxableAmount() + this.taxesAndFees());

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

  protected readonly guestOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  protected todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  protected readonly checkOutMinDate = computed(() => {
    const checkIn = this.checkInDate();
    if (!checkIn) return this.todayIso();
    const d = new Date(checkIn);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  protected onCheckInChange(value: string): void {
    this.checkInDate.set(value);
    // If checkout is now before or equal to checkin, push it forward by 1 day
    if (this.checkOutDate() <= value) {
      const d = new Date(value);
      d.setDate(d.getDate() + 1);
      this.checkOutDate.set(d.toISOString().slice(0, 10));
    }
  }

  protected onCheckOutChange(value: string): void {
    this.checkOutDate.set(value);
  }

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
      this.destination.set((params.get('busqueda') || '').trim());
      this.checkInDate.set(params.get('fecha_ingreso') || '');
      this.checkOutDate.set(params.get('fecha_salida') || '');

      const holdExpired = params.get('hold_expired') === '1';
      this.holdTimeoutMessage.set(holdExpired ? this.label('holdExpiredError') : '');

      const guests = Number(params.get('nro_personas') || 2);
      this.guests.set(Number.isNaN(guests) || guests < 1 ? 2 : guests);
    });
  }

  protected goBack(): void {
    void this.router.navigate(['/app/search-results']);
  }

  protected selectRoom(room: RoomCardVm): void {
    if (!room.canReserve) {
      return;
    }

    this.selectedRoomCard.set(room);
  }

  protected onReserveNow(): void {
    const selectedRoom = this.activeRoomCard();
    if (!selectedRoom?.canReserve) {
      return;
    }

    void this.router.navigate(['/app/reservas/nueva'], {
      queryParams: {
        hotel_id: this.hotel()?.id,
        room_id: selectedRoom?.id,
        busqueda: this.destination(),
        fecha_ingreso: this.checkInDate(),
        fecha_salida: this.checkOutDate(),
        nro_personas: this.guests(),
      },
    });
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
      | 'earlyBirdDiscount'
      | 'taxesFees'
      | 'holdExpiredError'
      | 'roomType'
      | 'guestsExceedCapacity'
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
        earlyBirdDiscount: 'Early bird discount',
        taxesFees: 'Taxes & fees',
        holdExpiredError:
          'You exceeded the maximum time to complete the reservation. Please try again.',
        roomType: 'Room type',
        guestsExceedCapacity: 'Exceeds the maximum guests allowed for this room.',
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
        earlyBirdDiscount: 'Descuento por reserva anticipada',
        taxesFees: 'Impuestos y cargos',
        holdExpiredError:
          'Has excedido el tiempo maximo para completar la reserva. Intentalo nuevamente.',
        roomType: 'Tipo de habitacion',
        guestsExceedCapacity: 'Supera el maximo de huespedes permitido para esta habitacion.',
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
        earlyBirdDiscount: 'Desconto por reserva antecipada',
        taxesFees: 'Impostos e taxas',
        holdExpiredError: 'Voce excedeu o tempo maximo para concluir a reserva. Tente novamente.',
        roomType: 'Tipo de quarto',
        guestsExceedCapacity: 'Excede o maximo de hospedes permitido para este quarto.',
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

  protected displayRoomPrice(amountUsd: number, canReserve: boolean): string {
    return canReserve ? this.formatPrice(amountUsd) : this.label('notAvailable');
  }

  protected displayDiscount(amountUsd: number, canReserve: boolean): string {
    return canReserve ? `-${this.formatPrice(amountUsd)}` : this.label('notAvailable');
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

    const keyByType: Record<
      string,
      'single' | 'double' | 'triple' | 'deluxeSuite' | 'presidentialSuite'
    > = {
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

    const searchPayload = this.buildSearchPayload();

    forkJoin({
      hotel: this.searchHotelsService.getHotelById(hotelId),
      rooms: this.searchHotelsService.getRoomsByHotelId(hotelId),
    })
      .pipe(
        switchMap(({ hotel, rooms }) => {
          if (!searchPayload) {
            return of({ hotel, rooms });
          }

          return this.searchHotelsService.searchAvailableHotels(searchPayload).pipe(
            map((response) => ({
              hotel,
              rooms: this.mergeRoomPricing(rooms, hotel.id, response),
            })),
            catchError(() => of({ hotel, rooms })),
          );
        }),
      )
      .subscribe({
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

  private buildSearchPayload(): SearchAvailableHotelsRequest | null {
    const params = this.route.snapshot.queryParamMap;
    const destination = (params.get('busqueda') || '').trim();
    const checkInDate = params.get('fecha_ingreso') || '';
    const checkOutDate = params.get('fecha_salida') || '';
    const guests = Number(params.get('nro_personas') || 0);

    if (!destination || !checkInDate || !checkOutDate || Number.isNaN(guests) || guests < 1) {
      return null;
    }

    return {
      busqueda: destination,
      fecha_ingreso: checkInDate,
      fecha_salida: checkOutDate,
      nro_personas: guests,
    };
  }

  private mergeRoomPricing(
    rooms: HotelRoomResponse[],
    hotelId: string,
    response: SearchAvailableHotelsResponse,
  ): HotelRoomResponse[] {
    const matchingHotel = response.hoteles.find((hotel) => hotel.hotel_id === hotelId);
    if (!matchingHotel) {
      return rooms;
    }

    const pricedByRoomId = new Map(
      matchingHotel.habitaciones.map((room) => [
        room.habitacion_id,
        {
          moneda: room.moneda,
          precio_promedio_noche: room.precio_promedio_noche,
          precio_total_reserva: room.precio_total_reserva,
        },
      ]),
    );

    return rooms.map((room) => {
      const priced = pricedByRoomId.get(room.id);
      return priced ? { ...room, ...priced } : room;
    });
  }

  private getRoomNightlyPrice(room: HotelRoomResponse): number {
    return room.precio_promedio_noche ?? 0;
  }

  private getAdvanceDiscountRate(checkInDate: string): number {
    if (!checkInDate) {
      return 0;
    }

    const checkIn = new Date(`${checkInDate}T00:00:00`);
    if (Number.isNaN(checkIn.getTime())) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneMonthAhead = new Date(today);
    oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

    const threeMonthsAhead = new Date(today);
    threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

    if (checkIn >= threeMonthsAhead) {
      return 0.15;
    }

    if (checkIn >= oneMonthAhead) {
      return 0.1;
    }

    return 0;
  }

  private hasRoomPrice(room: HotelRoomResponse): boolean {
    return (room.precio_promedio_noche ?? 0) > 0;
  }

  private getRoomTotalPrice(room: HotelRoomResponse, nights: number): number {
    return this.getRoomNightlyPrice(room) * nights;
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
