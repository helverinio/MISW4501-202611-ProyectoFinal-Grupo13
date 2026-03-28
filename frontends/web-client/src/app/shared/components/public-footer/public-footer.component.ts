import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-public-footer',
  templateUrl: './public-footer.component.html',
  styleUrl: './public-footer.component.scss',
})
export class PublicFooterComponent {
  private readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key as any);
  }
}
