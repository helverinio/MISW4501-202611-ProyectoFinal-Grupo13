import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PrivateHeaderComponent } from '../../shared/components/private-header/private-header.component';

@Component({
  selector: 'app-authenticated-layout',
  imports: [RouterOutlet, PrivateHeaderComponent],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.scss',
})
export class AuthenticatedLayoutComponent {}
