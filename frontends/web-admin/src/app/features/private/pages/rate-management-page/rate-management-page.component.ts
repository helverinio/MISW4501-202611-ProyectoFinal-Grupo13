import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { RateManagementService } from '../../../../core/services/rate-management.service';
import {
  CreateHabitacionRequest,
  CreatePlanTarifarioRequest,
  CreateReglaRequest,
  CreateTipoHabitacionRequest,
  Habitacion,
  Hotel,
  PlanTarifario,
  ReglaTarifaria,
  TipoHabitacion,
} from '../../../../core/models/rate-management.models';

@Component({
  selector: 'app-rate-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './rate-management-page.component.html',
})
export class RateManagementPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly rateService = inject(RateManagementService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  // Hotel state
  readonly hotels = signal<Hotel[]>([]);
  readonly selectedHotelId = signal<string | null>(null);
  readonly loadingHotels = signal(false);

  // Room type state
  readonly tiposHabitacion = signal<TipoHabitacion[]>([]);
  readonly loadingTipos = signal(false);

  // Plans per tipo (keyed by tipo id)
  readonly planesMap = signal<Record<string, PlanTarifario[]>>({});
  readonly reglasMap = signal<Record<string, ReglaTarifaria[]>>({});
  readonly expandedTipoId = signal<string | null>(null);
  readonly expandedPlanId = signal<string | null>(null);

  // Cancellation policy selection per tipo (visual only, no backend)
  readonly cancellationPolicies = signal<Record<string, 'flexible' | 'moderate' | 'strict'>>({});

  // Modals
  readonly showAddTipoModal = signal(false);
  readonly showAddPlanModal = signal(false);
  readonly showAddReglaModal = signal(false);
  readonly addTipoForHotelId = signal<string | null>(null);
  readonly addPlanForTipoId = signal<string | null>(null);
  readonly addReglaForPlanId = signal<string | null>(null);

  // Edit state
  readonly editingRegla = signal<Record<string, Partial<CreateReglaRequest>>>({});

  // Habitaciones per tipo
  readonly habitacionesMap = signal<Record<string, Habitacion[]>>({});
  readonly showAddHabitacionModal = signal(false);
  readonly addHabitacionForTipoId = signal<string | null>(null);
  readonly editingHabitacion = signal<Record<string, Partial<CreateHabitacionRequest>>>({});
  newHabitacion: CreateHabitacionRequest = { nro_habitacion: 0, capacidad: 2, camas: 1 };
  newTipo: CreateTipoHabitacionRequest = { nombre: '', capacidad: 2, camas: 1 };
  // New plan form
  newPlan: CreatePlanTarifarioRequest = { nombre: '', moneda: 'USD' };
  // New regla form
  newRegla: CreateReglaRequest = { precio_base_noche: 0, min_noches: 1 };

  readonly saving = signal(false);
  readonly errorMsg = signal<string | null>(null);

  constructor() {}

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels(): void {
    this.loadingHotels.set(true);
    this.errorMsg.set(null);
    this.rateService.getMisHoteles().subscribe({
      next: (hotels) => {
        this.hotels.set(hotels);
        if (hotels.length > 0) {
          this.selectHotel(hotels[0].id);
        }
        this.loadingHotels.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load hotels. Please try again.');
        this.loadingHotels.set(false);
      },
    });
  }

  selectHotel(hotelId: string): void {
    this.selectedHotelId.set(hotelId);
    this.expandedTipoId.set(null);
    this.expandedPlanId.set(null);
    this.loadTipos(hotelId);
  }

  onHotelChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    if (id) {
      this.selectHotel(id);
    }
  }

  loadTipos(hotelId: string): void {
    this.loadingTipos.set(true);
    this.rateService.getTiposHabitacion(hotelId).subscribe({
      next: (tipos) => {
        this.tiposHabitacion.set(tipos);
        this.loadingTipos.set(false);
        tipos.forEach((t) => {
          if (!this.cancellationPolicies()[t.id]) {
            this.cancellationPolicies.update((prev) => ({ ...prev, [t.id]: 'flexible' }));
          }
        });
      },
      error: () => {
        this.loadingTipos.set(false);
      },
    });
  }

  toggleTipo(tipoId: string): void {
    if (this.expandedTipoId() === tipoId) {
      this.expandedTipoId.set(null);
      return;
    }
    this.expandedTipoId.set(tipoId);
    this.expandedPlanId.set(null);
    if (!this.planesMap()[tipoId]) {
      this.loadPlanes(tipoId);
    }
    if (!this.habitacionesMap()[tipoId]) {
      this.loadHabitaciones(tipoId);
    }
  }

  loadPlanes(tipoId: string): void {
    this.rateService.getPlanesForTipo(tipoId).subscribe({
      next: (planes) => {
        this.planesMap.update((prev) => ({ ...prev, [tipoId]: planes }));
      },
    });
  }

  togglePlan(planId: string, tipoId: string): void {
    if (this.expandedPlanId() === planId) {
      this.expandedPlanId.set(null);
      return;
    }
    this.expandedPlanId.set(planId);
    if (!this.reglasMap()[planId]) {
      this.loadReglas(planId, tipoId);
    }
  }

  loadReglas(planId: string, _tipoId: string): void {
    this.rateService.getReglas(planId).subscribe({
      next: (reglas) => {
        this.reglasMap.update((prev) => ({ ...prev, [planId]: reglas }));
      },
    });
  }

  loadHabitaciones(tipoId: string): void {
    this.rateService.getHabitacionesByTipo(tipoId).subscribe({
      next: (habs) => {
        this.habitacionesMap.update((prev) => ({ ...prev, [tipoId]: habs }));
      },
    });
  }

  getHabitacionesForTipo(tipoId: string): Habitacion[] {
    return this.habitacionesMap()[tipoId] ?? [];
  }

  setCancellationPolicy(tipoId: string, policy: 'flexible' | 'moderate' | 'strict'): void {
    this.cancellationPolicies.update((prev) => ({ ...prev, [tipoId]: policy }));
  }

  // ── Add tipo modal ──────────────────────────────────────────────────────────
  openAddTipoModal(): void {
    this.newTipo = { nombre: '', capacidad: 2, camas: 1 };
    this.showAddTipoModal.set(true);
  }

  submitAddTipo(): void {
    const hotelId = this.selectedHotelId();
    if (!hotelId || !this.newTipo.nombre) return;
    this.saving.set(true);
    this.rateService.createTipoHabitacion(hotelId, this.newTipo).subscribe({
      next: (tipo) => {
        this.tiposHabitacion.update((prev) => [...prev, tipo]);
        this.cancellationPolicies.update((prev) => ({ ...prev, [tipo.id]: 'flexible' }));
        this.showAddTipoModal.set(false);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  // ── Add habitacion modal ────────────────────────────────────────────────────
  openAddHabitacionModal(tipoId: string): void {
    const tipo = this.tiposHabitacion().find((t) => t.id === tipoId);
    this.newHabitacion = {
      nro_habitacion: 0,
      capacidad: tipo?.capacidad ?? 2,
      camas: tipo?.camas ?? 1,
    };
    this.addHabitacionForTipoId.set(tipoId);
    this.showAddHabitacionModal.set(true);
  }

  submitAddHabitacion(): void {
    const tipoId = this.addHabitacionForTipoId();
    const hotelId = this.selectedHotelId();
    if (!tipoId || !hotelId) return;
    if (!this.newHabitacion.nro_habitacion || this.newHabitacion.nro_habitacion <= 0) {
      this.errorMsg.set('El número de habitación debe ser mayor a 0.');
      return;
    }
    const tipo = this.tiposHabitacion().find((t) => t.id === tipoId);
    this.saving.set(true);
    this.rateService.createHabitacion(tipoId, hotelId, tipo?.nombre ?? '', this.newHabitacion).subscribe({
      next: (hab) => {
        this.habitacionesMap.update((prev) => ({
          ...prev,
          [tipoId]: [...(prev[tipoId] ?? []), hab],
        }));
        this.showAddHabitacionModal.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.error ?? 'Error al crear la habitación.');
        this.saving.set(false);
      },
    });
  }

  startEditHabitacion(hab: Habitacion): void {
    this.editingHabitacion.update((prev) => ({
      ...prev,
      [hab.id]: { nro_habitacion: hab.nro_habitacion, capacidad: hab.capacidad, camas: hab.camas },
    }));
  }

  cancelEditHabitacion(habId: string): void {
    this.editingHabitacion.update((prev) => {
      const copy = { ...prev };
      delete copy[habId];
      return copy;
    });
  }

  saveHabitacion(hab: Habitacion, tipoId: string): void {
    const changes = this.editingHabitacion()[hab.id];
    if (!changes) return;
    this.rateService.updateHabitacion(hab.id, changes).subscribe({
      next: (updated) => {
        this.habitacionesMap.update((prev) => ({
          ...prev,
          [tipoId]: prev[tipoId].map((h) => (h.id === updated.id ? updated : h)),
        }));
        this.cancelEditHabitacion(hab.id);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.error ?? 'Error al guardar la habitación.');
      },
    });
  }

  deleteHabitacion(hab: Habitacion, tipoId: string): void {
    this.rateService.deleteHabitacion(hab.id).subscribe({
      next: () => {
        this.habitacionesMap.update((prev) => ({
          ...prev,
          [tipoId]: prev[tipoId].filter((h) => h.id !== hab.id),
        }));
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.error ?? 'No se puede eliminar esta habitación.');
      },
    });
  }

  getEditingHabitacion(habId: string): Partial<CreateHabitacionRequest> | null {
    return this.editingHabitacion()[habId] ?? null;
  }

  // ── Add plan modal ──────────────────────────────────────────────────────────
  openAddPlanModal(tipoId: string): void {
    this.newPlan = { nombre: '', moneda: 'USD' };
    this.addPlanForTipoId.set(tipoId);
    this.showAddPlanModal.set(true);
  }

  submitAddPlan(): void {
    const tipoId = this.addPlanForTipoId();
    if (!tipoId || !this.newPlan.nombre) return;
    this.saving.set(true);
    this.rateService.createPlan(tipoId, this.newPlan).subscribe({
      next: (plan) => {
        this.planesMap.update((prev) => ({
          ...prev,
          [tipoId]: [...(prev[tipoId] ?? []), plan],
        }));
        this.showAddPlanModal.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.error ?? 'Error al crear el plan.');
        this.saving.set(false);
      },
    });
  }

  // ── Add regla modal ─────────────────────────────────────────────────────────
  openAddReglaModal(planId: string): void {
    this.newRegla = { precio_base_noche: 0, min_noches: 1 };
    this.addReglaForPlanId.set(planId);
    this.showAddReglaModal.set(true);
  }

  submitAddRegla(): void {
    const planId = this.addReglaForPlanId();
    if (!planId) return;
    if (!this.newRegla.precio_base_noche || this.newRegla.precio_base_noche <= 0) {
      this.errorMsg.set('El precio por noche debe ser mayor a 0.');
      return;
    }
    this.saving.set(true);
    this.rateService.createRegla(planId, this.newRegla).subscribe({
      next: (regla) => {
        this.reglasMap.update((prev) => ({
          ...prev,
          [planId]: [...(prev[planId] ?? []), regla],
        }));
        this.showAddReglaModal.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.error ?? 'Error al crear la regla.');
        this.saving.set(false);
      },
    });
  }

  // ── Inline regla editing ────────────────────────────────────────────────────
  startEditRegla(regla: ReglaTarifaria): void {
    this.editingRegla.update((prev) => ({
      ...prev,
      [regla.id]: { precio_base_noche: regla.precio_base_noche, min_noches: regla.min_noches ?? undefined },
    }));
  }

  saveRegla(regla: ReglaTarifaria, planId: string): void {
    const changes = this.editingRegla()[regla.id];
    if (!changes) return;
    if (changes['precio_base_noche'] !== undefined && Number(changes['precio_base_noche']) <= 0) {
      this.errorMsg.set('El precio por noche debe ser mayor a 0.');
      return;
    }
    this.rateService.updateRegla(regla.id, changes).subscribe({
      next: (updated) => {
        this.reglasMap.update((prev) => ({
          ...prev,
          [planId]: prev[planId].map((r) => (r.id === updated.id ? updated : r)),
        }));
        this.editingRegla.update((prev) => {
          const copy = { ...prev };
          delete copy[regla.id];
          return copy;
        });
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.error ?? 'Error al guardar la regla.');
      },
    });
  }

  cancelEditRegla(reglaId: string): void {
    this.editingRegla.update((prev) => {
      const copy = { ...prev };
      delete copy[reglaId];
      return copy;
    });
  }

  deactivateRegla(regla: ReglaTarifaria, planId: string): void {
    this.rateService.deleteRegla(regla.id).subscribe({
      next: () => {
        this.reglasMap.update((prev) => ({
          ...prev,
          [planId]: prev[planId].filter((r) => r.id !== regla.id),
        }));
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.error ?? 'No se puede eliminar esta regla.');
      },
    });
  }

  logout(): void {
    this.authService.clearSession();
    this.router.navigate(['/login']);
  }

  getSelectedHotel(): Hotel | undefined {
    return this.hotels().find((h) => h.id === this.selectedHotelId());
  }

  getPlanesForTipo(tipoId: string): PlanTarifario[] {
    return this.planesMap()[tipoId] ?? [];
  }

  getReglasForPlan(planId: string): ReglaTarifaria[] {
    return this.reglasMap()[planId] ?? [];
  }

  getEditingRegla(reglaId: string): Partial<CreateReglaRequest> | null {
    return this.editingRegla()[reglaId] ?? null;
  }
}
