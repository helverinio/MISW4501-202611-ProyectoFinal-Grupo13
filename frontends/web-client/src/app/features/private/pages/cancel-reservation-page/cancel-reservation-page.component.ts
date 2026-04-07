import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

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

type CancellationReason = 'travel_plans' | 'emergency' | 'work' | 'health' | 'other';

interface CancellationInfo {
  id: string;
  hotelName: string;
  roomType: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  roomRate: number;
  taxes: number;
  total: number;
  refundAmount: number;
}

@Component({
  selector: 'app-cancel-reservation-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './cancel-reservation-page.component.html',
  styleUrl: './cancel-reservation-page.component.scss',
})
export class CancelReservationPageComponent {
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly currencyService = inject(CurrencyService);
  private readonly reservationService = inject(ReservationService);
  private readonly searchHotelsService = inject(SearchHotelsService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly loading = signal<boolean>(true);
  protected readonly submitting = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly cancellationInfo = signal<CancellationInfo | null>(null);
  protected readonly selectedReason = signal<CancellationReason | null>(null);
  protected readonly comments = signal<string>('');
  protected readonly currentLanguage = this.i18n.currentLanguage;
  protected readonly currentCurrency = this.currencyService.currentCurrency;

  protected readonly reasonDisabled = computed(() => {
    return this.selectedReason() === null;
  });

  constructor() {
    this.loadReservationData();
  }

  protected t(key: string): string {
    return this.i18n.t(key as never);
  }

  protected label(
    key:
      | 'cancelReservation'
      | 'breadcrumbHome'
      | 'reviewReservation'
      | 'reservationSummary'
      | 'booking'
      | 'roomRate'
      | 'taxes'
      | 'totalPaid'
      | 'cancellationPolicy'
      | 'freeCancellation'
      | 'partialRefund'
      | 'noRefund'
      | 'currentStatus'
      | 'canCancelNow'
      | 'reasonForCancellation'
      | 'changeInTravelPlans'
      | 'personalEmergency'
      | 'workRelated'
      | 'healthConcerns'
      | 'other'
      | 'additionalComments'
      | 'importantNotice'
      | 'cannotUndo'
      | 'keepReservation'
      | 'confirmCancellation'
      | 'refunded'
      | 'processingDays'
      | 'nights'
      | 'guests',
  ): string {
    const lang = this.currentLanguage();
    const dictionary = {
      en: {
        cancelReservation: 'Cancel Reservation',
        breadcrumbHome: 'Home',
        reviewReservation: 'Review your reservation details and cancellation policy',
        reservationSummary: 'Reservation Summary',
        booking: 'Booking',
        roomRate: 'Room Rate',
        taxes: 'Taxes & Fees',
        totalPaid: 'Total Paid',
        cancellationPolicy: 'Cancellation Policy',
        freeCancellation: 'Free Cancellation',
        partialRefund: 'Partial Refund',
        noRefund: 'No Refund',
        currentStatus: 'Current Status',
        canCancelNow: 'You can cancel now and receive a full refund of',
        reasonForCancellation: 'Reason for Cancellation (Optional)',
        changeInTravelPlans: 'Change in travel plans',
        personalEmergency: 'Personal/Family emergency',
        workRelated: 'Work-related changes',
        healthConcerns: 'Health concerns',
        other: 'Other',
        additionalComments: 'Additional comments (optional)',
        importantNotice: 'Important Notice',
        cannotUndo:
          'This action cannot be undone. Once cancelled, you will need to make a new reservation if you wish to stay at this property.',
        keepReservation: 'Keep Reservation',
        confirmCancellation: 'Confirm Cancellation',
        refunded: 'Refunded',
        processingDays: 'Refunds are processed within 5-7 business days.',
        nights: 'nights',
        guests: 'guests',
      },
      es: {
        cancelReservation: 'Cancelar Reserva',
        breadcrumbHome: 'Home',
        reviewReservation: 'Revisa los detalles de tu reserva y la política de cancelación',
        reservationSummary: 'Resumen de la Reserva',
        booking: 'Reserva',
        roomRate: 'Tarifa de Habitación',
        taxes: 'Impuestos y Cargos',
        totalPaid: 'Total Pagado',
        cancellationPolicy: 'Política de Cancelación',
        freeCancellation: 'Cancelación Gratuita',
        partialRefund: 'Reembolso Parcial',
        noRefund: 'Sin Reembolso',
        currentStatus: 'Estado Actual',
        canCancelNow: 'Puedes cancelar ahora y recibir un reembolso completo de',
        reasonForCancellation: 'Razón de Cancelación (Opcional)',
        changeInTravelPlans: 'Cambios en planes de viaje',
        personalEmergency: 'Emergencia personal/familiar',
        workRelated: 'Cambios relacionados con trabajo',
        healthConcerns: 'Problemas de salud',
        other: 'Otro',
        additionalComments: 'Comentarios adicionales (opcional)',
        importantNotice: 'Aviso Importante',
        cannotUndo:
          'Esta acción no se puede deshacer. Una vez cancelada, tendrás que hacer una nueva reserva si deseas alojarte en este hotel.',
        keepReservation: 'Mantener Reserva',
        confirmCancellation: 'Confirmar Cancelación',
        refunded: 'Reembolsada',
        processingDays: 'Los reembolsos se procesan en un plazo de 5 a 7 días hábiles.',
        nights: 'noches',
        guests: 'huéspedes',
      },
      pt: {
        breadcrumbHome: 'Home',
        cancelReservation: 'Cancelar Reserva',
        reviewReservation: 'Revise os detalhes da sua reserva e política de cancelamento',
        reservationSummary: 'Resumo da Reserva',
        booking: 'Reserva',
        roomRate: 'Taxa de Quarto',
        taxes: 'Impostos e Taxas',
        totalPaid: 'Total Pago',
        cancellationPolicy: 'Política de Cancelamento',
        freeCancellation: 'Cancelamento Gratuito',
        partialRefund: 'Reembolso Parcial',
        noRefund: 'Sem Reembolso',
        currentStatus: 'Status Atual',
        canCancelNow: 'Você pode cancelar agora e receber um reembolso completo de',
        reasonForCancellation: 'Motivo do Cancelamento (Opcional)',
        changeInTravelPlans: 'Alteração nos planos de viagem',
        personalEmergency: 'Emergência pessoal/familiar',
        workRelated: 'Alterações relacionadas ao trabalho',
        healthConcerns: 'Problemas de saúde',
        other: 'Outro',
        additionalComments: 'Comentários adicionais (opcional)',
        importantNotice: 'Aviso Importante',
        cannotUndo:
          'Esta ação não pode ser desfeita. Após o cancelamento, você precisará fazer uma nova reserva se desejar ficar nesta propriedade.',
        keepReservation: 'Manter Reserva',
        confirmCancellation: 'Confirmar Cancelamento',
        refunded: 'Reembolsada',
        processingDays: 'Os reembolsos são processados em 5 a 7 dias úteis.',
        nights: 'noites',
        guests: 'hóspedes',
      },
    } as const;

    return dictionary[lang][key];
  }

  protected setReason(reason: CancellationReason): void {
    this.selectedReason.set(reason);
  }

  protected updateComments(value: string): void {
    this.comments.set(value);
  }

  protected goBack(): void {
    void this.router.navigate(['/app/mis-reservas']);
  }

  protected confirmCancellation(): void {
    if (!this.selectedReason() || !this.cancellationInfo()) {
      return;
    }

    this.submitting.set(true);
    this.reservationService.getEstados().subscribe({
      next: (estados) => {
        const cancelado = estados.find((item) => this.normalize(item.nombre).includes('cancel'));

        if (!cancelado) {
          this.submitting.set(false);
          this.errorMessage.set('No cancellation status is configured in the system.');
          return;
        }

        this.reservationService
          .updateReserva(this.cancellationInfo()!.id, { id_estado: cancelado.id })
          .pipe(finalize(() => this.submitting.set(false)))
          .subscribe({
            next: () => {
              void this.router.navigate(['/app/mis-reservas']);
            },
            error: (error) => {
              this.errorMessage.set(
                error?.error?.error || 'Failed to cancel reservation. Please try again.',
              );
            },
          });
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorMessage.set(error?.error?.error || 'Failed to load statuses for cancellation.');
      },
    });
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

  private loadReservationData(): void {
    // Get reservation data from query params or session
    this.activatedRoute.queryParams.subscribe((params) => {
      const reservaId = params['id'];
      if (!reservaId) {
        this.loading.set(false);
        this.errorMessage.set('Reservation not found');
        return;
      }

      this.loading.set(true);
      this.reservationService.getEstados().subscribe({
        next: (estados) => {
          this.loadReservationDetails(reservaId, estados);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Unable to load cancellation details. Please try again.');
        },
      });
    });
  }

  private loadReservationDetails(reservaId: string, estados: EstadoResponse[]): void {
    // For now, we'll receive data via queryParams
    // In a real scenario, we'd fetch from backend
    this.activatedRoute.queryParams.subscribe((params) => {
      const info: CancellationInfo = {
        id: params['id'] || '',
        hotelName: params['hotelName'] || '',
        roomType: params['roomType'] || '',
        location: params['location'] || '',
        checkIn: params['checkIn'] || '',
        checkOut: params['checkOut'] || '',
        guests: parseInt(params['guests'] || '0', 10),
        nights: parseInt(params['nights'] || '0', 10),
        roomRate: parseFloat(params['roomRate'] || '0'),
        taxes: parseFloat(params['taxes'] || '0'),
        total: parseFloat(params['total'] || '0'),
        refundAmount: parseFloat(params['total'] || '0'), // Full refund for confirmed reservations
      };

      this.cancellationInfo.set(info);
      this.loading.set(false);
    });
  }

  private getLocale(): string {
    const lang = this.currentLanguage();
    const localeMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      pt: 'pt-BR',
    };
    return localeMap[lang] || 'en-US';
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
