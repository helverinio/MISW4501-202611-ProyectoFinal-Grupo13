import { Routes } from '@angular/router';

import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
import { HomePageComponent } from './features/home/pages/home-page/home-page.component';
import { HomeSearchPageComponent } from './features/home-search/pages/home-search-page/home-search-page.component';
import { DashboardPageComponent } from './features/private/pages/dashboard-page/dashboard-page.component';
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
        component: DashboardPageComponent,
      },
      {
        path: 'home-search',
        component: HomeSearchPageComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
