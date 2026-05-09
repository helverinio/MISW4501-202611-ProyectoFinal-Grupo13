import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';

import {
  Estado,
  ReservationDetailResponse,
  ReservationTimelineItem,
  ReservationPaymentItem,
} from '../../../../core/models/reservations.models';
import { UsuarioDetail } from '../../../../core/models/usuarios.models';
import { AuthService } from '../../../../core/services/auth.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { ReservationsService } from '../../../../core/services/reservations.service';
import { UsuariosService } from '../../../../core/services/usuarios.service';
import { LanguageCode } from '../../../../core/i18n/translations';

type ReservationAction = 'confirmada' | 'rechazada';

@Component({
  selector: 'app-reservation-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reservation-detail-page.component.html',
})
export class ReservationDetailPageComponent implements OnInit {
  reservationId = '';
  detail: ReservationDetailResponse | null = null;
  guestInfo: UsuarioDetail | null = null;
  loading = false;
  actionLoading = false;
  error: string | null = null;
  actionError: string | null = null;
  successMessage: string | null = null;


  confirmModalOpen = false;
  pendingAction: ReservationAction | null = null;
  reason = '';

  /**
   * Devuelve los pagos reales, o un pago virtual si el estado es 'pago recibido' o 'completada' y no hay pagos.
   */
  get paymentsToShow(): ReservationPaymentItem[] {
    if (!this.detail) return [];
    const pagos = this.detail.payments || [];
    const estado = (this.detail.estado?.nombre || '').toLowerCase();
    const isPaid = estado === 'pago recibido' || estado === 'completada';
    if (pagos.length > 0) return pagos;
    if (isPaid) {
      return [{
        id: 'virtual',
        fecha_pago: this.detail.created_at,
        total: this.getCalculatedTotal(),
        estado: 'completado',
      }];
    }
    return [];
  }

  private readonly localeByLanguage: Record<LanguageCode, string> = {
    en: 'en-US',
    es: 'es-ES',
    pt: 'pt-BR',
  };

