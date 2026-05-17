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

  // SPRINT3 NOTA: el endpoint de pago cambio. Ahora:
  //   POST {extPaymentsBaseUrl}/api/v1/payments  (sin /process al final,
  //        contra el ext-payments service via CloudFront /ext-payments).
  //   El payload es ahora solo { payment_intent_id, payment_method } —
  //   el cardNumber/cvv/etc se siguen llenando en el form pero el web-client
  //   ya no los envia al backend, lo hace el provider externo.
  //   Despues de la respuesta, el componente espera 2s (setTimeout) y
  //   pone status='completado' sin polling. El GET /payments/:id ya NO
  //   se llama desde el flujo principal.
  cy.intercept('POST', '**/api/v1/payments', {
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

  // GET /payments/:id queda mockeado por compatibilidad (algunas otras
  // vistas podrian usarlo, aunque el flow principal ya no llama polling).
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
//
// SPRINT3 NOTA: el campo #email se auto-completa con el email del
// usuario autenticado y aparece como `readonly`. El helper detecta
// este caso y skipea el clear/type para no fallar.
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
  cy.get('#email').then(($el) => {
    // Si el input no es readonly (compat con sprints anteriores), lo escribimos.
    if (!$el.prop('readOnly')) {
      cy.wrap($el).clear().type(data.email);
    }
  });
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

// ============================================================
// SPRINT3 HELPERS
// ============================================================

// ── fillRegistrationForm ───────────────────────────────────
// Rellena el formulario de "Sign Up" en /login. Activa el tab signup
// si no esta visible. Acepta overrides para casos negativos.
Cypress.Commands.add('fillRegistrationForm', (overrides = {}) => {
  const data = {
    firstName: 'Diego',
    lastName: 'Acosta',
    email: 'diego.acosta@test.com',
    phone: '3001234567',
    password: 'Password1',
    confirmPassword: 'Password1',
    acceptTerms: true,
    ...overrides,
  };

  // Si el tab signup no esta activo, activamos.
  cy.get('#signup-tab').click();

  cy.get('#login-signup-firstname').clear().type(data.firstName);
  cy.get('#login-signup-lastname').clear().type(data.lastName);
  cy.get('#login-signup-email').clear().type(data.email);
  cy.get('#login-signup-phone').clear().type(data.phone);
  cy.get('#login-signup-password').clear().type(data.password);
  cy.get('#login-signup-confirm-password').clear().type(data.confirmPassword);

  if (data.acceptTerms) {
    cy.get('#login-terms-checkbox').check();
  }
});

// ── interceptRegistrationCycle ─────────────────────────────
// Mockea POST /usuarios (registro), POST /auth/verify-email y
// POST a EmailJS (en caso de que el frontend dispare el correo).
Cypress.Commands.add('interceptRegistrationCycle', () => {
  cy.intercept('POST', '**/api/v1/usuarios', { fixture: 'usuario-creado.json' }).as('registerUser');
  cy.intercept('POST', '**/api/v1/auth/verify-email', {
    fixture: 'verify-email-success.json',
  }).as('verifyEmail');
  cy.intercept('POST', 'https://api.emailjs.com/api/v1.0/email/send', {
    statusCode: 200,
    body: 'OK',
  }).as('sendEmailJs');
});

// ── interceptMyReservationsCycle ───────────────────────────
// Mockea todos los endpoints que el componente de Mis Reservas
// consulta para hidratar las cards (reservas + lookups + comentarios).
// Por defecto devuelve mis-reservas.json (6 reservas en distintos estados)
// y comentarios-with-review.json (res-005 ya calificada).
Cypress.Commands.add(
  'interceptMyReservationsCycle',
  (
    options: {
      reservasFixture?: string;
      commentsFixture?: string;
    } = {},
  ) => {
    const reservas = options.reservasFixture ?? 'mis-reservas.json';
    const comments = options.commentsFixture ?? 'comentarios-with-review.json';

    cy.intercept('GET', '**/api/v1/usuarios/*/reservas', { fixture: reservas }).as('getMyReservas');
    cy.intercept('GET', '**/api/v1/estados', { fixture: 'estados.json' }).as('getEstados');
    cy.intercept('GET', '**/api/v1/habitaciones/*', { fixture: 'habitacion-by-id.json' }).as(
      'getHabitacion',
    );
    // El componente llama getHotelById (singular) y getHotelComments — ambos
    // matchean **/hoteles/h*. El intercept mas especifico va PRIMERO.
    cy.intercept('GET', '**/api/v1/hoteles/*/comentarios*', { fixture: comments }).as(
      'getHotelComments',
    );
    cy.intercept('GET', '**/api/v1/hoteles/h*', { fixture: 'hotel-by-id.json' }).as('getHotelById');
    cy.intercept('GET', '**/api/v1/ciudades/*', { fixture: 'ciudad-by-id.json' }).as('getCiudad');
    cy.intercept('GET', '**/api/v1/paises/*', { fixture: 'pais-by-id.json' }).as('getPais');
    // Importante: el GET /usuarios/:id es ambiguo con /usuarios/:id/reservas.
    // Cypress no soporta [^/]+ en glob, asi que usamos un RegExp para
    // matchear SOLO `/api/v1/usuarios/<digitos>` (sin segmento adicional).
    cy.intercept('GET', /\/api\/v1\/usuarios\/\d+$/, { fixture: 'usuario-by-id.json' }).as(
      'getUsuario',
    );
    // Para POST /hoteles/:id/comentarios (calificar)
    cy.intercept('POST', '**/api/v1/hoteles/*/comentarios*', {
      statusCode: 201,
      fixture: 'comentario-creado.json',
    }).as('createHotelComment');
  },
);

// ── interceptCancellationCycle ─────────────────────────────
// Mockea la cadena que dispara confirmar cancelacion:
//   GET /estados → PUT /reservas/:id → GET /reservas/:id/notificaciones
//   → POST EmailJS → POST /notificaciones (auditoria).
Cypress.Commands.add('interceptCancellationCycle', () => {
  cy.intercept('GET', '**/api/v1/estados', { fixture: 'estados.json' }).as('getEstados');
  cy.intercept('PUT', '**/api/v1/reservas/*', {
    statusCode: 200,
    body: { id: 'res-001', id_estado: 'e004' },
  }).as('updateReserva');
  cy.intercept('GET', '**/api/v1/reservas/*/notificaciones*', {
    statusCode: 200,
    body: [],
  }).as('getNotificaciones');
  cy.intercept('POST', 'https://api.emailjs.com/api/v1.0/email/send', {
    statusCode: 200,
    body: 'OK',
  }).as('sendEmailJs');
  cy.intercept('POST', '**/api/v1/notificaciones', {
    statusCode: 201,
    body: { id: 'notif-cancel-001', titulo: 'cancelacion' },
  }).as('createNotificacion');
});

// ── fillCancellationForm ───────────────────────────────────
// Selecciona la razon (radio) + comentarios opcionales en la pagina
// /app/cancelar-reserva.
Cypress.Commands.add(
  'fillCancellationForm',
  (
    overrides: {
      reason?: 'travel_plans' | 'emergency' | 'work' | 'health' | 'other';
      comments?: string;
    } = {},
  ) => {
    const data = {
      reason: 'travel_plans' as const,
      comments: '',
      ...overrides,
    };

    cy.get(`input[type="radio"][value="${data.reason}"]`).check();

    if (data.comments) {
      cy.get('textarea').clear().type(data.comments);
    }
  },
);
