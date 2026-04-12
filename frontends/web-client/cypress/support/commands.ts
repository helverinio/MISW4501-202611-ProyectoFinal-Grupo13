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
Cypress.Commands.add('loginByToken', () => {
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
