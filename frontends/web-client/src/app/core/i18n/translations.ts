export type LanguageCode = 'en' | 'es' | 'pt';

export interface Translation {
  // Navigation & Layout
  'nav.backToHome': string;
  'nav.home': string;
  'nav.signIn': string;
  'nav.bookNow': string;
  'nav.dashboard': string;
  'nav.logout': string;
  'footer.description': string;
  'footer.company': string;
  'footer.about': string;
  'footer.aboutUs': string;
  'footer.careers': string;
  'footer.press': string;
  'footer.contact': string;
  'footer.support': string;
  'footer.helpCenter': string;
  'footer.privacy': string;
  'footer.termsOfService': string;
  'footer.privacyPolicy': string;
  'footer.trustAndSafety': string;
  'footer.copyright': string;

  // Home Page
  'home.hero.title': string;
  'home.hero.welcomeTo': string;
  'home.hero.subtitle': string;
  'home.hero.badge.secure': string;
  'home.hero.badge.secureDesc': string;
  'home.hero.badge.free': string;
  'home.hero.badge.freeDesc': string;
  'home.hero.badge.support': string;
  'home.hero.badge.supportDesc': string;
  'home.hero.cta': string;
  'home.hero.ctaHint': string;
  'home.features.title': string;
  'home.features.subtitle': string;
  'home.features.localExpertise': string;
  'home.features.localExpertiseDesc': string;
  'home.features.instantBooking': string;
  'home.features.instantBookingDesc': string;
  'home.features.bestRates': string;
  'home.features.bestRatesDesc': string;
  'home.features.mobileReady': string;
  'home.features.mobileReadyDesc': string;
  'home.destinations.title': string;
  'home.destinations.subtitle': string;

  // Home Search Page
  'homeSearch.nav.travelerHome': string;
  'homeSearch.nav.searchResults': string;
  'homeSearch.nav.myReservations': string;
  'homeSearch.nav.accountPreferences': string;
  'homeSearch.hero.title': string;
  'homeSearch.hero.subtitle': string;
  'homeSearch.hero.whereTo': string;
  'homeSearch.hero.wherePlaceholder': string;
  'homeSearch.hero.checkIn': string;
  'homeSearch.hero.checkOut': string;
  'homeSearch.hero.guests': string;
  'homeSearch.hero.searchHotels': string;
  'homeSearch.hero.guest1': string;
  'homeSearch.hero.guest2': string;
  'homeSearch.hero.guest3': string;
  'homeSearch.hero.guest4': string;
  'homeSearch.hero.guest5Plus': string;
  'homeSearch.hero.errorDestinationRequired': string;
  'homeSearch.hero.errorCheckInPast': string;
  'homeSearch.hero.errorCheckOutBeforeOrEqual': string;
  'homeSearch.popular.title': string;
  'homeSearch.popular.subtitle': string;
  'homeSearch.popular.price.mexico': string;
  'homeSearch.popular.price.argentina': string;
  'homeSearch.popular.price.brazil': string;
  'homeSearch.popular.price.peru': string;
  'homeSearch.popular.price.colombia': string;
  'homeSearch.popular.available.mexico': string;
  'homeSearch.popular.available.argentina': string;
  'homeSearch.popular.available.brazil': string;
  'homeSearch.popular.available.peru': string;
  'homeSearch.popular.available.colombia': string;
  'homeSearch.recent.title': string;
  'homeSearch.recent.viewAll': string;
  'homeSearch.recent.perNight': string;
  'homeSearch.recent.freeCancellation': string;
  'homeSearch.trust.title': string;
  'homeSearch.trust.subtitle': string;
  'homeSearch.trust.secureTitle': string;
  'homeSearch.trust.secureDesc': string;
  'homeSearch.trust.freeCancellationTitle': string;
  'homeSearch.trust.freeCancellationDesc': string;
  'homeSearch.trust.supportTitle': string;
  'homeSearch.trust.supportDesc': string;

  // Search Results Page
  'searchResults.summary.guests': string;
  'searchResults.summary.nights': string;
  'searchResults.summary.modifySearch': string;
  'searchResults.filters.title': string;
  'searchResults.filters.clearAll': string;
  'searchResults.filters.pricePerNight': string;
  'searchResults.filters.min': string;
  'searchResults.filters.max': string;
  'searchResults.filters.amenities': string;
  'searchResults.filters.guestRating': string;
  'searchResults.filters.rating45': string;
  'searchResults.filters.rating40': string;
  'searchResults.filters.rating35': string;
  'searchResults.filters.rating30': string;
  'searchResults.filters.freeCancellation': string;
  'searchResults.filters.showOnMap': string;
  'searchResults.amenity.freeWifi': string;
  'searchResults.amenity.swimmingPool': string;
  'searchResults.amenity.freeBreakfast': string;
  'searchResults.amenity.freeParking': string;
  'searchResults.amenity.fitnessCenter': string;
  'searchResults.amenity.petFriendly': string;
  'searchResults.resultsHeader.hotelsFound': string;
  'searchResults.resultsHeader.in': string;
  'searchResults.resultsHeader.sortBy': string;
  'searchResults.sort.popularity': string;
  'searchResults.sort.priceLowToHigh': string;
  'searchResults.sort.priceHighToLow': string;
  'searchResults.sort.guestRating': string;
  'searchResults.sort.distance': string;
  'searchResults.card.reviews': string;
  'searchResults.card.freeCancellation': string;
  'searchResults.card.nonRefundable': string;
  'searchResults.card.night': string;
  'searchResults.card.total': string;
  'searchResults.card.viewDetails': string;
  'searchResults.loadMore': string;
  'searchResults.states.loading': string;
  'searchResults.states.emptyTitle': string;
  'searchResults.states.emptyDescription': string;
  'searchResults.states.clearFilters': string;
  'searchResults.states.errorTitle': string;
  'searchResults.states.errorDescription': string;
  'searchResults.states.retry': string;
  'searchResults.validation.missingParams': string;

