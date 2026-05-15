import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import {
  RevenueDailyRow,
  RevenueReportResponse,
} from '../../../../core/models/revenue-reports.models';
import { Hotel } from '../../../../core/models/rate-management.models';
import { AdminTranslation, LanguageCode } from '../../../../core/i18n/translations';
import { AuthService } from '../../../../core/services/auth.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { RateManagementService } from '../../../../core/services/rate-management.service';
import { RevenueReportsService } from '../../../../core/services/revenue-reports.service';
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
  selector: 'app-revenue-reports-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminFooterComponent],
  templateUrl: './revenue-reports-page.component.html',
})
export class RevenueReportsPageComponent implements OnInit, AfterViewInit {
  readonly currentDate = new Date();
  readonly months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];
  readonly years = Array.from({ length: 5 }, (_, index) => this.currentDate.getFullYear() - index);

  selectedMonth = this.currentDate.getMonth() + 1;
  selectedYear = this.currentDate.getFullYear();
  selectedHotelId = 'all';
  hotels: Hotel[] = [];
  dailyRows: RevenueDailyRow[] = [];
  report: RevenueReportResponse | null = null;
  loadingHotels = false;
  loadingReport = false;
  reportError: string | null = null;
  private viewInitialized = false;
  private reportRequestSequence = 0;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly rateManagementService: RateManagementService,
    private readonly revenueReportsService: RevenueReportsService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
    readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.loadHotels();
    this.loadReport();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.renderCharts();
  }

  currentUser() {
    return this.authService.currentUser();
  }

  get currentLanguage() {
    return this.i18n.currentLanguage();
  }

  get summary() {
    return (
      this.report?.summary ?? {
        total_bookings: 0,
        gross_revenue: 0,
        travelhub_commission: 0,
        net_revenue: 0,
      }
    );
  }

  get commissionPercentage(): number {
    return this.report?.commission_percentage ?? 0;
  }

  get hasRevenue(): boolean {
    return this.dailyRows.some((row) => row.bookings_count > 0 || row.gross_revenue > 0);
  }

  /**
   * Base revenue extracted from gross: total / 1.15 (removes 10% taxes + 5% service fee).
   */
  get totalBaseRevenue(): number {
    return Math.round((this.summary.gross_revenue / 1.15) * 100) / 100;
  }

  /**
   * Total taxes (10%) extracted from gross revenue.
   */
  get totalTaxes(): number {
    return Math.round(this.totalBaseRevenue * 0.1 * 100) / 100;
  }

  /**
   * TravelHub commission (5%) extracted from gross revenue.
   */
  get totalCommission(): number {
    return Math.round(this.totalBaseRevenue * 0.05 * 100) / 100;
  }

  /**
   * Net revenue (hotel keeps) = base revenue extracted from gross.
   */
  get totalNetRevenue(): number {
    return this.totalBaseRevenue;
  }

  /**
   * Taxes (10%) extracted from a single daily row's gross revenue.
   */
  getTaxesForRow(row: RevenueDailyRow): number {
    return Math.round((row.gross_revenue / 1.15) * 0.1 * 100) / 100;
  }

  /**
   * TravelHub commission (5%) extracted from a single daily row's gross revenue.
   */
  getCommissionForRow(row: RevenueDailyRow): number {
    return Math.round((row.gross_revenue / 1.15) * 0.05 * 100) / 100;
  }

  /**
   * Net revenue (hotel keeps) for a single daily row.
   */
  getNetRevenueForRow(row: RevenueDailyRow): number {
    return Math.round((row.gross_revenue / 1.15) * 100) / 100;
  }

  t(key: keyof AdminTranslation): string {
    return this.i18n.t(key);
  }

  setLanguage(lang: LanguageCode): void {
    this.i18n.setLanguage(lang);
  }

  loadHotels(): void {
    this.loadingHotels = true;
    this.rateManagementService.getMisHoteles().subscribe({
      next: (hotels) => {
        this.hotels = hotels;
        this.loadingHotels = false;
      },
      error: () => {
        this.hotels = [];
        this.loadingHotels = false;
      },
    });
  }

  loadReport(): void {
    const requestSequence = ++this.reportRequestSequence;
    this.loadingReport = true;
    this.reportError = null;
    this.revenueReportsService
      .getRevenueReport({
        month: this.selectedMonth,
        year: this.selectedYear,
        hotel_id: this.selectedHotelId === 'all' ? undefined : this.selectedHotelId,
      })
      .pipe(
        finalize(() => {
          if (requestSequence === this.reportRequestSequence) {
            this.ngZone.run(() => {
              this.loadingReport = false;
              this.cdr.detectChanges();
            });
          }
        }),
      )
      .subscribe({
        next: (report) => {
          if (requestSequence !== this.reportRequestSequence) {
            return;
          }
          this.report = report;
          this.dailyRows = report.daily_rows;
          this.renderCharts();
        },
        error: () => {
          if (requestSequence !== this.reportRequestSequence) {
            return;
          }
          this.report = null;
          this.dailyRows = [];
          this.reportError = 'Unable to load the revenue report for the selected period.';
          this.renderCharts();
        },
      });
  }

  applyFilters(): void {
    this.loadReport();
  }

  resetFilters(): void {
    this.selectedMonth = this.currentDate.getMonth() + 1;
    this.selectedYear = this.currentDate.getFullYear();
    this.selectedHotelId = 'all';
    this.loadReport();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  formatDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  logout(): void {
    this.authService.clearSession();
    void this.router.navigate(['/login']);
  }

  private renderCharts(): void {
    if (!this.viewInitialized) {
      return;
    }

    this.renderMonthlyChart();
    this.renderPropertyChart();
    this.renderPaymentChart();
  }

  private renderMonthlyChart(): void {
    const chartElement = document.getElementById('monthly-revenue-chart');
    if (!chartElement || typeof Plotly === 'undefined') {
      return;
    }

    Plotly.newPlot(
      chartElement,
      [
        {
          type: 'scatter',
          mode: 'lines',
          x: this.dailyRows.map((row) => row.date.slice(-2)),
          y: this.dailyRows.map((row) => row.gross_revenue),
          line: { color: '#2563eb', width: 3 },
          fill: 'tozeroy',
          fillcolor: 'rgba(37, 99, 235, 0.1)',
          name: 'Gross revenue',
        },
      ],
      {
        title: { text: '', font: { size: 0 } },
        xaxis: { title: 'Day', showgrid: false },
        yaxis: { title: 'Gross revenue', tickprefix: '$' },
        margin: { t: 20, r: 20, b: 60, l: 70 },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        showlegend: false,
        hovermode: 'x unified',
      },
      { responsive: true, displayModeBar: false, displaylogo: false },
    );
  }

  private renderPropertyChart(): void {
    const chartElement = document.getElementById('property-revenue-chart');
    if (!chartElement || typeof Plotly === 'undefined') {
      return;
    }

    Plotly.newPlot(
      chartElement,
      [
        {
          type: 'bar',
          x: ['Gross', 'Commission', 'Net'],
          y: [
            this.summary.gross_revenue,
            this.summary.travelhub_commission,
            this.summary.net_revenue,
          ],
          marker: { color: ['#2563eb', '#f59e0b', '#10b981'] },
        },
      ],
      {
        title: { text: '', font: { size: 0 } },
        xaxis: { title: '' },
        yaxis: { title: 'Amount', tickprefix: '$' },
        margin: { t: 20, r: 20, b: 60, l: 70 },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        showlegend: false,
      },
      { responsive: true, displayModeBar: false, displaylogo: false },
    );
  }

  private renderPaymentChart(): void {
    const chartElement = document.getElementById('payment-status-chart');
    if (!chartElement || typeof Plotly === 'undefined') {
      return;
    }

    Plotly.newPlot(
      chartElement,
      [
        {
          type: 'pie',
          labels: ['Gross', 'Commission', 'Net'],
          values: [
            this.summary.gross_revenue,
            this.summary.travelhub_commission,
            this.summary.net_revenue,
          ],
          marker: { colors: ['#2563eb', '#f59e0b', '#10b981'] },
          hole: 0.4,
          textinfo: 'label+percent',
          textposition: 'outside',
        },
      ],
      {
        title: { text: '', font: { size: 0 } },
        margin: { t: 20, r: 20, b: 20, l: 20 },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        showlegend: true,
        legend: { orientation: 'h', y: -0.1 },
      },
      { responsive: true, displayModeBar: false, displaylogo: false },
    );
  }
}
