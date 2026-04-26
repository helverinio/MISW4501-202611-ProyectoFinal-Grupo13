// ============================================================
// Comandos personalizados de Cypress para TravelHub E2E Tests
// ============================================================
// Estos comandos encapsulan operaciones comunes para evitar
// repetir codigo en cada archivo de prueba.

// Keys exactas usadas por AuthService (auth.service.ts lineas 10-12)
const AUTH_KEYS = {
  accessToken: 'travelhub.access_token',
  refreshToken: 'travelhub.refresh_token',
  user: 'travelhub.user',
} as const;

// ── loginByToken ───────────────────────────────────────────
// Inyecta tokens directamente en localStorage para simular
// una sesion autenticada SIN pasar por el formulario de login.
// Esto es mas rapido y estable que llenar el formulario cada vez.
//
// IMPORTANTE: Tambien intercepta llamadas GET "de fondo" que la app
// hace al cargar paginas autenticadas (hoteles populares, reservas
// recientes, etc.). Sin estos intercepts, esas llamadas van al
// backend real, retornan 401 con nuestro token falso, y el
// interceptor HTTP de Angular redirige automaticamente a /login.
Cypress.Commands.add('loginByToken', () => {
  // Interceptar llamadas GET de fondo ANTES de visitar la pagina.
  // Se definen primero para que los intercepts mas especificos
  // (definidos despues en cada test) tengan prioridad en Cypress.
  cy.intercept('GET', '**/api/v1/hoteles/populares-por-ciudad*', {
    body: { total_ciudades: 0, destinos: [] },
  }).as('popularHotels');
  cy.intercept('GET', '**/api/v1/usuarios/*/reservas/recently-viewed*', {
    body: [],
  }).as('recentlyViewed');

  cy.fixture('user.json').then((user) => {
    cy.window().then((win) => {
      win.localStorage.setItem(
        AUTH_KEYS.accessToken,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiY3lwcmVzc190ZXN0IiwiZXhwIjoxOTk5OTk5OTk5fQ.mock-token',
      );
      win.localStorage.setItem(AUTH_KEYS.refreshToken, 'mock-refresh-token-cypress');
      win.localStorage.setItem(AUTH_KEYS.user, JSON.stringify(user));
    });
  });
  cy.visit('/app/home-search');
});

// ── interceptLogin ─────────────────────────────────────────
// Intercepta la peticion POST /api/v1/auth/login y devuelve
// el fixture indicado (por defecto: login exitoso).
Cypress.Commands.add('interceptLogin', (fixture = 'login-success.json') => {
  cy.intercept('POST', '**/api/v1/auth/login', { fixture }).as('loginRequest');
});

// ── interceptSearchHotels ──────────────────────────────────
// Intercepta la peticion POST /api/v1/hoteles/buscar-disponibles
// y devuelve el fixture indicado (por defecto: 15 hoteles).
Cypress.Commands.add('interceptSearchHotels', (fixture = 'search-results.json') => {
  cy.intercept('POST', '**/api/v1/hoteles/buscar-disponibles', { fixture }).as(
    'searchHotelsRequest',
  );
});

// ── clearAuthState ─────────────────────────────────────────
// Limpia todos los tokens de autenticacion de localStorage.
Cypress.Commands.add('clearAuthState', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem(AUTH_KEYS.accessToken);
    win.localStorage.removeItem(AUTH_KEYS.refreshToken);
    win.localStorage.removeItem(AUTH_KEYS.user);
  });
});

