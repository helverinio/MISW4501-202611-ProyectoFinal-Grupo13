import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

declare const Plotly:
  | {
      newPlot: (
        element: HTMLElement,
        data: unknown[],
        layout: Record<string, unknown>,
        config: Record<string, unknown>,
      ) => void;
    }
  | undefined;

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements AfterViewInit {
  readonly reservations = [
    {
      guestName: 'Sarah Johnson',
      guestEmail: 'sarah.j@email.com',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
      property: 'Grand Hotel Plaza',
      room: 'Deluxe Suite',
      checkIn: 'Jan 15, 2024',
      checkOut: 'Jan 18, 2024',
      amount: '$450',
      status: 'Confirmed',
      statusClass: 'bg-success-100 text-success-800',
      statusIcon: 'fa-check-circle',
    },
    {
      guestName: 'Michael Chen',
      guestEmail: 'm.chen@email.com',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      property: 'Sunset Beach Resort',
      room: 'Ocean View Room',
      checkIn: 'Jan 20, 2024',
      checkOut: 'Jan 25, 2024',
      amount: '$825',
      status: 'Pending',
      statusClass: 'bg-orange-100 text-orange-800',
      statusIcon: 'fa-clock',
    },
    {
      guestName: 'Emma Rodriguez',
      guestEmail: 'emma.r@email.com',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
      property: 'City Center Hotel',
      room: 'Standard Room',
      checkIn: 'Jan 12, 2024',
      checkOut: 'Jan 14, 2024',
      amount: '$280',
      status: 'Confirmed',
      statusClass: 'bg-success-100 text-success-800',
      statusIcon: 'fa-check-circle',
    },
    {
      guestName: 'James Wilson',
      guestEmail: 'j.wilson@email.com',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
      property: 'Mountain Lodge',
      room: 'Family Suite',
      checkIn: 'Jan 22, 2024',
      checkOut: 'Jan 28, 2024',
      amount: '$1,240',
      status: 'Confirmed',
      statusClass: 'bg-success-100 text-success-800',
      statusIcon: 'fa-check-circle',
    },
    {
      guestName: 'Lisa Anderson',
      guestEmail: 'l.anderson@email.com',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg',
      property: 'Boutique Inn',
      room: 'Premium Room',
      checkIn: 'Jan 18, 2024',
      checkOut: 'Jan 21, 2024',
      amount: '$565',
      status: 'Pending',
      statusClass: 'bg-orange-100 text-orange-800',
      statusIcon: 'fa-clock',
    },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  currentUser() {
    return this.authService.currentUser();
  }

  ngAfterViewInit(): void {
    const chartElement = document.getElementById('revenue-chart');
    if (!chartElement || typeof Plotly === 'undefined') {
      return;
    }

    try {
      Plotly.newPlot(
        chartElement,
        [
          {
            type: 'scatter',
            mode: 'lines',
            x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            y: [65000, 72000, 68000, 75000, 82000, 78000, 85000, 89000, 92000, 88000, 95000, 87420],
            fill: 'tozeroy',
            line: {
              color: '#3b82f6',
              width: 3,
            },
            fillcolor: 'rgba(59, 130, 246, 0.1)',
          },
        ],
        {
          title: { text: '', font: { size: 16 } },
          xaxis: { title: '', showgrid: false },
          yaxis: { title: 'Revenue ($)', showgrid: true, gridcolor: '#f3f4f6' },
          margin: { t: 20, r: 20, b: 60, l: 80 },
          plot_bgcolor: '#ffffff',
          paper_bgcolor: '#ffffff',
          showlegend: false,
          hovermode: 'x unified',
        },
        {
          responsive: true,
          displayModeBar: false,
          displaylogo: false,
        },
      );
    } catch {
      chartElement.innerHTML =
        '<div class="flex items-center justify-center h-full text-gray-500"><p>Unable to load chart</p></div>';
    }
  }

  logout(): void {
    this.authService.clearSession();
    void this.router.navigate(['/login']);
  }
}
