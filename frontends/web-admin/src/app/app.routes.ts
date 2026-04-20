import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicOnlyGuard } from './core/guards/public-only.guard';
import { DashboardPageComponent } from './features/private/pages/dashboard-page/dashboard-page.component';
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
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
