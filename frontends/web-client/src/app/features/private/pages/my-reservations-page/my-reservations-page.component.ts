import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { HotelByIdResponse } from '../../../search-results/models/search-results.models';
import { SearchHotelsService } from '../../../search-results/services/search-hotels.service';
import {
  EstadoResponse,
  HabitacionResponse,
  PaisResponse,
  ReservaResponse,
  ReservationService,
} from '../../../search-results/services/reservation.service';

type ReservationTab = 'all' | 'upcoming' | 'past' | 'cancelled';
type ReservationStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

interface ReservationItemVm {
  id: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  status: ReservationStatus;
  statusLabel: string;
}

@Component({
  selector: 'app-my-reservations-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './my-reservations-page.component.html',
  styleUrl: './my-reservations-page.component.scss',
})
export class MyReservationsPageComponent {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly currencyService = inject(CurrencyService);
  private readonly reservationService = inject(ReservationService);
  private readonly searchHotelsService = inject(SearchHotelsService);
  private readonly router = inject(Router);

  protected readonly loading = signal<boolean>(true);
  protected readonly errorMessage = signal<string>('');
  protected readonly reservations = signal<ReservationItemVm[]>([]);
  protected readonly activeTab = signal<ReservationTab>('all');
  protected readonly searchTerm = signal<string>('');
  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = 4;
  protected readonly currentLanguage = this.i18n.currentLanguage;
  protected readonly currentCurrency = this.currencyService.currentCurrency;

  protected readonly filteredReservations = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().trim().toLowerCase();

    return this.reservations().filter((reservation) => {
      const matchesTab =
        tab === 'all' ||
        (tab === 'upcoming' &&
          (reservation.status === 'confirmed' || reservation.status === 'pending')) ||
        (tab === 'past' && reservation.status === 'completed') ||
        (tab === 'cancelled' && reservation.status === 'cancelled');

      if (!matchesTab) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        reservation.id,
        reservation.hotelName,
        reservation.roomType,
        reservation.location,
        reservation.statusLabel,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  });

  protected readonly totalPages = computed(() => {
    const total = Math.ceil(this.filteredReservations().length / this.pageSize);
    return total > 0 ? total : 1;
  });