  // Login Page
  'login.title': string;
  'login.subtitle': string;
  'login.signIn': string;
  'login.createAccount': string;
  'login.welcome': string;
  'login.secure': string;
  'login.secureDesc': string;
  'login.users': string;
  'login.usersSubtitle': string;
  'login.form.email': string;
  'login.form.emailPlaceholder': string;
  'login.form.password': string;
  'login.form.passwordPlaceholder': string;
  'login.form.rememberMe': string;
  'login.form.forgotPassword': string;
  'login.form.signInButton': string;
  'login.form.signingIn': string;
  'login.form.errors.emailRequired': string;
  'login.form.errors.emailInvalid': string;
  'login.form.errors.passwordRequired': string;
  'login.form.errors.passwordMinLength': string;

  // Dashboard
  'dashboard.title': string;
  'dashboard.welcome': string;
  'dashboard.logout': string;
  'dashboard.myTrips': string;
  'dashboard.myTripsDesc': string;
  'dashboard.billing': string;
  'dashboard.billingDesc': string;
  'dashboard.support': string;
  'dashboard.supportDesc': string;

  // Auth Errors
  'auth.error.invalidCredentials': string;
  'auth.error.connectionError': string;
  'auth.error.unexpected': string;
}

export const translations: Record<LanguageCode, Translation> = {
  en: {
    // Navigation & Layout
    'nav.backToHome': 'Back to Home',
    'nav.home': 'Home',
    'nav.signIn': 'Sign in',
    'nav.bookNow': 'Book now',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',
    'footer.description':
      'Your trusted partner for hotel bookings across Latin America. Secure, simple, and reliable.',
    'footer.company': 'Company',
    'footer.about': 'About',
    'footer.aboutUs': 'About Us',
    'footer.careers': 'Careers',
    'footer.press': 'Press',
    'footer.contact': 'Contact',
    'footer.support': 'Support',
    'footer.helpCenter': 'Help Center',
    'footer.privacy': 'Privacy',
    'footer.termsOfService': 'Terms of Service',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.trustAndSafety': 'Trust & Safety',
    'footer.copyright': '© 2026 TravelHub. All rights reserved.',

    // Home Page
    'home.hero.title': 'Welcome to TravelHub',
    'home.hero.welcomeTo': 'Welcome to',
    'home.hero.subtitle':
      'Discover amazing hotels across Latin America with secure booking, free cancellation, and 24/7 support.',
    'home.hero.badge.secure': 'Secure Payment',
    'home.hero.badge.secureDesc':
      'Your payment information is protected with industry-leading security',
    'home.hero.badge.free': 'Free cancellation',
    'home.hero.badge.freeDesc':
      'Cancel or modify your booking without penalties on most properties',
    'home.hero.badge.support': '24/7 support',
    'home.hero.badge.supportDesc': 'Get help anytime with our dedicated customer support team',
    'home.hero.cta': "I'm a Traveler",
    'home.hero.ctaHint': 'Start exploring amazing destinations',
    'home.features.title': 'Why Choose TravelHub?',
    'home.features.subtitle':
      'Experience the best of Latin America with our carefully curated hotel selection and seamless booking process.',
    'home.features.localExpertise': 'Local expertise',
    'home.features.localExpertiseDesc':
      'Handpicked properties across Latin America with local insights',
    'home.features.instantBooking': 'Instant Booking',
    'home.features.instantBookingDesc': 'Quick and easy reservations in just a few clicks',
    'home.features.bestRates': 'Best Rates',
    'home.features.bestRatesDesc': 'Competitive prices with exclusive deals and discounts',
    'home.features.mobileReady': 'Mobile Ready',
    'home.features.mobileReadyDesc': 'Seamless experience across all your devices',
    'home.destinations.title': 'Popular Destinations',
    'home.destinations.subtitle': 'Discover the most sought-after locations across Latin America',

    // Home Search Page
    'homeSearch.nav.travelerHome': 'Traveler Home',
    'homeSearch.nav.searchResults': 'Search Results',
    'homeSearch.nav.myReservations': 'My Reservations',
    'homeSearch.nav.accountPreferences': 'Account & Preferences',
    'homeSearch.hero.title': 'Find your perfect getaway',
    'homeSearch.hero.subtitle':
      'Discover amazing hotels across Latin America with unbeatable prices and instant booking',
    'homeSearch.hero.whereTo': 'Where to?',
    'homeSearch.hero.wherePlaceholder': 'City or hotel name',
    'homeSearch.hero.checkIn': 'Check-in',
    'homeSearch.hero.checkOut': 'Check-out',
    'homeSearch.hero.guests': 'Guests',
    'homeSearch.hero.searchHotels': 'Search Hotels',
    'homeSearch.hero.guest1': '1 Guest',
    'homeSearch.hero.guest2': '2 Guests',
    'homeSearch.hero.guest3': '3 Guests',
    'homeSearch.hero.guest4': '4 Guests',
    'homeSearch.hero.guest5Plus': '5+ Guests',
    'homeSearch.hero.errorDestinationRequired': 'Please enter a destination (city or hotel).',
    'homeSearch.hero.errorCheckInPast': 'Check-in cannot be earlier than today.',
    'homeSearch.hero.errorCheckOutBeforeOrEqual': 'Check-out must be after check-in.',
    'homeSearch.popular.title': 'Popular Destinations',
    'homeSearch.popular.subtitle': 'Explore the most loved destinations across Latin America',
    'homeSearch.popular.price.mexico': 'From $45/night',
    'homeSearch.popular.price.argentina': 'From $38/night',
    'homeSearch.popular.price.brazil': 'From $52/night',
    'homeSearch.popular.price.peru': 'From $42/night',
    'homeSearch.popular.price.colombia': 'From $35/night',
    'homeSearch.popular.available.mexico': '347 hotels available',
    'homeSearch.popular.available.argentina': '289 hotels available',
    'homeSearch.popular.available.brazil': '412 hotels available',
    'homeSearch.popular.available.peru': '198 hotels available',
    'homeSearch.popular.available.colombia': '156 hotels available',
    'homeSearch.recent.title': 'Recently Viewed',
    'homeSearch.recent.viewAll': 'View All',
    'homeSearch.recent.perNight': '/night',
    'homeSearch.recent.freeCancellation': 'Free cancellation',
    'homeSearch.trust.title': 'Why choose TravelHub?',
    'homeSearch.trust.subtitle': 'Your trust and satisfaction are our top priorities',
    'homeSearch.trust.secureTitle': 'Secure Payment',
    'homeSearch.trust.secureDesc':
      'Your payment information is protected with bank-level security and SSL encryption',
    'homeSearch.trust.freeCancellationTitle': 'Free Cancellation',
    'homeSearch.trust.freeCancellationDesc':
      'Cancel most bookings free of charge up to 24 hours before check-in',
    'homeSearch.trust.supportTitle': '24/7 Support',
    'homeSearch.trust.supportDesc':
      'Our customer support team is available around the clock to help you',

    // Search Results Page
    'searchResults.summary.guests': 'Guests',
    'searchResults.summary.nights': 'nights',
    'searchResults.summary.modifySearch': 'Modify Search',
    'searchResults.filters.title': 'Filters',
    'searchResults.filters.clearAll': 'Clear all',
    'searchResults.filters.pricePerNight': 'Price per night',
    'searchResults.filters.min': 'Min',
    'searchResults.filters.max': 'Max',
    'searchResults.filters.amenities': 'Amenities',
    'searchResults.filters.guestRating': 'Guest Rating',
    'searchResults.filters.rating45': '4.5+ Exceptional',
    'searchResults.filters.rating40': '4.0+ Excellent',
    'searchResults.filters.rating35': '3.5+ Very Good',
    'searchResults.filters.rating30': '3.0+ Good',
    'searchResults.filters.freeCancellation': 'Free cancellation',
    'searchResults.filters.showOnMap': 'Show on map',
    'searchResults.amenity.freeWifi': 'Free WiFi',
    'searchResults.amenity.swimmingPool': 'Swimming Pool',
    'searchResults.amenity.freeBreakfast': 'Free Breakfast',
    'searchResults.amenity.freeParking': 'Free Parking',
    'searchResults.amenity.fitnessCenter': 'Fitness Center',
    'searchResults.amenity.petFriendly': 'Pet Friendly',
    'searchResults.resultsHeader.hotelsFound': 'hotels found',
    'searchResults.resultsHeader.in': 'in',
    'searchResults.resultsHeader.sortBy': 'Sort by:',
    'searchResults.sort.popularity': 'Popularity',
    'searchResults.sort.priceLowToHigh': 'Price (Low to High)',
    'searchResults.sort.priceHighToLow': 'Price (High to Low)',
    'searchResults.sort.guestRating': 'Guest Rating',
    'searchResults.sort.distance': 'Distance',
    'searchResults.card.reviews': 'reviews',
    'searchResults.card.freeCancellation': 'Free cancellation',
    'searchResults.card.nonRefundable': 'Non-refundable rate',
    'searchResults.card.night': 'night',
    'searchResults.card.total': 'total',
    'searchResults.card.viewDetails': 'View Details',
    'searchResults.loadMore': 'Load More Results',
    'searchResults.states.loading': 'Searching available hotels...',
    'searchResults.states.emptyTitle': 'No hotels match your filters',
    'searchResults.states.emptyDescription':
      'Try adjusting your filters to find more available options.',
    'searchResults.states.clearFilters': 'Clear filters',
    'searchResults.states.errorTitle': 'We could not load search results',
    'searchResults.states.errorDescription':
      'Please try again in a moment. If the issue persists, verify search criteria.',
    'searchResults.states.retry': 'Retry',
    'searchResults.validation.missingParams':
      'Missing search parameters. Please return to home search and try again.',

    // Login Page
    'login.title': 'Welcome to TravelHub',
    'login.subtitle': 'Sign in to your account or create a new one',
    'login.signIn': 'Sign In',
    'login.createAccount': 'Create Account',
    'login.welcome': 'Welcome back',
    'login.secure': 'Secure',
    'login.secureDesc': 'Bank-level encryption',
    'login.users': '1M+',
    'login.usersSubtitle': 'Happy travelers',
    'login.form.email': 'Email',
    'login.form.emailPlaceholder': 'tu@email.com',
    'login.form.password': 'Password',
    'login.form.passwordPlaceholder': 'Your password',
    'login.form.rememberMe': 'Remember me',
    'login.form.forgotPassword': 'Forgot your password?',
    'login.form.signInButton': 'Sign In',
    'login.form.signingIn': 'Signing in...',
    'login.form.errors.emailRequired': 'Email is required',
    'login.form.errors.emailInvalid': 'Please enter a valid email format',
    'login.form.errors.passwordRequired': 'Password is required',
    'login.form.errors.passwordMinLength': 'Minimum 6 characters',

    // Dashboard
    'dashboard.title': 'My Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.logout': 'Logout',
    'dashboard.myTrips': 'My trips',
    'dashboard.myTripsDesc': 'Review reservations and changes in one place.',
    'dashboard.billing': 'Billing',
    'dashboard.billingDesc': 'Track invoices and payment updates with secure sessions.',
    'dashboard.support': 'Support',
    'dashboard.supportDesc':
      'Get direct assistance and priority support from the traveler console.',

    // Auth Errors
    'auth.error.invalidCredentials': 'Invalid credentials. Check your email and password.',
    'auth.error.connectionError':
      'Unable to connect to authentication service. Verify backend host configuration.',
    'auth.error.unexpected': 'Unexpected authentication error. Please retry.',
  },

  es: {
    // Navigation & Layout
    'nav.backToHome': 'Volver al Inicio',
    'nav.home': 'Inicio',
    'nav.signIn': 'Iniciar sesión',
    'nav.bookNow': 'Reservar ahora',
    'nav.dashboard': 'Panel de Control',
    'nav.logout': 'Cerrar Sesión',
    'footer.description':
      'Tu socio de confianza para reservas de hoteles en América Latina. Seguro, simple y confiable.',
    'footer.company': 'Empresa',
    'footer.about': 'Acerca de',
    'footer.aboutUs': 'Sobre nosotros',
    'footer.careers': 'Carreras',
    'footer.press': 'Prensa',
    'footer.contact': 'Contacto',
    'footer.support': 'Soporte',
    'footer.helpCenter': 'Centro de ayuda',
    'footer.privacy': 'Privacidad',
    'footer.termsOfService': 'Términos del servicio',
    'footer.privacyPolicy': 'Política de privacidad',
    'footer.trustAndSafety': 'Confianza y seguridad',
    'footer.copyright': '© 2026 TravelHub. Todos los derechos reservados.',

    // Home Page
    'home.hero.title': 'Bienvenido a TravelHub',
    'home.hero.welcomeTo': 'Bienvenido a',
    'home.hero.subtitle':
      'Descubre hoteles increíbles en América Latina con reserva segura, cancelación gratuita y soporte 24/7.',
    'home.hero.badge.secure': 'Pago Seguro',
    'home.hero.badge.secureDesc':
      'Tu información de pago está protegida con seguridad de nivel líder en la industria',
    'home.hero.badge.free': 'Cancelación gratuita',
    'home.hero.badge.freeDesc':
      'Cancela o modifica tu reserva sin penalizaciones en la mayoría de propiedades',
    'home.hero.badge.support': 'Soporte 24/7',
    'home.hero.badge.supportDesc':
      'Obtén ayuda en cualquier momento con nuestro equipo de soporte dedicado',
    'home.hero.cta': 'Soy un viajero',
    'home.hero.ctaHint': 'Comienza a explorar destinos increíbles',
    'home.features.title': '¿Por qué elegir TravelHub?',
    'home.features.subtitle':
      'Vive lo mejor de América Latina con nuestra selección de hoteles cuidadosamente curada y un proceso de reserva sin fricciones.',
    'home.features.localExpertise': 'Experiencia local',
    'home.features.localExpertiseDesc':
      'Propiedades seleccionadas en toda América Latina con conocimiento local',
    'home.features.instantBooking': 'Reserva Instantánea',
    'home.features.instantBookingDesc': 'Reservas rápidas y sencillas en solo unos clics',
    'home.features.bestRates': 'Mejores Tarifas',
    'home.features.bestRatesDesc': 'Precios competitivos con ofertas y descuentos exclusivos',
    'home.features.mobileReady': 'Listo para Móvil',
    'home.features.mobileReadyDesc': 'Experiencia fluida en todos tus dispositivos',
    'home.destinations.title': 'Destinos Populares',
    'home.destinations.subtitle': 'Descubre las ubicaciones más buscadas en América Latina',

    // Home Search Page
    'homeSearch.nav.travelerHome': 'Inicio',
    'homeSearch.nav.searchResults': 'Resultados de Búsqueda',
    'homeSearch.nav.myReservations': 'Mis Reservas',
    'homeSearch.nav.accountPreferences': 'Cuenta y Preferencias',
    'homeSearch.hero.title': 'Encuentra tu escapada perfecta',
    'homeSearch.hero.subtitle':
      'Descubre hoteles increíbles en América Latina con precios inmejorables y reserva instantánea',
    'homeSearch.hero.whereTo': '¿A dónde?',
    'homeSearch.hero.wherePlaceholder': 'Ciudad o nombre del hotel',
    'homeSearch.hero.checkIn': 'Check-in',
    'homeSearch.hero.checkOut': 'Check-out',
    'homeSearch.hero.guests': 'Huéspedes',
    'homeSearch.hero.searchHotels': 'Buscar Hoteles',
    'homeSearch.hero.guest1': '1 huésped',
    'homeSearch.hero.guest2': '2 huéspedes',
    'homeSearch.hero.guest3': '3 huéspedes',
    'homeSearch.hero.guest4': '4 huéspedes',
    'homeSearch.hero.guest5Plus': '5+ huéspedes',
    'homeSearch.hero.errorDestinationRequired': 'Debes ingresar un destino (ciudad u hotel).',
    'homeSearch.hero.errorCheckInPast': 'El check-in no puede ser anterior a hoy.',
    'homeSearch.hero.errorCheckOutBeforeOrEqual': 'El check-out debe ser posterior al check-in.',
    'homeSearch.popular.title': 'Destinos Populares',
    'homeSearch.popular.subtitle': 'Explora los destinos más queridos de América Latina',
    'homeSearch.popular.price.mexico': 'Desde $45/noche',
    'homeSearch.popular.price.argentina': 'Desde $38/noche',
    'homeSearch.popular.price.brazil': 'Desde $52/noche',
    'homeSearch.popular.price.peru': 'Desde $42/noche',
    'homeSearch.popular.price.colombia': 'Desde $35/noche',
    'homeSearch.popular.available.mexico': '347 hoteles disponibles',
    'homeSearch.popular.available.argentina': '289 hoteles disponibles',
    'homeSearch.popular.available.brazil': '412 hoteles disponibles',
    'homeSearch.popular.available.peru': '198 hoteles disponibles',
    'homeSearch.popular.available.colombia': '156 hoteles disponibles',
    'homeSearch.recent.title': 'Vistos Recientemente',
    'homeSearch.recent.viewAll': 'Ver todo',
    'homeSearch.recent.perNight': '/noche',
    'homeSearch.recent.freeCancellation': 'Cancelación gratuita',
    'homeSearch.trust.title': '¿Por qué elegir TravelHub?',
    'homeSearch.trust.subtitle': 'Tu confianza y satisfacción son nuestra prioridad',
    'homeSearch.trust.secureTitle': 'Pago Seguro',
    'homeSearch.trust.secureDesc':
      'Tu información de pago está protegida con seguridad bancaria y cifrado SSL',
    'homeSearch.trust.freeCancellationTitle': 'Cancelación Gratuita',
    'homeSearch.trust.freeCancellationDesc':
      'Cancela la mayoría de reservas sin costo hasta 24 horas antes del check-in',
    'homeSearch.trust.supportTitle': 'Soporte 24/7',
    'homeSearch.trust.supportDesc':
      'Nuestro equipo de soporte está disponible todo el día para ayudarte',

    // Search Results Page
    'searchResults.summary.guests': 'Huéspedes',
    'searchResults.summary.nights': 'noches',
    'searchResults.summary.modifySearch': 'Modificar búsqueda',
    'searchResults.filters.title': 'Filtros',
    'searchResults.filters.clearAll': 'Limpiar todo',
    'searchResults.filters.pricePerNight': 'Precio por noche',
    'searchResults.filters.min': 'Min',
    'searchResults.filters.max': 'Max',
    'searchResults.filters.amenities': 'Amenidades',
    'searchResults.filters.guestRating': 'Calificación de huéspedes',
    'searchResults.filters.rating45': '4.5+ Excepcional',
    'searchResults.filters.rating40': '4.0+ Excelente',
    'searchResults.filters.rating35': '3.5+ Muy bueno',
    'searchResults.filters.rating30': '3.0+ Bueno',
    'searchResults.filters.freeCancellation': 'Cancelación gratuita',
    'searchResults.filters.showOnMap': 'Mostrar en mapa',
    'searchResults.amenity.freeWifi': 'WiFi gratis',
    'searchResults.amenity.swimmingPool': 'Piscina',
    'searchResults.amenity.freeBreakfast': 'Desayuno gratis',
    'searchResults.amenity.freeParking': 'Parqueadero gratis',
    'searchResults.amenity.fitnessCenter': 'Gimnasio',
    'searchResults.amenity.petFriendly': 'Pet friendly',
    'searchResults.resultsHeader.hotelsFound': 'hoteles encontrados',
    'searchResults.resultsHeader.in': 'en',
    'searchResults.resultsHeader.sortBy': 'Ordenar por:',
    'searchResults.sort.popularity': 'Popularidad',
    'searchResults.sort.priceLowToHigh': 'Precio (Menor a mayor)',
    'searchResults.sort.priceHighToLow': 'Precio (Mayor a menor)',
    'searchResults.sort.guestRating': 'Calificación de huéspedes',
    'searchResults.sort.distance': 'Distancia',
    'searchResults.card.reviews': 'reseñas',
    'searchResults.card.freeCancellation': 'Cancelación gratuita',
    'searchResults.card.nonRefundable': 'Tarifa no reembolsable',
    'searchResults.card.night': 'noche',
    'searchResults.card.total': 'total',
    'searchResults.card.viewDetails': 'Ver detalles',
    'searchResults.loadMore': 'Cargar más resultados',
    'searchResults.states.loading': 'Buscando hoteles disponibles...',
    'searchResults.states.emptyTitle': 'No hay hoteles con estos filtros',
    'searchResults.states.emptyDescription':
      'Prueba ajustando tus filtros para ver más opciones disponibles.',
    'searchResults.states.clearFilters': 'Limpiar filtros',
    'searchResults.states.errorTitle': 'No pudimos cargar los resultados',
    'searchResults.states.errorDescription':
      'Intenta de nuevo en unos momentos. Si persiste, verifica los criterios de búsqueda.',
    'searchResults.states.retry': 'Reintentar',
    'searchResults.validation.missingParams':
      'Faltan parámetros de búsqueda. Regresa a inicio y vuelve a buscar.',

    // Login Page
    'login.title': 'Bienvenido a TravelHub',
    'login.subtitle': 'Inicia sesión en tu cuenta o crea una nueva',
    'login.signIn': 'Iniciar Sesión',
    'login.createAccount': 'Crear Cuenta',
    'login.welcome': 'Bienvenido de vuelta',
    'login.secure': 'Seguro',
    'login.secureDesc': 'Cifrado de nivel bancario',
    'login.users': '1M+',
    'login.usersSubtitle': 'Viajeros felices',
    'login.form.email': 'Email',
    'login.form.emailPlaceholder': 'tu@email.com',
    'login.form.password': 'Contraseña',
    'login.form.passwordPlaceholder': 'Tu contraseña',
    'login.form.rememberMe': 'Recuérdame',
    'login.form.forgotPassword': '¿Olvidaste tu contraseña?',
    'login.form.signInButton': 'Iniciar Sesión',
    'login.form.signingIn': 'Iniciando sesión...',
    'login.form.errors.emailRequired': 'Email es requerido',
    'login.form.errors.emailInvalid': 'Por favor ingresa un formato de email válido',
    'login.form.errors.passwordRequired': 'Contraseña es requerida',
    'login.form.errors.passwordMinLength': 'Mínimo 6 caracteres',

    // Dashboard
    'dashboard.title': 'Mi Panel',
    'dashboard.welcome': 'Bienvenido de vuelta',
    'dashboard.logout': 'Cerrar Sesión',
    'dashboard.myTrips': 'Mis viajes',
    'dashboard.myTripsDesc': 'Revisa reservas y cambios en un solo lugar.',
    'dashboard.billing': 'Facturación',
    'dashboard.billingDesc':
      'Seguimiento de facturas y actualizaciones de pago con sesiones seguras.',
    'dashboard.support': 'Soporte',
    'dashboard.supportDesc':
      'Obtén asistencia directa y soporte prioritario desde la consola del viajero.',

    // Auth Errors
    'auth.error.invalidCredentials': 'Credenciales inválidas. Verifica tu email y contraseña.',
    'auth.error.connectionError':
      'No se pudo conectar al servicio de autenticación. Verifica la configuración del backend.',
    'auth.error.unexpected': 'Error inesperado en la autenticación. Por favor intenta de nuevo.',
  },

  pt: {
    // Navigation & Layout
    'nav.backToHome': 'Voltar para Home',
    'nav.home': 'Início',
    'nav.signIn': 'Entrar',
    'nav.bookNow': 'Reservar agora',
    'nav.dashboard': 'Painel de Controle',
    'nav.logout': 'Sair',
    'footer.description':
      'Seu parceiro de confiança para reservas de hotéis na América Latina. Seguro, simples e confiável.',
    'footer.company': 'Empresa',
    'footer.about': 'Sobre',
    'footer.aboutUs': 'Sobre nós',
    'footer.careers': 'Carreiras',
    'footer.press': 'Imprensa',
    'footer.contact': 'Contato',
    'footer.support': 'Suporte',
    'footer.helpCenter': 'Centro de ajuda',
    'footer.privacy': 'Privacidade',
    'footer.termsOfService': 'Termos de serviço',
    'footer.privacyPolicy': 'Política de privacidade',
    'footer.trustAndSafety': 'Confiança e segurança',
    'footer.copyright': '© 2026 TravelHub. Todos os direitos reservados.',

    // Home Page
    'home.hero.title': 'Bem-vindo ao TravelHub',
    'home.hero.welcomeTo': 'Bem-vindo ao',
    'home.hero.subtitle':
      'Descubra hotéis incríveis na América Latina com reserva segura, cancelamento gratuito e suporte 24/7.',
    'home.hero.badge.secure': 'Pagamento Seguro',
    'home.hero.badge.secureDesc':
      'Suas informações de pagamento são protegidas com segurança de nível líder do setor',
    'home.hero.badge.free': 'Cancelamento gratuito',
    'home.hero.badge.freeDesc':
      'Cancele ou modifique sua reserva sem penalidades na maioria das propriedades',
    'home.hero.badge.support': 'Suporte 24/7',
    'home.hero.badge.supportDesc':
      'Receba ajuda a qualquer momento com nossa equipe de suporte dedicada',
    'home.hero.cta': 'Sou um viajante',
    'home.hero.ctaHint': 'Comece a explorar destinos incríveis',
    'home.features.title': 'Por que escolher a TravelHub?',
    'home.features.subtitle':
      'Experimente o melhor da América Latina com nossa seleção cuidadosa de hotéis e um processo de reserva sem fricção.',
    'home.features.localExpertise': 'Experiência local',
    'home.features.localExpertiseDesc':
      'Propriedades selecionadas na América Latina com conhecimento local',
    'home.features.instantBooking': 'Reserva Instantânea',
    'home.features.instantBookingDesc': 'Reservas rápidas e fáceis em apenas alguns cliques',
    'home.features.bestRates': 'Melhores Tarifas',
    'home.features.bestRatesDesc': 'Preços competitivos com ofertas e descontos exclusivos',
    'home.features.mobileReady': 'Pronto para Mobile',
    'home.features.mobileReadyDesc': 'Experiência perfeita em todos os seus dispositivos',
    'home.destinations.title': 'Destinos Populares',
    'home.destinations.subtitle': 'Descubra os locais mais procurados na América Latina',

    // Home Search Page
    'homeSearch.nav.travelerHome': 'Início do Viajante',
    'homeSearch.nav.searchResults': 'Resultados da Busca',
    'homeSearch.nav.myReservations': 'Minhas Reservas',
    'homeSearch.nav.accountPreferences': 'Conta e Preferências',
    'homeSearch.hero.title': 'Encontre sua viagem perfeita',
    'homeSearch.hero.subtitle':
      'Descubra hotéis incríveis na América Latina com preços imbatíveis e reserva instantânea',
    'homeSearch.hero.whereTo': 'Para onde?',
    'homeSearch.hero.wherePlaceholder': 'Cidade ou nome do hotel',
    'homeSearch.hero.checkIn': 'Check-in',
    'homeSearch.hero.checkOut': 'Check-out',
    'homeSearch.hero.guests': 'Hóspedes',
    'homeSearch.hero.searchHotels': 'Buscar Hotéis',
    'homeSearch.hero.guest1': '1 hóspede',
    'homeSearch.hero.guest2': '2 hóspedes',
    'homeSearch.hero.guest3': '3 hóspedes',
    'homeSearch.hero.guest4': '4 hóspedes',
    'homeSearch.hero.guest5Plus': '5+ hóspedes',
    'homeSearch.hero.errorDestinationRequired': 'Você deve informar um destino (cidade ou hotel).',
    'homeSearch.hero.errorCheckInPast': 'O check-in não pode ser anterior a hoje.',
    'homeSearch.hero.errorCheckOutBeforeOrEqual': 'O check-out deve ser posterior ao check-in.',
    'homeSearch.popular.title': 'Destinos Populares',
    'homeSearch.popular.subtitle': 'Explore os destinos mais queridos da América Latina',
    'homeSearch.popular.price.mexico': 'A partir de $45/noite',
    'homeSearch.popular.price.argentina': 'A partir de $38/noite',
    'homeSearch.popular.price.brazil': 'A partir de $52/noite',
    'homeSearch.popular.price.peru': 'A partir de $42/noite',
    'homeSearch.popular.price.colombia': 'A partir de $35/noite',
    'homeSearch.popular.available.mexico': '347 hotéis disponíveis',
    'homeSearch.popular.available.argentina': '289 hotéis disponíveis',
    'homeSearch.popular.available.brazil': '412 hotéis disponíveis',
    'homeSearch.popular.available.peru': '198 hotéis disponíveis',
    'homeSearch.popular.available.colombia': '156 hotéis disponíveis',
    'homeSearch.recent.title': 'Vistos Recentemente',
    'homeSearch.recent.viewAll': 'Ver todos',
    'homeSearch.recent.perNight': '/noite',
    'homeSearch.recent.freeCancellation': 'Cancelamento grátis',
    'homeSearch.trust.title': 'Por que escolher a TravelHub?',
    'homeSearch.trust.subtitle': 'Sua confiança e satisfação são nossas prioridades',
    'homeSearch.trust.secureTitle': 'Pagamento Seguro',
    'homeSearch.trust.secureDesc':
      'Suas informações de pagamento são protegidas com segurança bancária e criptografia SSL',
    'homeSearch.trust.freeCancellationTitle': 'Cancelamento Grátis',
    'homeSearch.trust.freeCancellationDesc':
      'Cancele a maioria das reservas gratuitamente até 24 horas antes do check-in',
    'homeSearch.trust.supportTitle': 'Suporte 24/7',
    'homeSearch.trust.supportDesc':
      'Nossa equipe de suporte está disponível 24 horas para ajudar você',

    // Search Results Page
    'searchResults.summary.guests': 'Hóspedes',
    'searchResults.summary.nights': 'noites',
    'searchResults.summary.modifySearch': 'Modificar busca',
    'searchResults.filters.title': 'Filtros',
    'searchResults.filters.clearAll': 'Limpar tudo',
    'searchResults.filters.pricePerNight': 'Preço por noite',
    'searchResults.filters.min': 'Min',
    'searchResults.filters.max': 'Max',
    'searchResults.filters.amenities': 'Comodidades',
    'searchResults.filters.guestRating': 'Avaliação de hóspedes',
    'searchResults.filters.rating45': '4.5+ Excepcional',
    'searchResults.filters.rating40': '4.0+ Excelente',
    'searchResults.filters.rating35': '3.5+ Muito bom',
    'searchResults.filters.rating30': '3.0+ Bom',
    'searchResults.filters.freeCancellation': 'Cancelamento grátis',
    'searchResults.filters.showOnMap': 'Mostrar no mapa',
    'searchResults.amenity.freeWifi': 'WiFi grátis',
    'searchResults.amenity.swimmingPool': 'Piscina',
    'searchResults.amenity.freeBreakfast': 'Café da manhã grátis',
    'searchResults.amenity.freeParking': 'Estacionamento grátis',
    'searchResults.amenity.fitnessCenter': 'Academia',
    'searchResults.amenity.petFriendly': 'Pet friendly',
    'searchResults.resultsHeader.hotelsFound': 'hotéis encontrados',
    'searchResults.resultsHeader.in': 'em',
    'searchResults.resultsHeader.sortBy': 'Ordenar por:',
    'searchResults.sort.popularity': 'Popularidade',
    'searchResults.sort.priceLowToHigh': 'Preço (Menor para maior)',
    'searchResults.sort.priceHighToLow': 'Preço (Maior para menor)',
    'searchResults.sort.guestRating': 'Avaliação de hóspedes',
    'searchResults.sort.distance': 'Distância',
    'searchResults.card.reviews': 'avaliações',
    'searchResults.card.freeCancellation': 'Cancelamento grátis',
    'searchResults.card.nonRefundable': 'Tarifa não reembolsável',
    'searchResults.card.night': 'noite',
    'searchResults.card.total': 'total',
    'searchResults.card.viewDetails': 'Ver detalhes',
    'searchResults.loadMore': 'Carregar mais resultados',
    'searchResults.states.loading': 'Buscando hotéis disponíveis...',
    'searchResults.states.emptyTitle': 'Nenhum hotel corresponde aos filtros',
    'searchResults.states.emptyDescription':
      'Tente ajustar os filtros para encontrar mais opções disponíveis.',
    'searchResults.states.clearFilters': 'Limpar filtros',
    'searchResults.states.errorTitle': 'Não foi possível carregar os resultados',
    'searchResults.states.errorDescription':
      'Tente novamente em alguns instantes. Se persistir, revise os critérios de busca.',
    'searchResults.states.retry': 'Tentar novamente',
    'searchResults.validation.missingParams':
      'Faltam parâmetros de busca. Volte para home-search e tente de novo.',

    // Login Page
    'login.title': 'Bem-vindo ao TravelHub',
    'login.subtitle': 'Faça login em sua conta ou crie uma nova',
    'login.signIn': 'Entrar',
    'login.createAccount': 'Criar Conta',
    'login.welcome': 'Bem-vindo de volta',
    'login.secure': 'Seguro',
    'login.secureDesc': 'Criptografia de nível bancário',
    'login.users': '1M+',
    'login.usersSubtitle': 'Viajantes felizes',
    'login.form.email': 'Email',
    'login.form.emailPlaceholder': 'seu@email.com',
    'login.form.password': 'Senha',
    'login.form.passwordPlaceholder': 'Sua senha',
    'login.form.rememberMe': 'Lembre-se de mim',
    'login.form.forgotPassword': 'Esqueceu sua senha?',
    'login.form.signInButton': 'Entrar',
    'login.form.signingIn': 'Entrando...',
    'login.form.errors.emailRequired': 'Email é obrigatório',
    'login.form.errors.emailInvalid': 'Por favor, digite um formato de email válido',
    'login.form.errors.passwordRequired': 'Senha é obrigatória',
    'login.form.errors.passwordMinLength': 'Mínimo 6 caracteres',

    // Dashboard
    'dashboard.title': 'Meu Painel',
    'dashboard.welcome': 'Bem-vindo de volta',
    'dashboard.logout': 'Sair',
    'dashboard.myTrips': 'Minhas viagens',
    'dashboard.myTripsDesc': 'Revise reservas e alterações em um único lugar.',
    'dashboard.billing': 'Faturamento',
    'dashboard.billingDesc': 'Rastreie faturas e atualizações de pagamento com sessões seguras.',
    'dashboard.support': 'Suporte',
    'dashboard.supportDesc':
      'Obtenha assistência direta e suporte prioritário no console do viajante.',

    // Auth Errors
    'auth.error.invalidCredentials': 'Credenciais inválidas. Verifique seu email e senha.',
    'auth.error.connectionError':
      'Não foi possível conectar ao serviço de autenticação. Verifique a configuração do backend.',
    'auth.error.unexpected': 'Erro inesperado na autenticação. Por favor tente novamente.',
  },
};
