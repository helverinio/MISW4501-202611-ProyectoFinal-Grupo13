import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { I18nService } from '../../../../core/services/i18n.service';
import {
  HotelByIdResponse,
  HotelRoomResponse,
  SearchAvailableHotelsRequest,
  SearchAvailableHotelsResponse,
} from '../../models/search-results.models';
import {
  CreateReservaPayload,
  EstadoResponse,
  ReservationService,
  RoomHoldResponse,
  CreatedReservaResponse,
} from '../../services/reservation.service';
import { SearchHotelsService } from '../../services/search-hotels.service';

@Component({
  selector: 'app-reservation-form-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-form-page.component.html',
  styleUrl: './reservation-form-page.component.scss',
})
export class ReservationFormPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly authService = inject(AuthService);
  private readonly currencyService = inject(CurrencyService);
  private readonly searchHotelsService = inject(SearchHotelsService);
  private readonly reservationService = inject(ReservationService);

  protected readonly currentLanguage = this.i18n.currentLanguage;
  protected readonly currentCurrency = this.currencyService.currentCurrency;

  protected readonly loading = signal<boolean>(true);
  protected readonly submitting = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly successMessage = signal<string>('');
  protected readonly holdExpiresAt = signal<Date | null>(null);
  protected readonly remainingHoldSeconds = signal<number>(0);
  protected readonly currentHoldId = signal<string | null>(null);
  protected readonly createdReservation = signal<CreatedReservaResponse | null>(null);

  protected readonly hotel = signal<HotelByIdResponse | null>(null);
  protected readonly rooms = signal<HotelRoomResponse[]>([]);

  protected readonly countryPhoneCodes = [
    { code: '+57', label: 'Colombia (+57)' },
    { code: '+1', label: 'USA (+1)' },
    { code: '+55', label: 'Brasil (+55)' },
    { code: '+52', label: 'Mexico (+52)' },
    { code: '+54', label: 'Argentina (+54)' },
    { code: '+56', label: 'Chile (+56)' },
    { code: '+51', label: 'Peru (+51)' },
    { code: '+593', label: 'Ecuador (+593)' },
    { code: '+58', label: 'Venezuela (+58)' },
    { code: '+34', label: 'Espana (+34)' },
    { code: '+44', label: 'Reino Unido (+44)' },
    { code: '+49', label: 'Alemania (+49)' },
  ] as const;

  protected readonly reservationForm = this.fb.nonNullable.group({
    hotelId: ['', [Validators.required]],
    roomId: ['', [Validators.required]],
    fechaIngreso: ['', [Validators.required]],
    fechaSalida: ['', [Validators.required]],
    nroPersonas: [2, [Validators.required, Validators.min(1)]],
    paymentMethod: ['card' as 'card' | 'pse' | 'transfer', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phonePrefix: ['+57'],
    phone: ['', [Validators.required]],
    specialRequests: [''],
    arrivalTime: ['unknown'],
  });

  protected readonly selectedRoom = computed(() => {
    const selectedRoomId = this.reservationForm.controls.roomId.value;
    return this.rooms().find((room) => room.id === selectedRoomId) || null;
  });

  protected readonly nights = computed(() => {
    const checkIn = this.reservationForm.controls.fechaIngreso.value;
    const checkOut = this.reservationForm.controls.fechaSalida.value;

    if (!checkIn || !checkOut) {
      return 1;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const value = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return value > 0 ? value : 1;
  });

  protected readonly pricePerNight = computed(() => {
    const room = this.selectedRoom();
    if (!room) {
      return 0;
    }
    return this.getRoomNightlyPrice(room);
  });

  protected readonly totalPrice = computed(() => {
    const room = this.selectedRoom();
    if (!room) {
      return 0;
    }

    if ((room.precio_total_reserva ?? 0) > 0) {
      return room.precio_total_reserva as number;
    }

    return this.getRoomNightlyPrice(room) * this.nights();
  });

  protected readonly discountAmount = computed(() => (this.nights() >= 3 ? 25 : 0));

  protected readonly taxesAmount = computed(() => {
    const taxable = Math.max(this.totalPrice() - this.discountAmount(), 0);
    return Math.round(taxable * 0.12 * 100) / 100;
  });

  protected readonly grandTotal = computed(
    () => Math.max(this.totalPrice() - this.discountAmount(), 0) + this.taxesAmount(),
  );

  protected readonly holdCountdownLabel = computed(() => {
    const remaining = this.remainingHoldSeconds();
    const safe = remaining > 0 ? remaining : 0;
    const minutes = Math.floor(safe / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (safe % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  protected readonly hasActiveHold = computed(() => this.remainingHoldSeconds() > 0);

  private holdTimerId: ReturnType<typeof setInterval> | null = null;
  private hasNavigatedOnHoldExpiry = false;

  constructor() {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const hotelId = params.get('hotel_id') || '';
          const roomId = params.get('room_id') || '';
          const destination = (params.get('busqueda') || '').trim();
          const fechaIngreso = params.get('fecha_ingreso') || '';
          const fechaSalida = params.get('fecha_salida') || '';
          const nroPersonas = Number(params.get('nro_personas') || 2);

          this.reservationForm.reset({
            hotelId,
            roomId,
            fechaIngreso,
            fechaSalida,
            nroPersonas: Number.isNaN(nroPersonas) || nroPersonas < 1 ? 2 : nroPersonas,
            paymentMethod: 'card',
            firstName: '',
            lastName: '',
            email: '',
            phonePrefix: '+57',
            phone: '',
            specialRequests: '',
            arrivalTime: 'unknown',
          });

          if (!hotelId) {
            this.loading.set(false);
            this.errorMessage.set(this.label('missingHotelId'));
            return [];
          }

          const searchPayload = this.buildSearchPayload(
            destination,
            fechaIngreso,
            fechaSalida,
            nroPersonas,
          );

          const search$ = searchPayload
            ? this.searchHotelsService
                .searchAvailableHotels(searchPayload)
                .pipe(catchError(() => of(null)))
            : of(null);

          return forkJoin({
            hotel: this.searchHotelsService.getHotelById(hotelId),
            rooms: this.searchHotelsService.getRoomsByHotelId(hotelId),
            search: search$,
          });
        }),
      )
      .subscribe({
        next: (data: any) => {
          if (!data?.hotel) {
            return;
          }

          this.hotel.set(data.hotel as HotelByIdResponse);
          this.rooms.set(
            this.mergeRoomPricing(
              (data.rooms as HotelRoomResponse[]) || [],
              (data.hotel as HotelByIdResponse).id,
              data.search as SearchAvailableHotelsResponse | null,
            ),
          );

          if (!this.rooms().length) {
            this.errorMessage.set(this.label('noRoomsAvailable'));
            this.loading.set(false);
            return;
          }

          const selectedRoomId = this.reservationForm.controls.roomId.value;
          const roomExists = this.rooms().some((room) => room.id === selectedRoomId);

          if (!roomExists) {
            const cheapestRoom = this.rooms()
              .slice()
              .sort((a, b) => this.getRoomNightlyPrice(a) - this.getRoomNightlyPrice(b))[0];
            this.reservationForm.controls.roomId.setValue(cheapestRoom.id);
          }

          this.acquireInitialHold();

          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.error || this.label('loadError'));
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.clearHoldTimer();
  }

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }

  protected isEmailInvalid(): boolean {
    const control = this.reservationForm.controls.email;
    const value = (control.value || '').trim();

    if (!value) {
      return control.touched;
    }

    return control.hasError('email');
  }

  protected label(
    key:
      | 'title'
      | 'subtitle'
      | 'reservationHoldText'
      | 'reservationHoldHint'
      | 'guestInfo'
      | 'primaryGuest'
      | 'contactInfo'
      | 'specialRequests'
      | 'arrivalTime'
      | 'bookingSummary'
      | 'hotel'
      | 'room'
      | 'checkIn'
      | 'checkOut'
      | 'guests'
      | 'roomType'
      | 'paymentMethod'
      | 'pricePerNight'
      | 'nightsLabel'
      | 'earlyBirdDiscount'
      | 'taxesFees'
      | 'secureBooking'
      | 'sslPayment'
      | 'freeCancellation'
      | 'support247'
      | 'total'
      | 'submit'
      | 'submitting'
      | 'goBack'
      | 'missingHotelId'
      | 'noRoomsAvailable'
      | 'loadError'
      | 'invalidEmail'
      | 'successPrefix'
      | 'bookingConfirmed'
      | 'bookingConfirmedSub'
      | 'bookingId'
      | 'guestName'
      | 'phone'
      | 'paymentSummary'
      | 'totalPaid'
      | 'confirmationEmailSent'
      | 'confirmationEmailBody'
      | 'manageBooking'
      | 'backToHome'
      | 'downloadPdf'
      | 'paidWith'
      | 'whatsNext'
      | 'preArrivalTitle'
      | 'preArrivalDesc'
      | 'mobileCheckinTitle'
      | 'mobileCheckinDesc'
      | 'support247Desc'
      | 'bestPriceGuarantee'
      | 'confirmationEmailInbox',
  ): string {
    const lang = this.currentLanguage();

    const dictionary = {
      en: {
        title: 'Complete your reservation',
        subtitle: 'Review details before confirming your booking.',
        reservationHoldText: 'Your reservation is held for',
        reservationHoldHint: 'Complete your booking to secure this price',
        guestInfo: 'Guest Information',
        primaryGuest: 'Primary Guest',
        contactInfo: 'Contact Information',
        specialRequests: 'Special Requests',
        arrivalTime: 'Arrival Time',
        bookingSummary: 'Booking Summary',
        hotel: 'Hotel',
        room: 'Room',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        guests: 'Guests',
        roomType: 'Room type',
        paymentMethod: 'Payment method',
        pricePerNight: 'Price per night',
        nightsLabel: 'nights',
        earlyBirdDiscount: 'Early bird discount',
        taxesFees: 'Taxes',
        secureBooking: 'Secure Booking',
        sslPayment: 'SSL encrypted payment',
        freeCancellation: 'Free cancellation',
        support247: '24/7 customer support',
        total: 'Estimated total',
        submit: 'Continue to Payment',
        submitting: 'Creating reservation...',
        goBack: 'Back to hotel',
        missingHotelId: 'Missing hotel identifier to start reservation flow.',
        noRoomsAvailable: 'No rooms available for this hotel.',
        loadError: 'Could not load reservation data.',
        invalidEmail: 'Please enter a valid email address.',
        successPrefix: 'Reservation created successfully. ID:',
        bookingConfirmed: 'Booking Confirmed!',
        bookingConfirmedSub: 'Your reservation has been successfully processed.',
        bookingId: 'Booking ID',
        guestName: 'Guest Name',
        phone: 'Phone',
        paymentSummary: 'Payment Summary',
        totalPaid: 'Total Paid',
        confirmationEmailSent: 'Confirmation Email Sent',
        confirmationEmailBody: "We've sent your booking details and receipt to",
        manageBooking: 'Manage Booking',
        backToHome: 'Back to Home',
        downloadPdf: 'Download PDF',
        paidWith: 'Paid with',
        whatsNext: "What's Next?",
        preArrivalTitle: 'Pre-arrival Information',
        preArrivalDesc:
          "You'll receive a reminder 24 hours before check-in with important details.",
        mobileCheckinTitle: 'Mobile Check-in',
        mobileCheckinDesc: 'Download our app for faster check-in and digital room key access.',
        support247Desc: 'Need to make changes? Our support team is available anytime.',
        bestPriceGuarantee: 'Best Price Guarantee',
        confirmationEmailInbox: 'Please check your inbox (and spam folder just in case).',
      },
      es: {
        title: 'Completa tu reserva',
        subtitle: 'Revisa los datos antes de confirmar tu reserva.',
        reservationHoldText: 'Tu reserva esta retenida por',
        reservationHoldHint: 'Completa tu reserva para asegurar este precio',
        guestInfo: 'Informacion del huesped',
        primaryGuest: 'Huesped principal',
        contactInfo: 'Informacion de contacto',
        specialRequests: 'Solicitudes especiales',
        arrivalTime: 'Hora de llegada',
        bookingSummary: 'Resumen de reserva',
        hotel: 'Hotel',
        room: 'Habitacion',
        checkIn: 'Fecha de ingreso',
        checkOut: 'Fecha de salida',
        guests: 'Huespedes',
        roomType: 'Tipo de habitacion',
        paymentMethod: 'Metodo de pago',
        pricePerNight: 'Precio por noche',
        nightsLabel: 'noches',
        earlyBirdDiscount: 'Descuento anticipado',
        taxesFees: 'Impuestos',
        secureBooking: 'Reserva segura',
        sslPayment: 'Pago cifrado SSL',
        freeCancellation: 'Cancelacion gratis',
        support247: 'Soporte 24/7',
        total: 'Total estimado',
        submit: 'Continuar al pago',
        submitting: 'Creando reserva...',
        goBack: 'Volver al hotel',
        missingHotelId: 'Falta el identificador del hotel para iniciar la reserva.',
        noRoomsAvailable: 'No hay habitaciones disponibles para este hotel.',
        loadError: 'No fue posible cargar la informacion de la reserva.',
        invalidEmail: 'Por favor ingresa un correo electronico valido.',
        successPrefix: 'Reserva creada exitosamente. ID:',
        bookingConfirmed: '¡Reserva Confirmada!',
        bookingConfirmedSub: 'Tu reserva ha sido procesada exitosamente.',
        bookingId: 'ID de Reserva',
        guestName: 'Nombre del huesped',
        phone: 'Telefono',
        paymentSummary: 'Resumen de pago',
        totalPaid: 'Total pagado',
        confirmationEmailSent: 'Correo de confirmacion enviado',
        confirmationEmailBody: 'Hemos enviado los detalles de tu reserva a',
        manageBooking: 'Gestionar reserva',
        backToHome: 'Volver al inicio',
        downloadPdf: 'Descargar PDF',
        paidWith: 'Pagado con',
        whatsNext: '¿Qué sigue?',
        preArrivalTitle: 'Información previa a la llegada',
        preArrivalDesc:
          'Recibirás un recordatorio 24 horas antes del check-in con detalles importantes.',
        mobileCheckinTitle: 'Check-in móvil',
        mobileCheckinDesc:
          'Descarga nuestra app para un check-in más rápido y acceso a la llave virtual.',
        support247Desc:
          '¿Necesitas cambios? Nuestro equipo de soporte está disponible en cualquier momento.',
        bestPriceGuarantee: 'Mejor precio garantizado',
        confirmationEmailInbox: 'Revisa tu bandeja de entrada (y carpeta de spam por si acaso).',
      },
      pt: {
        title: 'Conclua sua reserva',
        subtitle: 'Revise os dados antes de confirmar sua reserva.',
        reservationHoldText: 'Sua reserva esta retida por',
        reservationHoldHint: 'Conclua sua reserva para garantir este preco',
        guestInfo: 'Informacoes do hospede',
        primaryGuest: 'Hospede principal',
        contactInfo: 'Informacoes de contato',
        specialRequests: 'Solicitacoes especiais',
        arrivalTime: 'Horario de chegada',
        bookingSummary: 'Resumo da reserva',
        hotel: 'Hotel',
        room: 'Quarto',
        checkIn: 'Data de check-in',
        checkOut: 'Data de check-out',
        guests: 'Hospedes',
        roomType: 'Tipo de quarto',
        paymentMethod: 'Metodo de pagamento',
        pricePerNight: 'Preco por noite',
        nightsLabel: 'noites',
        earlyBirdDiscount: 'Desconto antecipado',
        taxesFees: 'Impostos',
        secureBooking: 'Reserva segura',
        sslPayment: 'Pagamento SSL criptografado',
        freeCancellation: 'Cancelamento gratis',
        support247: 'Suporte 24/7',
        total: 'Total estimado',
        submit: 'Continuar para pagamento',
        submitting: 'Criando reserva...',
        goBack: 'Voltar ao hotel',
        missingHotelId: 'Falta o identificador do hotel para iniciar a reserva.',
        noRoomsAvailable: 'Nao ha quartos disponiveis para este hotel.',
        loadError: 'Nao foi possivel carregar os dados da reserva.',
        invalidEmail: 'Por favor, informe um e-mail valido.',
        successPrefix: 'Reserva criada com sucesso. ID:',
        bookingConfirmed: 'Reserva Confirmada!',
        bookingConfirmedSub: 'Sua reserva foi processada com sucesso.',
        bookingId: 'ID da Reserva',
        guestName: 'Nome do hospede',
        phone: 'Telefone',
        paymentSummary: 'Resumo do pagamento',
        totalPaid: 'Total pago',
        confirmationEmailSent: 'E-mail de confirmacao enviado',
        confirmationEmailBody: 'Enviamos os detalhes da sua reserva para',
        manageBooking: 'Gerenciar reserva',
        backToHome: 'Voltar ao inicio',
        downloadPdf: 'Baixar PDF',
        paidWith: 'Pago com',
        whatsNext: 'O que vem a seguir?',
        preArrivalTitle: 'Informações pré-chegada',
        preArrivalDesc:
          'Você receberá um lembrete 24 horas antes do check-in com detalhes importantes.',
        mobileCheckinTitle: 'Check-in Mobile',
        mobileCheckinDesc:
          'Baixe nosso app para check-in mais rápido e acesso à chave digital do quarto.',
        support247Desc:
          'Precisa fazer alterações? Nossa equipe de suporte está disponível a qualquer momento.',
        bestPriceGuarantee: 'Melhor preço garantido',
        confirmationEmailInbox:
          'Verifique sua caixa de entrada (e pasta de spam, só por garantia).',
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

  protected getRoomLabel(room: HotelRoomResponse): string {
    return `${room.tipo} - #${room.nro_habitacion} (${room.capacidad})`;
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.getLocale(), {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(parsed);
  }

  protected goBackToHotel(): void {
    this.releaseCurrentHoldSilently();
    this.resetBookingState();

    const hotelId = this.reservationForm.controls.hotelId.value;
    void this.router.navigate(['/app/hoteles', hotelId], {
      queryParams: {
        fecha_ingreso: this.reservationForm.controls.fechaIngreso.value,
        fecha_salida: this.reservationForm.controls.fechaSalida.value,
        nro_personas: this.reservationForm.controls.nroPersonas.value,
      },
    });
  }

  protected goToHome(): void {
    void this.router.navigate(['/app/home-search']);
  }

  protected goToDashboard(): void {
    void this.router.navigate(['/app']);
  }

  protected paymentMethodLabel(): string {
    const method = this.reservationForm.controls.paymentMethod.value;
    if (method === 'pse') return 'PSE';
    if (method === 'transfer') return 'Bank Transfer';
    return 'Credit / Debit Card';
  }

  protected displayReservationId(): string {
    const reservation = this.createdReservation();
    const value = reservation?.id?.trim();
    return value || 'Pending ID';
  }

  protected submit(): void {
    if (this.reservationForm.invalid || this.submitting()) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser();
    const room = this.selectedRoom();
    const hotel = this.hotel();

    if (!user || !room || !hotel) {
      this.errorMessage.set(this.label('loadError'));
      return;
    }

    if (!this.hasActiveHold()) {
      this.errorMessage.set(
        'El tiempo de retencion expiro. Vuelve a seleccionar la habitacion para generar un nuevo hold.',
      );
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const fechaIngreso = this.reservationForm.controls.fechaIngreso.value;
    const fechaSalida = this.reservationForm.controls.fechaSalida.value;
    const firstName = this.reservationForm.controls.firstName.value;
    const lastName = this.reservationForm.controls.lastName.value;
    const idUsuario = String(user.id);

    this.reservationService
      .getCiudadById(hotel.id_ciudad)
      .pipe(
        switchMap((ciudad) =>
          this.reservationService.getEstados().pipe(
            switchMap((estados) => {
              const payload: CreateReservaPayload = {
                fecha_ingreso: this.toIsoDate(fechaIngreso),
                fecha_salida: this.toIsoDate(fechaSalida),
                total: this.grandTotal(),
                nro_personas: this.reservationForm.controls.nroPersonas.value,
                id_usuario: idUsuario,
                id_pais: ciudad.id_pais,
                id_habitacion: room.id,
                id_estado: this.resolveEstadoId(estados),
                payment_method: this.reservationForm.controls.paymentMethod.value,
              };

              return this.reservationService.createReserva(payload);
            }),
          ),
        ),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.clearHoldTimer();
          this.createdReservation.set(response);
          this.reservationService
            .createNotificacion({
              fecha_notif: new Date().toISOString(),
              titulo: `Reserva confirmada - ${hotel.nombre}`,
              id_reserva: response.id,
              descripcion: `Reserva de ${this.nights()} noches en ${hotel.nombre}. Huesped: ${firstName} ${lastName}.`,
            })
            .subscribe();
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.error || this.label('loadError'));
        },
      });
  }

  private resolveEstadoId(estados: EstadoResponse[]): string {
    const normalized = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const preferred = estados.find((estado) => {
      const name = normalized(estado.nombre || '');
      return (
        name.includes('confirmada') ||
        name.includes('reservada via pms') ||
        name.includes('reservado')
      );
    });

    if (preferred) {
      return preferred.id;
    }

    return estados[0]?.id || '';
  }

  private toIsoDate(value: string): string {
    return `${value}T00:00:00`;
  }

  private buildSearchPayload(
    destination: string,
    checkInDate: string,
    checkOutDate: string,
    guests: number,
  ): SearchAvailableHotelsRequest | null {
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
    response: SearchAvailableHotelsResponse | null,
  ): HotelRoomResponse[] {
    if (!response) {
      return rooms;
    }

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

  private acquireInitialHold(): void {
    const user = this.authService.currentUser();
    const room = this.selectedRoom();
    const fechaIngreso = this.reservationForm.controls.fechaIngreso.value;
    const fechaSalida = this.reservationForm.controls.fechaSalida.value;

    if (!user || !room || !fechaIngreso || !fechaSalida) {
      return;
    }

    this.reservationService
      .acquireRoomHold(room.id, {
        id_usuario: String(user.id),
        fecha_ingreso: this.toIsoDate(fechaIngreso),
        fecha_salida: this.toIsoDate(fechaSalida),
      })
      .subscribe({
        next: (hold: RoomHoldResponse) => {
          const expiresAt = this.parseBackendDateAsUtc(hold.expires_at);
          if (Number.isNaN(expiresAt.getTime())) {
            return;
          }

          this.currentHoldId.set(hold.id);
          this.holdExpiresAt.set(expiresAt);
          this.startHoldTimer();
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.error || this.label('loadError'));
        },
      });
  }

  private startHoldTimer(): void {
    this.clearHoldTimer();

    const refresh = () => {
      const expiresAt = this.holdExpiresAt();
      if (!expiresAt) {
        this.remainingHoldSeconds.set(0);
        return;
      }

      const diffSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      this.remainingHoldSeconds.set(diffSeconds > 0 ? diffSeconds : 0);

      if (diffSeconds <= 0) {
        this.clearHoldTimer();
        this.handleHoldExpired();
      }
    };

    refresh();
    this.holdTimerId = setInterval(refresh, 1000);
  }

  private clearHoldTimer(): void {
    if (this.holdTimerId) {
      clearInterval(this.holdTimerId);
      this.holdTimerId = null;
    }
  }

  private releaseCurrentHoldSilently(): void {
    const holdId = this.currentHoldId();
    if (!holdId) {
      return;
    }

    this.reservationService.releaseHold(holdId).subscribe({
      next: () => {
        this.currentHoldId.set(null);
      },
      error: () => {
        this.currentHoldId.set(null);
      },
    });
  }

  private resetBookingState(): void {
    this.clearHoldTimer();
    this.holdExpiresAt.set(null);
    this.remainingHoldSeconds.set(0);
    this.currentHoldId.set(null);
    this.reservationForm.patchValue({
      firstName: '',
      lastName: '',
      email: '',
      phonePrefix: '+57',
      phone: '',
      specialRequests: '',
      arrivalTime: 'unknown',
    });
  }

  private handleHoldExpired(): void {
    if (this.hasNavigatedOnHoldExpiry) {
      return;
    }

    const hotelId = this.reservationForm.controls.hotelId.value;
    if (!hotelId) {
      return;
    }

    this.hasNavigatedOnHoldExpiry = true;
    this.errorMessage.set('Has excedido el tiempo maximo para completar la reserva.');
    this.releaseCurrentHoldSilently();
    this.resetBookingState();

    void this.router.navigate(['/app/hoteles', hotelId], {
      queryParams: {
        fecha_ingreso: this.reservationForm.controls.fechaIngreso.value,
        fecha_salida: this.reservationForm.controls.fechaSalida.value,
        nro_personas: this.reservationForm.controls.nroPersonas.value,
        hold_expired: '1',
      },
      replaceUrl: true,
    });
  }

  private parseBackendDateAsUtc(value: string): Date {
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
    const normalized = hasTimezone ? value : `${value}Z`;
    return new Date(normalized);
  }
}
