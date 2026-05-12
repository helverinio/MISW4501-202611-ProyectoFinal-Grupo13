import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, catchError, filter, finalize, forkJoin, of, takeUntil } from 'rxjs';

import {
  ReservationDashboardResponse,
  ReservationItem,
  ReservationStats,
} from '../../../../core/models/reservations.models';
import { RevenueDailyRow, RevenueReportSummary } from '../../../../core/models/revenue-reports.models';
import { AuthService } from '../../../../core/services/auth.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { ReservationsService } from '../../../../core/services/reservations.service';
import { RevenueReportsService } from '../../../../core/services/revenue-reports.service';
import { LanguageCode } from '../../../../core/i18n/translations';
import { AdminFooterComponent } from '../../../../shared/components/admin-footer/admin-footer.component';

declare const Plotly:
  | {
      newPlot: (
        element: HTMLElement,
        data: unknown[],
        layout: Record<string, unknown>,
        config: Record<string, unknown>,
      ) => void;
    }
  | undefined;

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminFooterComponent],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedPeriod: 'last7' | 'last30' | 'last90' | 'thisYear' = 'last30';
  loading = false;
  errorMessage: string | null = null;
  stats: ReservationStats = {
    total: 0,
    confirmadas: 0,
    pendientes: 0,
    canceladas: 0,
    rechazadas: 0,
    completadas: 0,
  };
  revenueSummary: RevenueReportSummary = {
    total_bookings: 0,
    gross_revenue: 0,
    travelhub_commission: 0,
    net_revenue: 0,
  };
  totalReservations = 0;
  commissionPercentage = 0;
  occupancyRate = 0;
  confirmedRate = 0;
  completedRate = 0;
  recentReservations: Array<{
    guestName: string;
    guestEmail: string;
    avatar: string;
    property: string;
    room: string;
    checkIn: string;
    checkOut: string;
    amount: string;
    status: string;
    statusClass: string;
    statusIcon: string;
  }> = [];
  private revenueRows: RevenueDailyRow[] = [];
  private viewInitialized = false;
  private requestSequence = 0;
  private readonly destroy$ = new Subject<void>();
  private lastSuccessfulDashboardPeriod: 'last7' | 'last30' | 'last90' | 'thisYear' | null = null;
  private lastSuccessfulRevenuePeriod: 'last7' | 'last30' | 'last90' | 'thisYear' | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly reservationsService: ReservationsService,
    private readonly revenueReportsService: RevenueReportsService,
    readonly i18n: I18nService,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  onPeriodChange(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.renderRevenueChart();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  viewAllReservations(): void {
    void this.router.navigate(['/reservations']);
  }

  private loadDashboardData(): void {
    const requestedPeriod = this.selectedPeriod;
    const { fechaDesde, fechaHasta } = this.getDateRange(this.selectedPeriod);
    const currentRequest = ++this.requestSequence;
    this.loading = true;
    this.errorMessage = null;

    forkJoin({
      dashboard: this.reservationsService
        .getDashboard({
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
          page: 1,
          per_page: 5,
        })
        .pipe(catchError(() => of<ReservationDashboardResponse | null>(null))),
      revenue: this.revenueReportsService
        .getRevenueReport({
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
        })
        .pipe(catchError(() => of(null))),
    })
      .pipe(
        finalize(() => {
          if (currentRequest === this.requestSequence) {
            this.ngZone.run(() => {
              this.loading = false;
              this.cdr.detectChanges();
            });
          }
        }),
      )
      .subscribe({
        next: ({ dashboard, revenue }) => {
          if (currentRequest !== this.requestSequence) {
            return;
          }
          this.ngZone.run(() => {
            const hadDashboardData =
              this.lastSuccessfulDashboardPeriod === requestedPeriod &&
              (this.stats.total > 0 || this.recentReservations.length > 0);
            const hadRevenueData =
              this.lastSuccessfulRevenuePeriod === requestedPeriod &&
              (this.revenueSummary.gross_revenue > 0 || this.revenueRows.length > 0);

            if (dashboard) {
              this.bindDashboardResponse(dashboard);
              this.lastSuccessfulDashboardPeriod = requestedPeriod;
            } else if (!hadDashboardData) {
              this.stats = {
                total: 0,
                confirmadas: 0,
                pendientes: 0,
                canceladas: 0,
                rechazadas: 0,
                completadas: 0,
              };
              this.totalReservations = 0;
              this.occupancyRate = 0;
              this.confirmedRate = 0;
              this.completedRate = 0;
              this.recentReservations = [];
            }

            if (revenue) {
              this.revenueSummary = revenue.summary;
              this.commissionPercentage = revenue.commission_percentage;
              this.revenueRows = revenue.daily_rows;
              this.lastSuccessfulRevenuePeriod = requestedPeriod;
            } else if (!hadRevenueData) {
              this.revenueSummary = {
                total_bookings: 0,
                gross_revenue: 0,
                travelhub_commission: 0,
                net_revenue: 0,
              };
              this.commissionPercentage = 0;
              this.revenueRows = [];
            }

            if (!dashboard && !revenue) {
              this.errorMessage = 'Unable to load dashboard data right now.';
            } else if (!dashboard) {
              this.errorMessage = 'Reservations data is temporarily unavailable.';
            } else if (!revenue) {
              this.errorMessage = 'Revenue data is temporarily unavailable.';
            } else {
              this.errorMessage = null;
            }

            this.renderRevenueChart();
            this.cdr.detectChanges();
          });
        },
        error: () => {
          if (currentRequest !== this.requestSequence) {
            return;
          }
          this.ngZone.run(() => {
            this.errorMessage = 'Unable to load dashboard data right now.';
            this.renderRevenueChart();
            this.cdr.detectChanges();
          });
        },
      });
  }

  private bindDashboardResponse(response: ReservationDashboardResponse): void {
    this.stats = response.stats;
    this.totalReservations = response.total;
    this.occupancyRate = this.calculateRate(response.stats.confirmadas + response.stats.completadas, response.stats.total);
    this.confirmedRate = this.calculateRate(response.stats.confirmadas, response.stats.total);
    this.completedRate = this.calculateRate(response.stats.completadas, response.stats.total);
    this.recentReservations = response.reservations.map((reservation, index) =>
      this.mapReservationForTable(reservation, index),
    );
  }

  private mapReservationForTable(reservation: ReservationItem, index: number) {
    return {
      guestName: `Guest ${reservation.id_corto}`,
      guestEmail: reservation.id_usuario,
      avatar: `https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-${(index % 8) + 1}.jpg`,
      property: reservation.hotel.nombre,
      room: `${reservation.habitacion.tipo} · #${reservation.habitacion.nro_habitacion}`,
      checkIn: this.formatDate(reservation.fecha_ingreso),
      checkOut: this.formatDate(reservation.fecha_salida),
      amount: this.formatCurrency(reservation.total),
      status: reservation.estado.nombre,
      statusClass: this.getStatusClass(reservation.estado.nombre),
      statusIcon: this.getStatusIcon(reservation.estado.nombre),
    };
  }

  private renderRevenueChart(): void {
    const chartElement = document.getElementById('revenue-chart');
    if (!chartElement) {
      return;
    }

    if (typeof Plotly === 'undefined') {
      chartElement.innerHTML =
        '<div class="flex items-center justify-center h-full text-gray-500"><p>Unable to load chart</p></div>';
      return;
    }

    try {
      const xAxis = this.revenueRows.map((row) => row.date.slice(-2));
      const yAxis = this.revenueRows.map((row) => row.gross_revenue);

      Plotly.newPlot(
        chartElement,
        [
          {
            type: 'scatter',
            mode: 'lines',
            x: xAxis,
            y: yAxis,
            fill: 'tozeroy',
            line: {
              color: '#3b82f6',
              width: 3,
            },
            fillcolor: 'rgba(59, 130, 246, 0.1)',
          },
        ],
        {
          title: { text: '', font: { size: 16 } },
          xaxis: { title: '', showgrid: false },
          yaxis: { title: 'Revenue ($)', showgrid: true, gridcolor: '#f3f4f6' },
          margin: { t: 20, r: 20, b: 60, l: 80 },
          plot_bgcolor: '#ffffff',
          paper_bgcolor: '#ffffff',
          showlegend: false,
          hovermode: 'x unified',
        },
        {
          responsive: true,
          displayModeBar: false,
          displaylogo: false,
        },
      );
    } catch {
      chartElement.innerHTML =
        '<div class="flex items-center justify-center h-full text-gray-500"><p>Unable to load chart</p></div>';
    }
  }

  private calculateRate(part: number, total: number): number {
    if (!total) {
      return 0;
    }
    return (part / total) * 100;
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }
    // Support both YYYY-MM-DD and full ISO datetime values from backend.
    const parsedDate = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return '-';
    }

    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private getDateRange(period: 'last7' | 'last30' | 'last90' | 'thisYear'): {
    fechaDesde: string;
    fechaHasta: string;
  } {
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startDate = new Date(endDate);

    if (period === 'last7') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (period === 'last30') {
      startDate.setDate(endDate.getDate() - 30);
    } else if (period === 'last90') {
      startDate.setDate(endDate.getDate() - 90);
    } else {
      startDate.setMonth(0, 1);
    }

    return {
      fechaDesde: this.toIsoDate(startDate),
      fechaHasta: this.toIsoDate(endDate),
    };
  }

  private toIsoDate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getStatusClass(status: string): string {
    const normalized = this.normalizeStatus(status);
    if (normalized.includes('confirm')) {
      return 'bg-success-100 text-success-800';
    }
    if (normalized.includes('pend')) {
      return 'bg-orange-100 text-orange-800';
    }
    if (normalized.includes('cancel') || normalized.includes('rechaz')) {
      return 'bg-red-100 text-red-800';
    }
    if (normalized.includes('complet')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-700';
  }

  private getStatusIcon(status: string): string {
    const normalized = this.normalizeStatus(status);
    if (normalized.includes('confirm')) {
      return 'fa-check-circle';
    }
    if (normalized.includes('pend')) {
      return 'fa-clock';
    }
    if (normalized.includes('cancel') || normalized.includes('rechaz')) {
      return 'fa-times-circle';
    }
    if (normalized.includes('complet')) {
      return 'fa-check-double';
    }
    return 'fa-info-circle';
  }

  private normalizeStatus(status: string): string {
    return status
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  logout(): void {
    this.authService.clearSession();
    void this.router.navigate(['/login']);
  }
}
