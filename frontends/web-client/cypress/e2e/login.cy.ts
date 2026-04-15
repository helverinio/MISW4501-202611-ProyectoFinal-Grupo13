// ============================================================
// FLUJO E2E #1: LOGIN DE USUARIO
// ============================================================
// Este archivo prueba el flujo completo de inicio de sesion:
//   1. Renderizado correcto del formulario
//   2. Validacion de campos (email requerido, password requerido y minimo 6 chars)
//   3. Toggle de visibilidad del password
//   4. Login exitoso -> redireccion a /app/home-search
//   5. Manejo de errores (credenciales invalidas, error de red)
//
// API mockeada: POST /api/v1/auth/login
// Modelo del request:  { email: string, contrasena: string }
// Modelo del response: { access_token, refresh_token, token_type, expires_in, usuario }

describe('Flujo E2E #1: Login de usuario', () => {
  beforeEach(() => {
    // Limpiamos cualquier sesion previa antes de cada prueba
    cy.clearAuthState();
    cy.visit('/login');
  });

  // ────────────────────────────────────────────────────────
  // GRUPO 1: El formulario se renderiza correctamente
  // ────────────────────────────────────────────────────────
  describe('1. Renderizado del formulario', () => {
    it('muestra la pagina de login con el formulario', () => {
      // La seccion principal de autenticacion debe estar visible
      cy.get('#auth-section').should('be.visible');

      // El formulario de login debe existir
      cy.get('#email-signin-form').should('be.visible');

      // Los campos de email y password deben estar presentes
      cy.get('#signin-email').should('be.visible');
      cy.get('#signin-password').should('be.visible');

      // El boton de submit debe existir
      cy.get('#signin-btn').should('be.visible');
    });

    it('muestra los tabs Sign In y Sign Up', () => {
      cy.get('#signin-tab').should('be.visible');
      cy.get('#signup-tab').should('be.visible');
    });

    it('el tab Sign In esta activo por defecto y muestra su formulario', () => {
      // El formulario de Sign In debe estar visible
      cy.get('#signin-form').should('not.have.class', 'hidden');

      // El formulario de Sign Up debe estar oculto
      cy.get('#signup-form').should('have.class', 'hidden');
    });

    it('al hacer click en Sign Up se muestra el formulario de registro', () => {
      cy.get('#signup-tab').click();

      cy.get('#signup-form').should('not.have.class', 'hidden');
      cy.get('#signin-form').should('have.class', 'hidden');
    });
  });

  // ────────────────────────────────────────────────────────
  // GRUPO 2: Validacion del formulario
  // ────────────────────────────────────────────────────────
  describe('2. Validacion del formulario', () => {
    it('muestra error cuando el email esta vacio y pierde el foco', () => {
      // Tocamos el campo y lo dejamos vacio
      cy.get('#signin-email').focus().blur();

      // Debe aparecer el mensaje de error de email requerido
      cy.get('#email-error').should('be.visible');
    });

    it('muestra error cuando el password esta vacio y pierde el foco', () => {
      cy.get('#signin-password').focus().blur();

      cy.get('#password-error').should('be.visible');
    });

    it('muestra error de longitud minima cuando el password tiene menos de 6 caracteres', () => {
      // Escribimos solo 3 caracteres (minimo es 6)
      cy.get('#signin-password').type('abc').blur();

      cy.get('#password-error-length').should('be.visible');
    });

    it('el boton Submit esta deshabilitado cuando el formulario es invalido', () => {
      // Sin llenar ningun campo, el boton debe estar disabled
      cy.get('#signin-btn').should('be.disabled');
    });

    it('el boton Submit se habilita cuando ambos campos son validos', () => {
      cy.get('#signin-email').type('test@example.com');
      cy.get('#signin-password').type('password123');

      cy.get('#signin-btn').should('not.be.disabled');
    });
  });

  // ────────────────────────────────────────────────────────
  // GRUPO 3: Toggle de visibilidad del password
  // ────────────────────────────────────────────────────────
  describe('3. Visibilidad del password', () => {
    it('el campo password es de tipo "password" por defecto (oculto)', () => {
      cy.get('#signin-password').should('have.attr', 'type', 'password');
    });

    it('al hacer click en el icono del ojo se muestra el password como texto', () => {
      // El boton toggle esta dentro del div.relative que contiene el input
      cy.get('#signin-password').parents('.relative').find('button').click();

      cy.get('#signin-password').should('have.attr', 'type', 'text');
    });

    it('al hacer click de nuevo se oculta el password', () => {
      const toggleBtn = () => cy.get('#signin-password').parents('.relative').find('button');

      toggleBtn().click(); // mostrar
      toggleBtn().click(); // ocultar

      cy.get('#signin-password').should('have.attr', 'type', 'password');
    });
  });

  // ────────────────────────────────────────────────────────
  // GRUPO 4: Login exitoso
  // ────────────────────────────────────────────────────────
  describe('4. Login exitoso', () => {
    it('redirige a /app/home-search despues de un login exitoso', () => {
      // 1. Interceptamos la API de login con respuesta exitosa
      cy.interceptLogin();
      cy.interceptSearchHotels();

      // 2. Llenamos el formulario
      cy.get('#signin-email').type('test@example.com');
      cy.get('#signin-password').type('password123');

      // 3. Hacemos click en el boton
      cy.get('#signin-btn').click();

      // 4. Esperamos que la peticion se haya hecho
      cy.wait('@loginRequest');

      // 5. Verificamos la redireccion
      cy.url().should('include', '/app/home-search');
    });

    it('almacena el token en localStorage despues del login', () => {
      cy.interceptLogin();
      cy.interceptSearchHotels();

      cy.get('#signin-email').type('test@example.com');
      cy.get('#signin-password').type('password123');
      cy.get('#signin-btn').click();
      cy.wait('@loginRequest');

      // Verificamos que el token se guardo en localStorage
      cy.window().then((win) => {
        expect(win.localStorage.getItem('travelhub.access_token')).to.not.be.null;
        expect(win.localStorage.getItem('travelhub.user')).to.not.be.null;
      });
    });

    it('muestra un spinner de carga mientras se procesa el login', () => {
      // Interceptamos con un retraso de 1 segundo para poder ver el spinner
      cy.intercept('POST', '**/api/v1/auth/login', {
        fixture: 'login-success.json',
        delay: 1000,
      }).as('loginSlow');

      cy.get('#signin-email').type('test@example.com');
      cy.get('#signin-password').type('password123');
      cy.get('#signin-btn').click();

      // El spinner debe ser visible durante la carga
      cy.get('#signin-loading').should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // GRUPO 5: Manejo de errores
  // ────────────────────────────────────────────────────────
  describe('5. Manejo de errores', () => {
    it('muestra mensaje de error con credenciales invalidas (HTTP 401)', () => {
      // Interceptamos con respuesta 401
      cy.intercept('POST', '**/api/v1/auth/login', {
        statusCode: 401,
        fixture: 'login-invalid.json',
      }).as('loginFailed');

      cy.get('#signin-email').type('wrong@example.com');
      cy.get('#signin-password').type('wrongpass');
      cy.get('#signin-btn').click();

      cy.wait('@loginFailed');

      // Debe aparecer un mensaje de error en rojo
      cy.get('.text-error-500').should('be.visible');
    });

    it('muestra mensaje de error cuando hay fallo de red', () => {
      // Simulamos un error de red (el servidor no responde)
      cy.intercept('POST', '**/api/v1/auth/login', {
        forceNetworkError: true,
      }).as('loginNetworkError');

      cy.get('#signin-email').type('test@example.com');
      cy.get('#signin-password').type('password123');
      cy.get('#signin-btn').click();

      cy.wait('@loginNetworkError');

      cy.get('.text-error-500').should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // GRUPO 6: Redireccion con redirectTo
  // ────────────────────────────────────────────────────────
  describe('6. Redireccion post-login', () => {
    it('redirige a la URL guardada en redirectTo despues del login', () => {
      cy.interceptLogin();
      cy.interceptSearchHotels();

      // Visitamos /login con un redirectTo hacia search-results
      cy.visit('/login?redirectTo=%2Fapp%2Fsearch-results');

      cy.get('#signin-email').type('test@example.com');
      cy.get('#signin-password').type('password123');
      cy.get('#signin-btn').click();

      cy.wait('@loginRequest');

      // Debe redirigir a search-results, no a home-search
      cy.url().should('include', '/app/search-results');
    });
  });
});
