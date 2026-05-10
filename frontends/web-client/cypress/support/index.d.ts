declare namespace Cypress {
  interface Chainable {
    /**
     * Inyecta tokens de autenticacion en localStorage y navega a /app/home-search.
     * Usa esto en pruebas que necesitan un usuario autenticado sin pasar por el login.
     */
    loginByToken(): Chainable<void>;

    /**
     * Intercepta POST /api/v1/auth/login con el fixture indicado.
     * @param fixture - Nombre del archivo fixture (default: 'login-success.json')
     */
    interceptLogin(fixture?: string): Chainable<void>;

    /**
     * Intercepta POST /api/v1/hoteles/buscar-disponibles con el fixture indicado.
     * @param fixture - Nombre del archivo fixture (default: 'search-results.json')
     */
    interceptSearchHotels(fixture?: string): Chainable<void>;

    /**
     * Limpia las keys de autenticacion de localStorage.
     */
    clearAuthState(): Chainable<void>;

    /**
     * Registra todos los intercepts necesarios para el flujo E2E completo
     * de reserva (Busqueda -> Detalle -> Hold 15 min -> Pago -> Confirmacion).
     *
     * @param options.holdMinutes - Duracion del hold en minutos (default: 15)
     */
    interceptReservationCycle(options?: { holdMinutes?: number }): Chainable<void>;

    /**
     * Rellena los campos obligatorios del formulario de reserva.
     * Usa valores por defecto si no se pasan overrides.
     */
    fillReservationForm(overrides?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    }): Chainable<void>;

    /**
     * Rellena el formulario de pago (sprint2). Aparece despues del
     * submit del formulario de huesped. Acepta tarjeta Visa por defecto.
     */
    fillPaymentForm(overrides?: {
      cardNumber?: string;
      expiryDate?: string;
      cvv?: string;
      cardholderName?: string;
      billingAddress?: string;
      city?: string;
      postalCode?: string;
    }): Chainable<void>;

    /**
     * Activa el tab "Sign Up" en /login y rellena los 7 campos del
     * formulario de registro + checkbox de terminos. Defaults validos.
     */
    fillRegistrationForm(overrides?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
      acceptTerms?: boolean;
    }): Chainable<void>;

    /**
     * Mockea POST /usuarios, POST /auth/verify-email y POST EmailJS.
     */
    interceptRegistrationCycle(): Chainable<void>;

    /**
     * Mockea los GET necesarios para que /app/mis-reservas pinte la
     * lista de reservas con todos sus lookups (hotel, ciudad, pais,
     * usuario, comentarios). Tambien mockea POST /comentarios.
     */
    interceptMyReservationsCycle(options?: {
      reservasFixture?: string;
      commentsFixture?: string;
    }): Chainable<void>;

    /**
     * Mockea la cadena de cancelacion (PUT /reservas, GET /notificaciones,
     * EmailJS, POST /notificaciones).
     */
    interceptCancellationCycle(): Chainable<void>;

    /**
     * Selecciona la razon de cancelacion + comentarios opcionales en
     * la pagina /app/cancelar-reserva.
     */
    fillCancellationForm(overrides?: {
      reason?: 'travel_plans' | 'emergency' | 'work' | 'health' | 'other';
      comments?: string;
    }): Chainable<void>;
  }
}
