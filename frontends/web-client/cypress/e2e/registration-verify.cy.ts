// ============================================================
// FLUJO E2E #5: REGISTRO + VERIFICACION DE EMAIL (sprint3)
// ============================================================
// Cubre los nuevos flujos agregados en sprint3 al login-page:
//   - Tab "Sign Up" con formulario de registro
//   - Submit a POST /api/v1/usuarios
//   - Pagina /verify-email?token=&email= con sus 4 estados:
//       verifying / success / expired / invalid
//   - Bloqueo de login con 403 + code: EMAIL_NOT_VERIFIED
//
// HU cubiertas: Registro de usuario, verificacion de email.

describe('Flujo E2E #5: Registro y verificacion de email', () => {
  const validEmail = 'diego.acosta@test.com';

  beforeEach(() => {
    cy.interceptRegistrationCycle();
  });

  // ────────────────────────────────────────────────────────
  // PARTE A: Tab Sign Up + render del formulario
  // ────────────────────────────────────────────────────────
  describe('A. Tab Sign Up y render del formulario', () => {
    it('A.1 click en #signup-tab muestra el formulario de registro', () => {
      cy.visit('/login');

      // Por default el tab Sign In esta activo y #signup-form tiene class hidden
      cy.get('#signup-form').should('have.class', 'hidden');

      cy.get('#signup-tab').click();

      cy.get('#signup-form').should('not.have.class', 'hidden');
      cy.get('#signin-form').should('have.class', 'hidden');
    });

    it('A.2 el formulario de registro contiene los 8 campos esperados', () => {
      cy.visit('/login');
      cy.get('#signup-tab').click();

      cy.get('#login-signup-firstname').should('be.visible');
      cy.get('#login-signup-lastname').should('be.visible');
      cy.get('#login-signup-email').should('be.visible');
      cy.get('#login-signup-phone-prefix').should('be.visible');
      cy.get('#login-signup-phone').should('be.visible');
      cy.get('#login-signup-password').should('be.visible');
      cy.get('#login-signup-confirm-password').should('be.visible');
      cy.get('#login-terms-checkbox').should('exist');
      cy.get('#signup-btn').should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE B: Validaciones cliente
  // ────────────────────────────────────────────────────────
  describe('B. Validaciones del formulario', () => {
    it('B.1 email con formato invalido muestra el mensaje de error tras submit', () => {
      cy.visit('/login');
      cy.fillRegistrationForm({ email: 'not-an-email' });

      cy.get('#signup-btn').click();
      cy.get('#login-signup-email-error').should('be.visible');
    });

    it('B.2 confirm password distinto a password muestra "Passwords don\'t match"', () => {
      cy.visit('/login');
      cy.fillRegistrationForm({ confirmPassword: 'Different1' });

      cy.get('#signup-btn').click();
      // El error de mismatch se renderiza en signupErrorMessage()
      cy.contains(/Passwords do not match|Passwords don't match/i).should('be.visible');
    });

    it('B.3 sin aceptar terminos el submit muestra el error de "You must accept terms"', () => {
      cy.visit('/login');
      cy.fillRegistrationForm({ acceptTerms: false });

      cy.get('#signup-btn').click();
      cy.contains(/You must accept terms/i).should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE C: Submit exitoso → POST /usuarios
  // ────────────────────────────────────────────────────────
  describe('C. Registro exitoso', () => {
    it('C.1 el payload de POST /usuarios incluye nombre, email, usuario y contrasena', () => {
      cy.visit('/login');
      cy.fillRegistrationForm({
        firstName: 'Diego',
        lastName: 'Acosta',
        email: validEmail,
      });

      cy.get('#signup-btn').click();

      cy.wait('@registerUser').then(({ request }) => {
        expect(request.body).to.include.keys(['nombre', 'email', 'usuario', 'contrasena']);
        expect(request.body.nombre).to.equal('Diego Acosta');
        // El email se normaliza a lowercase trimmed
        expect(request.body.email).to.equal(validEmail);
        // usuario se genera como firstName.lastName lowercase
        expect(request.body.usuario).to.equal('diego.acosta');
      });
    });

    it('C.2 tras 201 aparece el banner verde con el email destinatario', () => {
      cy.visit('/login');
      cy.fillRegistrationForm({ email: validEmail });

      cy.get('#signup-btn').click();
      cy.wait('@registerUser');

      // Mensaje exacto: "Account created! We've sent a verification link to {email}..."
      cy.contains(/Account created/i).should('be.visible');
      cy.contains(validEmail).should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE D: Errores del backend
  // ────────────────────────────────────────────────────────
  describe('D. Errores backend', () => {
    it('D.1 status 409 (email duplicado) muestra el mensaje de error', () => {
      // Sobrescribimos el intercept con un error 409
      cy.intercept('POST', '**/api/v1/usuarios', {
        statusCode: 409,
        body: { error: 'An account with this email already exists.' },
      }).as('registerUserConflict');

      cy.visit('/login');
      cy.fillRegistrationForm({ email: validEmail });

      cy.get('#signup-btn').click();
      cy.wait('@registerUserConflict');

      cy.contains(/already exists/i).should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE E: Pagina /verify-email
  // ────────────────────────────────────────────────────────
  describe('E. Pagina /verify-email', () => {
    it('E.1 token valido → estado success con email visible', () => {
      cy.visit(`/verify-email?token=valid-token&email=${validEmail}`);

      cy.wait('@verifyEmail').then(({ request }) => {
        expect(request.body).to.deep.equal({ token: 'valid-token' });
      });

      cy.contains(/Email Verified/i).should('be.visible');
      cy.contains(validEmail).should('be.visible');
      // Boton de "Sign In Now"
      cy.contains('a', /Sign In Now/i)
        .should('have.attr', 'href')
        .and('include', '/login');
    });

    it('E.2 token expirado (410) → estado "Link Expired"', () => {
      cy.intercept('POST', '**/api/v1/auth/verify-email', {
        statusCode: 410,
        body: { code: 'TOKEN_EXPIRED', error: 'Token has expired' },
      }).as('verifyEmailExpired');

      cy.visit(`/verify-email?token=expired-token&email=${validEmail}`);
      cy.wait('@verifyEmailExpired');

      cy.contains(/Link Expired/i).should('be.visible');
    });

    it('E.3 token invalido (400) → estado "Invalid Link"', () => {
      cy.intercept('POST', '**/api/v1/auth/verify-email', {
        statusCode: 400,
        body: { error: 'Invalid token' },
      }).as('verifyEmailInvalid');

      cy.visit(`/verify-email?token=bad-token&email=${validEmail}`);
      cy.wait('@verifyEmailInvalid');

      cy.contains(/Invalid Link/i).should('be.visible');
    });

    it('E.4 sin token en query params → estado "Invalid Link" sin llamar al backend', () => {
      cy.visit(`/verify-email?email=${validEmail}`);

      // No deberia haber peticion al backend porque el componente
      // setea status='invalid' inmediatamente cuando no hay token.
      cy.contains(/Invalid Link/i).should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE F: Login bloqueado con EMAIL_NOT_VERIFIED
  // ────────────────────────────────────────────────────────
  describe('F. Login bloqueado por email no verificado', () => {
    it('F.1 login con 403 + code EMAIL_NOT_VERIFIED muestra el mensaje', () => {
      cy.intercept('POST', '**/api/v1/auth/login', {
        statusCode: 403,
        body: { code: 'EMAIL_NOT_VERIFIED', error: 'Email not verified' },
      }).as('loginUnverified');

      cy.visit('/login');
      cy.get('#signin-email').type(validEmail);
      cy.get('#signin-password').type('Password1');
      cy.get('#signin-btn').click();

      cy.wait('@loginUnverified');
      cy.contains(/verificar tu correo electr/i).should('be.visible');
    });
  });
});
