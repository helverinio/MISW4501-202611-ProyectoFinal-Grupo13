// ============================================================
// FLUJO E2E #6: MIS RESERVAS (sprint3)
// ============================================================
// Cubre la pagina /app/mis-reservas:
//   - Listado de reservas con lookups (hotel, ciudad, pais, usuario, comentarios)
//   - Filtros por estado (all / upcoming / past / cancelled)
//   - Busqueda por texto
//   - Paginacion (4 por pagina)
//   - Acciones contextuales por estado
//   - Status badges con colores correctos
//
// Fixture mis-reservas.json contiene 6 reservas (resoluciones esperadas):
//   res-001  fechas FUTURAS  + e001 (Confirmada)  → confirmed
//   res-002  fechas FUTURAS  + e001 (Confirmada)  → confirmed
//   res-003  fechas FUTURAS  + e002 (Pendiente)   → pending
//   res-004  fechas PASADAS  + e001 (Confirmada)  → completed (sin review)
//   res-005  fechas PASADAS  + e001 (Confirmada)  → completed (con review previa)
//   res-006  fechas PASADAS  + e004 (Cancelada)   → cancelled

describe('Flujo E2E #6: Mis Reservas', () => {
  beforeEach(() => {
    cy.interceptMyReservationsCycle();
    cy.loginByToken();
  });

  // ────────────────────────────────────────────────────────
  // PARTE A: Auth y carga inicial
  // ────────────────────────────────────────────────────────
  describe('A. Autenticacion y carga inicial', () => {
    it('A.1 sin token redirige a /login (authGuard)', () => {
      cy.clearAuthState();
      cy.visit('/app/mis-reservas', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('A.2 con token autenticado pinta el listado de reservas', () => {
      cy.visit('/app/mis-reservas');
      cy.wait('@getMyReservas');
      cy.wait('@getEstados');

      cy.get('app-my-reservations-page').should('exist');
      // Hay 4 cards visibles en la primera pagina (pageSize=4)
      cy.get('app-my-reservations-page article').should('have.length', 4);
    });

    it('A.3 muestra el titulo "My Reservations" / "Mis Reservas"', () => {
      cy.visit('/app/mis-reservas');
      cy.wait('@getMyReservas');
      cy.contains(/My Reservations|Mis Reservas|Minhas Reservas/i).should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE B: Filtros por estado (tabs)
  // ────────────────────────────────────────────────────────
  describe('B. Filtros por estado', () => {
    beforeEach(() => {
      cy.visit('/app/mis-reservas');
      cy.wait('@getMyReservas');
    });

    it('B.1 tab "Upcoming" muestra solo confirmed + pending (3 reservas)', () => {
      cy.contains('button', /Upcoming|Pr.ximas/i).click();
      cy.get('app-my-reservations-page article').should('have.length', 3);
    });

    it('B.2 tab "Past" muestra solo completed (2 reservas)', () => {
      cy.contains('button', /^Past$|Pasadas|Anteriores/i).click();
      cy.get('app-my-reservations-page article').should('have.length', 2);
    });

    it('B.3 tab "Cancelled" muestra solo cancelled (1 reserva)', () => {
      cy.contains('button', /Cancelled|Canceladas/i).click();
      cy.get('app-my-reservations-page article').should('have.length', 1);
      cy.contains('res-006').should('be.visible');
    });

    it('B.4 tab "All Reservations" vuelve a mostrar todas (paginadas en 4)', () => {
      cy.contains('button', /Cancelled|Canceladas/i).click();
      cy.contains('button', /All Reservations|Todas las reservas|Todas as reservas/i).click();
      cy.get('app-my-reservations-page article').should('have.length', 4);
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE C: Busqueda por texto
  // ────────────────────────────────────────────────────────
  describe('C. Busqueda', () => {
    it('C.1 buscar por id de reserva filtra a la card que coincida', () => {
      cy.visit('/app/mis-reservas');
      cy.wait('@getMyReservas');

      cy.get('input[placeholder*="Search"], input[placeholder*="Buscar"]').type('res-003');

      cy.get('app-my-reservations-page article').should('have.length', 1);
      cy.contains('res-003').should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE D: Paginacion
  // ────────────────────────────────────────────────────────
  describe('D. Paginacion', () => {
    it('D.1 con 6 reservas y pageSize=4 hay 2 paginas con botones numerados', () => {
      cy.visit('/app/mis-reservas');
      cy.wait('@getMyReservas');

      // Botones de pagina 1 y 2
      cy.contains('button', '1').should('be.visible');
      cy.contains('button', '2').should('be.visible');
    });

    it('D.2 click en pagina 2 muestra las reservas restantes (2)', () => {
      cy.visit('/app/mis-reservas');
      cy.wait('@getMyReservas');

      cy.contains('button', '2').click();
      cy.get('app-my-reservations-page article').should('have.length', 2);
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE E: Acciones contextuales por estado
  // ────────────────────────────────────────────────────────
  describe('E. Acciones contextuales', () => {
    beforeEach(() => {
      cy.visit('/app/mis-reservas');
      cy.wait('@getMyReservas');
    });

    it('E.1 reserva confirmed muestra botones "Cancel" y "Modify"', () => {
      // Filtramos a Upcoming para tener solo confirmed/pending
      cy.contains('button', /Upcoming|Pr.ximas/i).click();
      // Buscamos la card de res-001 (confirmed)
      cy.contains('article', 'res-001').within(() => {
        cy.contains('button', /Cancel|Cancelar/i).should('be.visible');
        cy.contains('button', /Modify|Modificar/i).should('be.visible');
      });
    });

    it('E.2 reserva completed sin reseña previa muestra "Rate Stay"', () => {
      cy.contains('button', /^Past$|Pasadas|Anteriores/i).click();
      cy.contains('article', 'res-004').within(() => {
        cy.contains('button', /Rate Stay|Calificar estancia|Avaliar estadia/i).should('be.visible');
      });
    });

    it('E.3 reserva completed CON reseña previa NO muestra "Rate Stay"', () => {
      cy.contains('button', /^Past$|Pasadas|Anteriores/i).click();
      cy.contains('article', 'res-005').within(() => {
        cy.contains('button', /Rate Stay|Calificar estancia|Avaliar estadia/i).should('not.exist');
      });
    });

    it('E.4 reserva cancelled muestra "Refunded" en lugar del Total', () => {
      cy.contains('button', /Cancelled|Canceladas/i).click();
      cy.contains('article', 'res-006').within(() => {
        cy.contains(/Refunded|Reembolsada/i).should('be.visible');
      });
    });

    it('E.5 click en "View Details" navega al detalle del hotel con query params', () => {
      cy.contains('article', 'res-001').within(() => {
        cy.contains('button', /View Details|Ver detalle|Ver detalhes/i).click();
      });

      cy.url().should('include', '/app/hoteles/');
      cy.url().should('include', 'fecha_ingreso=');
      cy.url().should('include', 'nro_personas=');
    });
  });
});