  protected readonly visibleReservations = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredReservations().slice(start, start + this.pageSize);
  });

  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  constructor() {
    this.loadReservations();
  }

  protected t(key: string): string {
    return this.i18n.t(key as never);
  }

  protected label(
    key:
      | 'breadcrumbHome'
      | 'title'
      | 'subtitle'
      | 'allReservations'
      | 'upcoming'
      | 'past'
      | 'cancelled'
      | 'searchPlaceholder'
      | 'booking'
      | 'viewDetails'
      | 'modify'
      | 'cancel'
      | 'bookAgain'
      | 'totalFor'
      | 'nights'
      | 'guests'
      | 'refunded'
      | 'emptyTitle'
      | 'emptySubtitle'
      | 'loadError'
      | 'missingUser'
      | 'confirmed'
      | 'pending'
      | 'completed'
      | 'cancelledStatus',
  ): string {
    const lang = this.currentLanguage();
    const dictionary = {
      en: {
        breadcrumbHome: 'Home',
        title: 'My Reservations',
        subtitle: 'Manage your hotel bookings and travel plans',
        allReservations: 'All Reservations',
        upcoming: 'Upcoming',
        past: 'Past',
        cancelled: 'Cancelled',
        searchPlaceholder: 'Search reservations...',
        booking: 'Booking',
        viewDetails: 'View Details',
        modify: 'Modify',
        cancel: 'Cancel',
        bookAgain: 'Book Again',
        totalFor: 'Total for',
        nights: 'nights',
        guests: 'guests',
        refunded: 'Refunded',
        emptyTitle: 'No reservations found',
        emptySubtitle: 'Try another filter or make a new booking.',
        loadError: 'Could not load your reservations.',
        missingUser: 'No authenticated user found.',
        confirmed: 'Confirmed',
        pending: 'Pending',
        completed: 'Completed',
        cancelledStatus: 'Cancelled',
      },
      es: {
        breadcrumbHome: 'Home',
        title: 'Mis Reservas',
        subtitle: 'Administra tus reservas de hotel y planes de viaje',
        allReservations: 'Todas las reservas',
        upcoming: 'Próximas',
        past: 'Pasadas',
        cancelled: 'Canceladas',
        searchPlaceholder: 'Buscar reservas...',
        booking: 'Reserva',
        viewDetails: 'Ver detalle',
        modify: 'Modificar',
        cancel: 'Cancelar',
        bookAgain: 'Reservar de nuevo',
        totalFor: 'Total por',
        nights: 'noches',
        guests: 'huéspedes',
        refunded: 'Reembolsada',
        emptyTitle: 'No se encontraron reservas',
        emptySubtitle: 'Prueba otro filtro o realiza una nueva reserva.',
        loadError: 'No fue posible cargar tus reservas.',
        missingUser: 'No hay un usuario autenticado.',
        confirmed: 'Confirmada',
        pending: 'Pendiente',
        completed: 'Completada',
        cancelledStatus: 'Cancelada',
      },
      pt: {
        breadcrumbHome: 'Home',
        title: 'Minhas Reservas',
        subtitle: 'Gerencie suas reservas de hotel e planos de viagem',
        allReservations: 'Todas as reservas',
        upcoming: 'Próximas',
        past: 'Anteriores',
        cancelled: 'Canceladas',
        searchPlaceholder: 'Buscar reservas...',
        booking: 'Reserva',
        viewDetails: 'Ver detalhes',
        modify: 'Modificar',
        cancel: 'Cancelar',
        bookAgain: 'Reservar novamente',
        totalFor: 'Total para',
        nights: 'noites',
        guests: 'hóspedes',
        refunded: 'Reembolsada',
        emptyTitle: 'Nenhuma reserva encontrada',
        emptySubtitle: 'Tente outro filtro ou faça uma nova reserva.',
        loadError: 'Não foi possível carregar suas reservas.',
        missingUser: 'Nenhum usuário autenticado encontrado.',
        confirmed: 'Confirmada',
        pending: 'Pendente',
        completed: 'Concluída',
        cancelledStatus: 'Cancelada',
      },
    } as const;

    return dictionary[lang][key];
  }

  protected setTab(tab: ReservationTab): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  protected onSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  protected navigateToReservation(reservation: ReservationItemVm): void {
    void this.router.navigate(['/app/hoteles', reservation.hotelId], {
      queryParams: {
        fecha_ingreso: reservation.checkIn,
        fecha_salida: reservation.checkOut,
        nro_personas: reservation.guests,
      },
    });
  }

  protected navigateToModify(reservation: ReservationItemVm): void {
    void this.router.navigate(['/app/hoteles', reservation.hotelId], {
      queryParams: {
        fecha_ingreso: reservation.checkIn,
        fecha_salida: reservation.checkOut,
        nro_personas: reservation.guests,
      },
    });
  }

  protected navigateToCancelReservation(reservation: ReservationItemVm): void {
    void this.router.navigate(['/app/cancelar-reserva'], {
      queryParams: {
        id: reservation.id,
        hotelName: reservation.hotelName,
        roomType: reservation.roomType,
        location: reservation.location,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        guests: reservation.guests,
        nights: reservation.nights,
        roomRate: (reservation.total / reservation.nights).toFixed(2),
        taxes: '0',
        total: reservation.total,
      },
    });
  }

  protected primaryActionLabel(reservation: ReservationItemVm): string {
    if (reservation.status === 'completed') {
      return this.label('bookAgain');
    }
    if (reservation.status === 'pending') {
      return this.label('cancel');
    }
    return this.label('modify');
  }

  protected statusClasses(status: ReservationStatus): string {
    if (status === 'confirmed') {
      return 'bg-emerald-50 text-emerald-600';
    }
    if (status === 'pending') {
      return 'bg-amber-50 text-amber-600';
    }
    if (status === 'cancelled') {
      return 'bg-rose-50 text-rose-500';
    }
    return 'bg-slate-100 text-slate-500';
  }

  protected primaryActionClasses(status: ReservationStatus): string {
    if (status === 'pending') {
      return 'bg-red-500 text-white hover:bg-red-600';
    }
    if (status === 'completed') {
      return 'bg-primary text-white hover:bg-primary-dark';
    }
    return 'bg-primary text-white hover:bg-primary-dark';
  }

  protected formatPrice(amountUsd: number): string {
    const currency = this.currentCurrency();
    const converted = this.currencyService.convertFromUsd(amountUsd);
    const locale = this.getLocale();

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'COP' || currency === 'CLP' ? 0 : 2,
    }).format(converted);
  }

  protected formatDateRange(reservation: ReservationItemVm): string {
    return `${this.formatDate(reservation.checkIn)} - ${this.formatDate(reservation.checkOut)}`;
  }

  protected translateRoomType(roomType: string): string {
    const lang = this.currentLanguage();
    const normalized = roomType.toLowerCase().trim();

    const roomTypeMap: Record<string, Record<string, string>> = {
      en: {
        'suite presidencial': 'Presidential Suite',
        'habitación deluxe': 'Deluxe Room',
        'habitación estándar': 'Standard Room',
        'habitación doble': 'Double Room',
        'habitación triple': 'Triple Room',
        'habitación individual': 'Single Room',
        'suite junior': 'Junior Suite',
        'suite ejecutiva': 'Executive Suite',
      },
      es: {
        'presidential suite': 'Suite Presidencial',
        'deluxe room': 'Habitación Deluxe',
        'standard room': 'Habitación Estándar',
        'double room': 'Habitación Doble',
        'triple room': 'Habitación Triple',
        'single room': 'Habitación Individual',
        'junior suite': 'Suite Junior',
        'executive suite': 'Suite Ejecutiva',
      },
      pt: {
        'suite presidencial': 'Suite Presidencial',
        'habitación deluxe': 'Quarto Deluxe',
        'habitación estándar': 'Quarto Padrão',
        'habitación doble': 'Quarto Duplo',
        'habitación triple': 'Quarto Triplo',
        'habitación individual': 'Quarto Individual',
        'suite junior': 'Suite Junior',
        'suite ejecutiva': 'Suite Executiva',
      },
    };

    return roomTypeMap[lang]?.[normalized] || roomType;
  }

  protected formatAmountNote(nights: number, status: ReservationStatus): string {
    if (status === 'cancelled') {
      return this.label('refunded');
    }

    const lang = this.currentLanguage();
    const nightLabel = nights === 1 ? this.getNightSingular() : this.label('nights');

    return `${this.label('totalFor')} ${nights} ${nightLabel}`;
  }

  private getNightSingular(): string {
    const lang = this.currentLanguage();
    const singular: Record<string, string> = {
      en: 'night',
      es: 'noche',
      pt: 'noite',
    };
    return singular[lang] || 'night';
  }

  private loadReservations(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.loading.set(false);
      this.errorMessage.set(this.label('missingUser'));
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      reservas: this.reservationService.getReservasByUsuario(String(user.id)),
      estados: this.reservationService.getEstados(),
    })
      .pipe(
        switchMap(({ reservas, estados }) => {
          if (!reservas.length) {
            return of([] as ReservationItemVm[]);
          }

          return forkJoin(reservas.map((reserva) => this.enrichReservation(reserva, estados)));
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (items) => {
          const sorted = items.sort((left, right) => right.checkIn.localeCompare(left.checkIn));
          this.reservations.set(sorted);
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.error || this.label('loadError'));
        },
      });
  }

  private enrichReservation(reserva: ReservaResponse, estados: EstadoResponse[]) {
    return this.reservationService.getHabitacionById(reserva.id_habitacion).pipe(
      switchMap((habitacion) =>
        this.searchHotelsService.getHotelById(habitacion.id_hotel).pipe(
          switchMap((hotel) =>
            forkJoin({
              ciudad: this.reservationService.getCiudadById(hotel.id_ciudad),
              pais: this.reservationService.getPaisById(reserva.id_pais),
            }).pipe(
              map(({ ciudad, pais }) =>
                this.toReservationVm(reserva, habitacion, hotel, ciudad.nombre, pais, estados),
              ),
            ),
          ),
        ),
      ),
      catchError(() => of(this.toFallbackReservationVm(reserva, estados))),
    );
  }

  private toReservationVm(
    reserva: ReservaResponse,
    habitacion: HabitacionResponse,
    hotel: HotelByIdResponse,
    ciudadNombre: string,
    pais: PaisResponse,
    estados: EstadoResponse[],
  ): ReservationItemVm {
    const status = this.resolveStatus(reserva, estados);
    const nights = this.getNights(reserva.fecha_ingreso, reserva.fecha_salida);

    return {
      id: reserva.id,
      hotelId: hotel.id,
      hotelName: hotel.nombre,
      roomType: habitacion.tipo,
      location: `${ciudadNombre}, ${pais.nombre}`,
      checkIn: this.toDateOnly(reserva.fecha_ingreso),
      checkOut: this.toDateOnly(reserva.fecha_salida),
      guests: reserva.nro_personas,
      nights,
      total: reserva.total,
      status,
      statusLabel: this.statusLabel(status),
    };
  }

  private toFallbackReservationVm(
    reserva: ReservaResponse,
    estados: EstadoResponse[],
  ): ReservationItemVm {
    const status = this.resolveStatus(reserva, estados);
    const nights = this.getNights(reserva.fecha_ingreso, reserva.fecha_salida);

    return {
      id: reserva.id,
      hotelId: '',
      hotelName: 'TravelHub Hotel',
      roomType: 'Standard Room',
      location: 'Colombia',
      checkIn: this.toDateOnly(reserva.fecha_ingreso),
      checkOut: this.toDateOnly(reserva.fecha_salida),
      guests: reserva.nro_personas,
      nights,
      total: reserva.total,
      status,
      statusLabel: this.statusLabel(status),
    };
  }

  private resolveStatus(reserva: ReservaResponse, estados: EstadoResponse[]): ReservationStatus {
    const estado = estados.find((item) => item.id === reserva.id_estado)?.nombre || '';
    const normalized = this.normalize(estado);
    const today = new Date();
    const checkout = new Date(reserva.fecha_salida);

    if (normalized.includes('cancel')) {
      return 'cancelled';
    }

    if (checkout.getTime() < new Date(today.toDateString()).getTime()) {
      return 'completed';
    }

    if (normalized.includes('pend')) {
      return 'pending';
    }

    return 'confirmed';
  }

  private statusLabel(status: ReservationStatus): string {
    if (status === 'confirmed') {
      return this.label('confirmed');
    }
    if (status === 'pending') {
      return this.label('pending');
    }
    if (status === 'cancelled') {
      return this.label('cancelledStatus');
    }
    return this.label('completed');
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.getLocale(), {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private getNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  }

  private toDateOnly(value: string): string {
    return value.slice(0, 10);
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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
}
