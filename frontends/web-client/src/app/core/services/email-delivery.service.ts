import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

const EMAILJS_CANCELLATION_TEMPLATE_ID = 'template_8yp6uod';

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

export interface CancellationEmailPayload {
  toEmail: string;
  reservationId: string;
  guestName: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  totalRefunded: string;
  cancellationReason?: string;
}

@Injectable({ providedIn: 'root' })
export class EmailDeliveryService {
  constructor(private readonly http: HttpClient) {}

  private buildCancellationRequest(payload: CancellationEmailPayload) {
    const cancellationTemplateId = EMAILJS_CANCELLATION_TEMPLATE_ID;

    if (!cancellationTemplateId) {
      throw new Error('Cancellation email template is not configured.');
    }

    return {
      service_id: environment.emailJs.serviceId,
      template_id: cancellationTemplateId,
      user_id: environment.emailJs.publicKey,
      template_params: {
        to_email: payload.toEmail,
        email: payload.toEmail,
        order_id: payload.reservationId,
        reservation_id: payload.reservationId,
        guest_name: payload.guestName,
        hotel_name: payload.hotelName,
        check_in: payload.checkIn,
        check_out: payload.checkOut,
        total_refunded: payload.totalRefunded,
        cancellation_reason: payload.cancellationReason || 'No reason provided',
      },
    };
  }

  sendBookingConfirmation(payload: BookingConfirmationEmailPayload): Observable<string> {
    if (!environment.emailJs.enabled) {
      throw new Error('EmailJS is not configured.');
    }

    const requestBody = {
      service_id: environment.emailJs.serviceId,
      template_id: environment.emailJs.templateId,  // Confirmación template
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

  sendCancellationEmail(payload: CancellationEmailPayload): Observable<string> {
    if (!environment.emailJs.enabled) {
      throw new Error('EmailJS is not configured.');
    }

    const requestBody = this.buildCancellationRequest(payload);

    console.log('[EmailJS] Cancellation request', {
      service_id: requestBody.service_id,
      template_id: requestBody.template_id,
      to_email: requestBody.template_params.email,
      reservation_id: requestBody.template_params.reservation_id,
    });

    return this.http.post(environment.emailJs.endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'text',
    });
  }
}
