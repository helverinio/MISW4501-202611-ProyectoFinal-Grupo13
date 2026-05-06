import { Routes } from '@angular/router';

import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
import { VerifyEmailPageComponent } from './features/auth/pages/verify-email-page/verify-email-page.component';
import { HomePageComponent } from './features/home/pages/home-page/home-page.component';
import { HomeSearchPageComponent } from './features/home-search/pages/home-search-page/home-search-page.component';
import { SearchResultsPageComponent } from './features/search-results/pages/search-results-page/search-results-page.component';
import { HotelDetailsPageComponent } from './features/search-results/pages/hotel-details-page/hotel-details-page.component';
import { ReservationFormPageComponent } from './features/search-results/pages/reservation-form-page/reservation-form-page.component';
import { DashboardPageComponent } from './features/private/pages/dashboard-page/dashboard-page.component';
import { MyReservationsPageComponent } from './features/private/pages/my-reservations-page/my-reservations-page.component';
import { CancelReservationPageComponent } from './features/private/pages/cancel-reservation-page/cancel-reservation-page.component';
import { authGuard } from './core/guards/auth.guard';
import { publicOnlyGuard } from './core/guards/public-only.guard';
import { AuthenticatedLayoutComponent } from './layouts/authenticated-layout/authenticated-layout.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        component: HomePageComponent,
      },
      {
        path: 'login',
        component: LoginPageComponent,
        canActivate: [publicOnlyGuard],
      },
      {
        path: 'verify-email',
        component: VerifyEmailPageComponent,
      },
    ],
  },
  {
    path: 'home-search',
    redirectTo: 'app/home-search',
    pathMatch: 'full',
  },
  {
    path: 'app',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'home-search',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: DashboardPageComponent,
      },
      {
        path: 'home-search',
        component: HomeSearchPageComponent,
      },
      {
        path: 'search-results',
        component: SearchResultsPageComponent,
      },
      {
        path: 'hoteles/:hotelId',
        component: HotelDetailsPageComponent,
      },
      {
        path: 'reservas/nueva',
        component: ReservationFormPageComponent,
      },
      {
        path: 'mis-reservas',
        component: MyReservationsPageComponent,
      },
      {
        path: 'cancelar-reserva',
        component: CancelReservationPageComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
