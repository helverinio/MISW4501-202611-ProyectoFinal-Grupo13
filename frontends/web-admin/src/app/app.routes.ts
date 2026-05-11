import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicOnlyGuard } from './core/guards/public-only.guard';
import { DashboardPageComponent } from './features/private/pages/dashboard-page/dashboard-page.component';
import { RateManagementPageComponent } from './features/private/pages/rate-management-page/rate-management-page.component';
import { RevenueReportsPageComponent } from './features/private/pages/revenue-reports-page/revenue-reports-page.component';
import { ReviewsPageComponent } from './features/private/pages/reviews-page/reviews-page.component';
import { ReservationDetailPageComponent } from './features/private/pages/reservation-detail-page/reservation-detail-page.component';
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
    path: 'revenue-reports',
    canActivate: [authGuard],
    component: RevenueReportsPageComponent,
  },
  {
    path: 'reviews',
    canActivate: [authGuard],
    component: ReviewsPageComponent,
  },
  {
    path: 'reservations',
    canActivate: [authGuard],
    component: ReservationsPageComponent,
  },
  {
    path: 'reservations/:id',
    canActivate: [authGuard],
    component: ReservationDetailPageComponent,
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
