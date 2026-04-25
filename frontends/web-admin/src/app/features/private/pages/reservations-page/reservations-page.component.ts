import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { ReservationsService } from '../../../../core/services/reservations.service';
import {
  Estado,
  ReservationDashboardResponse,
  ReservationItem,
  ReservationStats,
} from '../../../../core/models/reservations.models';

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './reservations-page.component.html',
})
export class ReservationsPageComponent implements OnInit {
  filterForm: FormGroup;

  stats: ReservationStats = {
    total: 0,
    confirmadas: 0,
    pendientes: 0,
    canceladas: 0,
    rechazadas: 0,
    completadas: 0,
  };

  reservations: ReservationItem[] = [];
  estados: Estado[] = [];

  total = 0;
  page = 1;
  perPage = 25;
  pages = 0;

  loading = false;
  error: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly reservationsService: ReservationsService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.filterForm = this.fb.group({
      codigo: [''],
      fecha_desde: [''],
      fecha_hasta: [''],
      id_estado: [''],
      tipo_habitacion: [''],
      per_page: [25],
    });
  }

  ngOnInit(): void {
    this.reservationsService.getEstados().subscribe({
      next: (list) => (this.estados = list),
      error: (err: unknown) => console.warn('[Reservations] Could not load estados:', err),
    });
    this.loadDashboard();
  }

  currentUser() {
    return this.authService.currentUser();
  }

  loadDashboard(resetPage = false): void {
    if (resetPage) this.page = 1;
    this.loading = true;
    this.error = null;

    const f = this.filterForm.value;
    this.perPage = Number(f.per_page) || 25;

    console.log('[Reservations] loadDashboard called, loading=true');

    this.reservationsService
      .getDashboard({
        codigo: f.codigo || undefined,
        fecha_desde: f.fecha_desde || undefined,
        fecha_hasta: f.fecha_hasta || undefined,
        id_estado: f.id_estado || undefined,
        tipo_habitacion: f.tipo_habitacion || undefined,
        page: this.page,
        per_page: this.perPage,
      })
      .subscribe({
        next: (data: ReservationDashboardResponse) => {
          console.log('[Reservations] Dashboard next, total=', data?.total, 'reservations=', data?.reservations?.length);
          this.stats = data.stats ?? this.stats;
          this.reservations = data.reservations ?? [];
          this.total = data.total ?? 0;
          this.pages = data.pages ?? 0;
          this.page = data.page ?? 1;
          this.loading = false;
          console.log('[Reservations] loading set to false');
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('[Reservations] Dashboard load error:', err);
          this.error = 'No se pudo cargar el dashboard. Verifica tu conexión.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  applyFilters(): void {
    this.loadDashboard(true);
  }

  clearFilters(): void {
    this.filterForm.reset({ per_page: 25 });
    this.loadDashboard(true);
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pages || p === this.page) return;
    this.page = p;
    this.loadDashboard();
  }

  get pageNumbers(): number[] {
    const total = this.pages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    // Show first 3, current ± 1, last 1 when many pages
    const set = new Set([1, 2, 3, this.page - 1, this.page, this.page + 1, total]);
    return [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  }

  get showingFrom(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.perPage + 1;
  }

  get showingTo(): number {
    return Math.min(this.page * this.perPage, this.total);
  }

  statusClass(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n === 'confirmada') return 'bg-green-100 text-green-800';
    if (n === 'pendiente') return 'bg-orange-100 text-orange-800';
    if (n === 'cancelada') return 'bg-red-100 text-red-800';
    if (n === 'rechazada') return 'bg-red-100 text-red-800';
    if (n === 'completada') return 'bg-gray-100 text-gray-800';
    if (n === 'en proceso') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  }

  statusIcon(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n === 'confirmada') return 'fa-check-circle';
    if (n === 'pendiente') return 'fa-clock';
    if (n === 'cancelada' || n === 'rechazada') return 'fa-times-circle';
    if (n === 'completada') return 'fa-check-double';
    if (n === 'en proceso') return 'fa-spinner';
    return 'fa-circle';
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatCurrency(amount: number | null): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  logout(): void {
    this.authService.clearSession();
    void this.router.navigate(['/login']);
  }
}
