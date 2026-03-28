import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home-search-hero-search',
  imports: [FormsModule],
  templateUrl: './home-search-hero-search.component.html',
  styleUrl: './home-search-hero-search.component.scss',
})
export class HomeSearchHeroSearchComponent {
  protected destination = '';
  protected checkInDate = this.getDateOffset(1);
  protected checkOutDate = this.getDateOffset(7);
  protected guests = '1 Guest';

  protected readonly guestOptions: string[] = [
    '1 Guest',
    '2 Guests',
    '3 Guests',
    '4 Guests',
    '5+ Guests',
  ];

  protected onSearchHotels(): void {
    if (!this.destination.trim()) {
      return;
    }
  }

  private getDateOffset(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }
}
