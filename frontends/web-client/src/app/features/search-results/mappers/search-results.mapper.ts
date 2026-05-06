import {
  AvailableHotelApi,
  HotelResultVm,
  SearchAvailableHotelsResponse,
  SearchCriteriaVm,
} from '../models/search-results.models';

const PLACEHOLDER_IMAGES = [
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/a92f3d7c4f-1e0ee6b02919a514b9a7.png',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/4e6f48b055-69f26aafd8c0769cf47f.png',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/b93f2dc3c3-e6d426362ae13b17a8c0.png',
  'https://storage.googleapis.com/uxpilot-auth.appspot.com/09598f766b-a7b9997fb70de1ae6f16.png',
];

function seededNumber(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function parseAmenities(rawAmenities: string | null): string[] {
  if (!rawAmenities) {
    return ['Free WiFi'];
  }

  const values = rawAmenities
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length ? values : ['Free WiFi'];
}

function calculateNights(checkInDate: string, checkOutDate: string): number {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 1;
}

function mapHotelToVm(hotel: AvailableHotelApi): HotelResultVm {
  const seed = seededNumber(hotel.hotel_id);
  const imageIndex = seed % PLACEHOLDER_IMAGES.length;
  const reviewsCount = hotel.cantidad_ratings || 0;
  const rating = Number((reviewsCount > 0 ? hotel.rating_promedio || 0 : 5).toFixed(1));
  const cheapestRoom = [...hotel.habitaciones].sort(
    (a, b) => a.precio_promedio_noche - b.precio_promedio_noche,
  )[0];
  const pricePerNight = cheapestRoom?.precio_promedio_noche ?? 0;
  const totalPrice = cheapestRoom?.precio_total_reserva ?? 0;
  const freeCancellation = seed % 3 !== 0;
  const distance = (0.3 + (seed % 60) / 10).toFixed(1);

  return {
    id: hotel.hotel_id,
    name: hotel.nombre,
    description: hotel.descripcion || '',
    city: hotel.ciudad || '',
    country: hotel.pais || '',
    locationText: `${hotel.ciudad || ''}, ${distance} km`,
    rating,
    reviewsCount,
    amenities: parseAmenities(hotel.amenidades),
    freeCancellation,
    cancellationText: freeCancellation ? 'free' : 'non-refundable',
    pricePerNight,
    totalPrice,
    currency: cheapestRoom?.moneda || 'USD',
    imageUrl: PLACEHOLDER_IMAGES[imageIndex],
    imageAlt: `${hotel.nombre} hotel`,
    availableRooms: hotel.total_habitaciones_disponibles,
  };
}

export function mapResponseToCriteria(response: SearchAvailableHotelsResponse): SearchCriteriaVm {
  const nights = calculateNights(response.fecha_ingreso, response.fecha_salida);

  return {
    destination: response.busqueda,
    checkInDate: response.fecha_ingreso,
    checkOutDate: response.fecha_salida,
    guests: response.nro_personas,
    nights,
  };
}

export function mapResponseToHotels(response: SearchAvailableHotelsResponse): HotelResultVm[] {
  return response.hoteles.map((hotel) => mapHotelToVm(hotel));
}
