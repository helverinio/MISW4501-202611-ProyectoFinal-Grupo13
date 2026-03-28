import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { BrandLogoComponent } from '../brand-logo/brand-logo.component';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink, RouterLinkActive, BrandLogoComponent],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
})
export class PublicHeaderComponent {}
