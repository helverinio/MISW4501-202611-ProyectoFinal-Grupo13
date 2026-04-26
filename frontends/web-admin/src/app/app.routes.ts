import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicOnlyGuard } from './core/guards/public-only.guard';
import { DashboardPageComponent } from './features/private/pages/dashboard-page/dashboard-page.component';
import { RateManagementPageComponent } from './features/private/pages/rate-management-page/rate-management-page.component';
import { ReservationsPageComponent } from './features/private/pages/reservations-page/reservations-page.component';
import { AdminSetupPageComponent } from './features/auth/pages/admin-setup-page/admin-setup-page.component';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicOnlyGuard],
    component: LoginPageComponent,
  },
  {
    path: 'setup-admin',
    component: AdminSetupPageComponent,
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    component: DashboardPageComponent,
  },
  {
    path: 'room-rate-management',
    canActivate: [authGuard],
    component: RateManagementPageComponent,
  },
  {
    path: 'reservations',
    canActivate: [authGuard],
    component: ReservationsPageComponent,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
