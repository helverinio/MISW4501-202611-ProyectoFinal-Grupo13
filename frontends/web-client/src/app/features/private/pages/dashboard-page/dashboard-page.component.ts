import { Component, inject } from '@angular/core';
import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }
}
