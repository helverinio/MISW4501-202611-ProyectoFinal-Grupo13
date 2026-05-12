import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../core/services/i18n.service';
import { AdminTranslation } from '../../../core/i18n/translations';

@Component({
  selector: 'app-admin-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-footer.component.html',
  styleUrl: './admin-footer.component.scss',
})
export class AdminFooterComponent {
  constructor(readonly i18n: I18nService) {}

  t(key: keyof AdminTranslation): string {
    return this.i18n.t(key);
  }
}
