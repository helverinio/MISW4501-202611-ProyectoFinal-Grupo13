import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface BookingConfirmationEmailPayload {
  toEmail: string;
  bookingId: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  phone: string;
  guests: string;
  nights: string;
  totalPaid: string;
  paymentMethod: string;
}

@Injectable({ providedIn: 'root' })
export class EmailDeliveryService {
  constructor(private readonly http: HttpClient) {}

  sendBookingConfirmation(payload: BookingConfirmationEmailPayload): Observable<string> {
    if (!environment.emailJs.enabled) {
      throw new Error('EmailJS is not configured.');
    }

    const requestBody = {
      service_id: environment.emailJs.serviceId,
      template_id: environment.emailJs.templateId,
      user_id: environment.emailJs.publicKey,
      template_params: {
        to_email: payload.toEmail,
        email: payload.toEmail,
        booking_id: payload.bookingId,
        hotel_name: payload.hotelName,
        room_type: payload.roomType,
        check_in: payload.checkIn,
        check_out: payload.checkOut,
        guest_name: payload.guestName,
        guest_email: payload.guestEmail,
        phone: payload.phone,
        guests: payload.guests,
        nights: payload.nights,
        total_paid: payload.totalPaid,
        payment_method: payload.paymentMethod,
      },
    };

    return this.http.post(environment.emailJs.endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'text',
    });
  }
}