  private estadoMap = new Map<string, Estado>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly reservationsService: ReservationsService,
    private readonly usuariosService: UsuariosService,
    private readonly cdr: ChangeDetectorRef,
    readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.reservationId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.reservationId) {
      this.error = this.t('reservationDetail.error.reservationIdRequired');
      return;
    }

    this.loading = false;
    this.loadDetail();
    this.loadEstados();
  }

  private loadGuestInfo(): void {
    if (!this.detail?.id_usuario) return;

    this.usuariosService
      .getUsuario(this.detail.id_usuario)
      .pipe(timeout(8000))
      .subscribe({
        next: (usuario) => {
          this.guestInfo = usuario;
          this.cdr.detectChanges();
        },
        error: () => {
          // Silently fail - use fallbacks in template
          this.guestInfo = null;
        },
      });
  }

  currentUser() {
    return this.authService.currentUser();
  }

  t(key: Parameters<I18nService['t']>[0]): string {
    return this.i18n.t(key);
  }

  get currentLanguage() {
    return this.i18n.currentLanguage();
  }

  setLanguage(lang: LanguageCode): void {
    this.i18n.setLanguage(lang);
  }

  private get activeLocale(): string {
    return this.localeByLanguage[this.currentLanguage] ?? 'es-ES';
  }

  get isPending(): boolean {
    return (this.detail?.estado?.nombre || '').toLowerCase() === 'pendiente';
  }

  get requiresReason(): boolean {
    return this.pendingAction === 'rechazada';
  }

  statusClass(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n === 'confirmada') return 'bg-green-100 text-green-800';
    if (n === 'pendiente') return 'bg-yellow-100 text-yellow-800';
    if (n === 'cancelada') return 'bg-red-100 text-red-800';
    if (n === 'rechazada') return 'bg-red-100 text-red-800';
    if (n === 'completada') return 'bg-gray-100 text-gray-800';
    if (n === 'en proceso') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  }

  timelineIconClass(item: ReservationTimelineItem): string {
    if (item.type === 'payment') return 'fas fa-credit-card';
    if (item.type === 'status_change') return 'fas fa-sync';
    return 'fas fa-plus';
  }

  timelineBadgeClass(item: ReservationTimelineItem): string {
    if (item.type === 'payment') return 'bg-success-600';
    if (item.type === 'status_change') return 'bg-primary-600';
    return 'bg-primary-600';
  }

  formatDate(iso: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString(this.activeLocale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatDateTime(iso: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString(this.activeLocale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat(this.activeLocale, { style: 'currency', currency: 'USD' }).format(
      amount,
    );
  }

  getPlaceholderPhone(): string {
    return '+57 (XXX) 123-4567';
  }

  getCalculatedTotal(): number {
    const subtotal = this.detail?.price_breakdown?.subtotal_noches ?? 0;
    const discount = this.detail?.price_breakdown?.discount ?? 0;
    const taxes = this.detail?.price_breakdown?.impuestos_estimados ?? 0;
    return subtotal - discount + taxes;
  }

  getTotalPaid(): number {
    const estado = (this.detail?.estado?.nombre || '').toLowerCase();
    const isPaid = estado === 'pago recibido' || estado === 'completada';
    return isPaid ? this.getCalculatedTotal() : 0;
  }

  getRemainingBalance(): number {
    const estado = (this.detail?.estado?.nombre || '').toLowerCase();
    const isPaid = estado === 'pago recibido' || estado === 'completada';
    return isPaid ? 0 : this.getCalculatedTotal();
  }

  getPaymentBackgroundClass(paymentEstado: string): string {
    const estado = (paymentEstado || '').toLowerCase();
    if (estado === 'completado' || estado === 'pagado' || estado === 'paid') return 'bg-success-50';
    if (estado === 'pendiente' || estado === 'pending') return 'bg-yellow-50';
    return 'bg-gray-50';
  }

  getPaymentAmountClass(paymentEstado: string): string {
    const estado = (paymentEstado || '').toLowerCase();
    if (estado === 'completado' || estado === 'pagado' || estado === 'paid') return 'text-success-600';
    if (estado === 'pendiente' || estado === 'pending') return 'text-yellow-600';
    return 'text-gray-600';
  }

  getPaymentBadgeClass(paymentEstado: string): string {
    const estado = (paymentEstado || '').toLowerCase();
    if (estado === 'completado' || estado === 'pagado' || estado === 'paid') return 'bg-success-100 text-success-800';
    if (estado === 'pendiente' || estado === 'pending') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }

  getPaymentBadgeIcon(paymentEstado: string): string {
    const estado = (paymentEstado || '').toLowerCase();
    if (estado === 'completado' || estado === 'pagado' || estado === 'paid') return 'fas fa-check-circle';
    if (estado === 'pendiente' || estado === 'pending') return 'fas fa-clock';
    return 'fas fa-info-circle';
  }

  getPaymentBadgeText(paymentEstado: string): string {
    const estado = (paymentEstado || '').toLowerCase();
    if (estado === 'completado' || estado === 'pagado' || estado === 'paid') return 'Paid';
    if (estado === 'pendiente' || estado === 'pending') return 'Pending';
    return estado;
  }

  goBack(): void {
    void this.router.navigate(['/reservations']);
  }

  logout(): void {
    this.authService.clearSession();
    void this.router.navigate(['/login']);
  }

  openConfirmAction(action: ReservationAction): void {
    this.pendingAction = action;
    this.reason = '';
    this.actionError = null;
    this.successMessage = null;
    this.confirmModalOpen = true;
  }

  closeModal(): void {
    this.confirmModalOpen = false;
    this.pendingAction = null;
    this.reason = '';
  }

  executeStateChange(): void {
    if (!this.detail || !this.pendingAction || this.actionLoading) return;

    const action = this.pendingAction;
    const targetEstado = Array.from(this.estadoMap.values()).find(
      (estado) => (estado.nombre || '').toLowerCase() === action,
    );

    if (!targetEstado) {
      this.actionError = this.t('reservationDetail.error.targetEstadoNotConfigured');
      return;
    }

    if (action === 'rechazada' && !this.reason.trim()) {
      this.actionError = this.t('reservationDetail.error.reasonRequired');
      return;
    }

    this.actionLoading = true;
    this.actionError = null;

    this.reservationsService
      .updateReservaEstado(this.detail.id, {
        id_estado: targetEstado.id,
        version: this.detail.version,
        reason: this.reason.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.successMessage =
            action === 'confirmada'
              ? this.t('reservationDetail.success.confirmed')
              : this.t('reservationDetail.success.rejected');
          this.actionLoading = false;
          this.closeModal();
          this.loadDetail();
        },
        error: (err: HttpErrorResponse) => {
          const apiError = (err.error?.error as string | undefined) || null;
          const apiCode = (err.error?.code as string | undefined) || null;
          if (apiCode === 'STALE_VERSION') {
            this.actionError = this.t('reservationDetail.error.staleVersion');
            this.loadDetail();
          } else {
            this.actionError = apiError || this.t('reservationDetail.error.couldNotUpdate');
          }
          this.actionLoading = false;
        },
      });
  }

  private loadEstados(): void {
    this.reservationsService
      .getEstados()
      .pipe(timeout(8000))
      .subscribe({
        next: (estados) => {
          this.estadoMap = new Map(estados.map((estado) => [estado.id, estado]));
        },
        error: () => {
          // Detail can be rendered without catalog; only confirm/reject action needs estados map.
          this.estadoMap = new Map();
        },
      });
  }

  private loadDetail(): void {
    if (!this.reservationId) return;

    this.error = null;

    this.reservationsService
      .getAdminReservaDetail(this.reservationId)
      .pipe(timeout(15000))
      .pipe(
        catchError((err: unknown) => {
          const httpErr = err as HttpErrorResponse;
          const apiError = (httpErr.error?.error as string | undefined) || null;
          this.error = apiError || this.t('reservationDetail.error.couldNotLoad');
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (detail) => {
          if (!detail) return;
          this.detail = this.normalizeDetail(detail);
          this.cdr.detectChanges();
          this.loadGuestInfo();
        },
      });
  }

  private normalizeDetail(detail: ReservationDetailResponse): ReservationDetailResponse {
    return {
      ...detail,
      id_corto: detail.id_corto || detail.id?.slice(0, 8).toUpperCase() || this.reservationId,
      nro_personas: detail.nro_personas ?? 0,
      total: detail.total ?? 0,
      version: detail.version ?? 1,
      habitacion: {
        id: detail.habitacion?.id || '',
        tipo: detail.habitacion?.tipo || 'No disponible',
        nro_habitacion: detail.habitacion?.nro_habitacion ?? 0,
        capacidad: detail.habitacion?.capacidad ?? 0,
        camas: detail.habitacion?.camas ?? 0,
      },
      hotel: {
        id: detail.hotel?.id || '',
        nombre: detail.hotel?.nombre || 'No disponible',
      },
      estado: {
        id: detail.estado?.id || '',
        nombre: detail.estado?.nombre || 'Sin estado',
      },
      payments: Array.isArray(detail.payments) ? detail.payments : [],
      timeline: Array.isArray(detail.timeline) ? detail.timeline : [],
      price_breakdown: {
        subtotal_noches: detail.price_breakdown?.subtotal_noches ?? 0,
        discount: 0,
        impuestos_estimados: ((detail.price_breakdown?.subtotal_noches ?? 0) * 0.1),
        total_pagado: detail.price_breakdown?.total_pagado ?? 0,
        balance_pendiente: detail.price_breakdown?.balance_pendiente ?? 0,
        detalle_noches: Array.isArray(detail.price_breakdown?.detalle_noches)
          ? detail.price_breakdown.detalle_noches
          : [],
      },
    };
  }
}
