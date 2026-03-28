import { Component, inject } from '@angular/core';
import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-home-features',
  templateUrl: './home-features.component.html',
  styleUrl: './home-features.component.scss',
})
export class HomeFeaturesComponent {
  private readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }
}
