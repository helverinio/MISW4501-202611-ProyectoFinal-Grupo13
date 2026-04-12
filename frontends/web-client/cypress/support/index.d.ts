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
  }
}
