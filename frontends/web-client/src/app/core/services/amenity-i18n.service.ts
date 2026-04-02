import { Injectable } from '@angular/core';

import { LanguageCode } from '../i18n/translations';

@Injectable({
  providedIn: 'root',
})
export class AmenityI18nService {
  private readonly labels: Record<string, Record<LanguageCode, string>> = {
    free_wifi: {
      en: 'Free WiFi',
      es: 'WiFi gratis',
      pt: 'WiFi gratis',
    },
    swimming_pool: {
      en: 'Swimming Pool',
      es: 'Piscina',
      pt: 'Piscina',
    },
    spa: {
      en: 'Spa',
      es: 'Spa',
      pt: 'Spa',
    },
    restaurant: {
      en: 'Restaurant',
      es: 'Restaurante',
      pt: 'Restaurante',
    },
    gym: {
      en: 'Fitness Center',
      es: 'Gimnasio',
      pt: 'Academia',
    },
    free_breakfast: {
      en: 'Free Breakfast',
      es: 'Desayuno gratis',
      pt: 'Cafe da manha gratis',
    },
    free_parking: {
      en: 'Free Parking',
      es: 'Parqueadero gratis',
      pt: 'Estacionamento gratis',
    },
    valet_parking: {
      en: 'Valet Parking',
      es: 'Valet Parking',
      pt: 'Valet Parking',
    },
    rooftop_pool: {
      en: 'Rooftop Pool',
      es: 'Piscina en terraza',
      pt: 'Piscina na cobertura',
    },
    rooftop_bar: {
      en: 'Rooftop Bar',
      es: 'Bar en terraza',
      pt: 'Bar na cobertura',
    },
    business_center: {
      en: 'Business Center',
      es: 'Centro de negocios',
      pt: 'Centro de negocios',
    },
    beach_access: {
      en: 'Beach Access',
      es: 'Acceso a playa',
      pt: 'Acesso a praia',
    },
    concierge_24_7: {
      en: '24/7 Concierge',
      es: 'Conserjeria 24/7',
      pt: 'Concierge 24/7',
    },
  };

  private readonly aliases: Record<string, string> = {
    'wifi gratis': 'free_wifi',
    wifi: 'free_wifi',
    'free wifi': 'free_wifi',
    piscina: 'swimming_pool',
    'swimming pool': 'swimming_pool',
    pool: 'swimming_pool',
    spa: 'spa',
    restaurante: 'restaurant',
    restaurant: 'restaurant',
    gimnasio: 'gym',
    gym: 'gym',
    'fitness center': 'gym',
    'desayuno gratis': 'free_breakfast',
    'free breakfast': 'free_breakfast',
    'parqueadero gratis': 'free_parking',
    'free parking': 'free_parking',
    'valet parking': 'valet_parking',
    'rooftop pool': 'rooftop_pool',
    'rooftop bar': 'rooftop_bar',
    'business center': 'business_center',
    'acceso a playa': 'beach_access',
    '24/7 concierge': 'concierge_24_7',
  };

  translate(rawAmenity: string, lang: LanguageCode): string {
    const key = this.getCanonicalKey(rawAmenity);
    if (!key) {
      return rawAmenity;
    }

    return this.labels[key]?.[lang] || rawAmenity;
  }

  private getCanonicalKey(rawAmenity: string): string | null {
    const normalized = this.normalize(rawAmenity);

    if (this.aliases[normalized]) {
      return this.aliases[normalized];
    }

    return null;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