// ── interceptReservationCycle ──────────────────────────────
// Registra los intercepts necesarios para el flujo E2E completo de
// reserva (HU-W-17 -> HU-W-18 -> TFP-15.1 -> HU-W-20.2 -> TFP-15.2):
//   Busqueda -> Detalle -> Hold 15min -> Crear reserva -> Pago -> Confirmacion -> Email
//
// SPRINT-2 NOTA: el flujo de pago es ahora de 2 pasos:
//   1. submit() del form de huesped → POST /reservas (devuelve payment.payment_id)
//      → la pagina pasa a vista de pago
//   2. confirmPayment() → POST /payments/:id/process → polling GET /payments/:id
//      hasta status='completado' → vista de confirmacion + email via EmailJS.
//
// Endpoints mockeados:
//   GET    /hoteles/:id                       → hotel-by-id.json
//   GET    /hoteles/:id/habitaciones          → hotel-rooms.json
//   POST   /hoteles/buscar-disponibles        → search-results.json
//   POST   /habitaciones/:id/hold             → generado dinamico (expires_at now+15min)
//   DELETE /holds/:id                         → 204 vacio
//   GET    /ciudades/:id                      → ciudad-by-id.json
//   GET    /estados                           → estados.json
//   POST   /reservas                          → reservation-created.json (con payment block)
//   POST   /payments/:id/process              → 200 status='procesando'
//   GET    /payments/:id                      → 200 status='completado' (termina polling)
//   POST   /notificaciones                    → notification-created.json (legacy, ya no se llama)
//   POST   emailjs.com/.../email/send         → 200 'OK' (text response)
//
// IMPORTANTE: El hold se genera dinamicamente porque el componente
// arranca un setInterval con expires_at del backend. Necesitamos una
// fecha en el futuro cercano para testear el countdown sin timeouts reales.
Cypress.Commands.add('interceptReservationCycle', (options = {}) => {
  const holdMinutes = options.holdMinutes ?? 15;
  const holdExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000)
    .toISOString()
    .replace('Z', '');

  cy.intercept('GET', '**/api/v1/hoteles/*/habitaciones', { fixture: 'hotel-rooms.json' }).as(
    'getHotelRooms',
  );
  cy.intercept('GET', '**/api/v1/hoteles/h*', { fixture: 'hotel-by-id.json' }).as('getHotelById');
  cy.intercept('POST', '**/api/v1/hoteles/buscar-disponibles', {
    fixture: 'search-results.json',
  }).as('searchHotels');
  cy.intercept('POST', '**/api/v1/habitaciones/*/hold', {
    statusCode: 201,
    body: {
      id: 'hold-cypress-001',
      id_habitacion: 'r002',
      id_usuario: '1',
      fecha_ingreso: '2026-04-10T00:00:00',
      fecha_salida: '2026-04-15T00:00:00',
      created_at: new Date().toISOString().replace('Z', ''),
      expires_at: holdExpiresAt,
    },
  }).as('acquireHold');
  cy.intercept('DELETE', '**/api/v1/holds/*', { statusCode: 204, body: {} }).as('releaseHold');
  cy.intercept('GET', '**/api/v1/ciudades/*', { fixture: 'ciudad-by-id.json' }).as('getCiudad');
  cy.intercept('GET', '**/api/v1/estados', { fixture: 'estados.json' }).as('getEstados');
  cy.intercept('POST', '**/api/v1/reservas', { fixture: 'reservation-created.json' }).as(
    'createReserva',
  );

  // Pago externo: process devuelve "procesando", luego el componente hace polling
  // a GET /payments/:id y debe ver "completado" para terminar.
  cy.intercept('POST', '**/api/v1/payments/*/process', {
    statusCode: 200,
    body: {
      id: 'pay-xyz-456',
      payment_intent_id: 'pi-abc-789',
      reservation_id: 'res-abc-123',
      amount: 672.0,
      currency: 'USD',
      status: 'procesando',
      payment_method: 'card',
      message: 'Payment is being processed.',
    },
  }).as('processPayment');

  cy.intercept('GET', '**/api/v1/payments/*', {
    statusCode: 200,
    body: {
      id: 'pay-xyz-456',
      payment_intent_id: 'pi-abc-789',
      reservation_id: 'res-abc-123',
      amount: 672.0,
      currency: 'USD',
      status: 'completado',
      payment_method: 'card',
      external_payment_id: 'ext-pay-001',
    },
  }).as('getPaymentStatus');

  // Legacy intercept (el componente actual ya no llama notificaciones, pero
  // dejamos el alias por compatibilidad con tests existentes).
  cy.intercept('POST', '**/api/v1/notificaciones', { fixture: 'notification-created.json' }).as(
    'createNotificacion',
  );

  // EmailJS: el servicio externo devuelve un texto plano "OK".
  cy.intercept('POST', 'https://api.emailjs.com/api/v1.0/email/send', {
    statusCode: 200,
    body: 'OK',
  }).as('sendEmailJs');
});

// ── fillReservationForm ────────────────────────────────────
// Rellena los campos del formulario de huesped (paso 1). El submit
// dispara POST /reservas y la pagina cambia a la vista de pago.
Cypress.Commands.add('fillReservationForm', (overrides = {}) => {
  const data = {
    firstName: 'Diego',
    lastName: 'Acosta',
    email: 'diego.acosta@test.com',
    phone: '3001234567',
    ...overrides,
  };

  cy.get('#firstName').clear().type(data.firstName);
  cy.get('#lastName').clear().type(data.lastName);
  cy.get('#email').clear().type(data.email);
  cy.get('#phone').clear().type(data.phone);
});

// ── fillPaymentForm ────────────────────────────────────────
// Rellena el formulario de pago que aparece DESPUES de submit del
// formulario de huesped. El template no tiene ids; usamos los inputs
// con formControlName. Los inputs de cardNumber/expiry/cvv tienen
// (input)="..." que normaliza el valor; usamos {force:true} para
// evitar interferir con esa logica.
Cypress.Commands.add('fillPaymentForm', (overrides = {}) => {
  const data = {
    cardNumber: '4242 4242 4242 4242',
    expiryDate: '12/30',
    cvv: '123',
    cardholderName: 'Diego Acosta',
    billingAddress: '123 Main Street',
    city: 'Bogota',
    postalCode: '110111',
    ...overrides,
  };

  // cardNumber: formato "4242 4242 4242 4242" (16 digitos visa). El (input)
  // del componente normaliza pero acepta el string tal cual.
  cy.get('input[formcontrolname="cardNumber"]').clear().type(data.cardNumber);
  cy.get('input[formcontrolname="expiryDate"]').clear().type(data.expiryDate);
  cy.get('input[formcontrolname="cvv"]').clear().type(data.cvv);
  cy.get('input[formcontrolname="cardholderName"]').clear().type(data.cardholderName);
  cy.get('input[formcontrolname="billingAddress"]').clear().type(data.billingAddress);
  cy.get('input[formcontrolname="city"]').clear().type(data.city);
  cy.get('input[formcontrolname="postalCode"]').clear().type(data.postalCode);
});
