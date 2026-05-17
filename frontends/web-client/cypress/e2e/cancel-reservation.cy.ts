// ============================================================
// FLUJO E2E #7: CANCELACION DE RESERVA (sprint3)
// ============================================================
// Cubre la pagina /app/cancelar-reserva:
//   - Recibe los datos por query params desde Mis Reservas
//   - Lee la lista de estados, encuentra el "Cancelada", PUT /reservas/:id
//   - Envia email de cancelacion via EmailJS (template_8yp6uod)
//   - Crea log de notificacion para auditoria
//   - Redirige a /app/mis-reservas
//
// HU cubierta: Cancelacion de reserva.

describe('Flujo E2E #7: Cancelacion de reserva', () => {
  // Construimos el URL con todos los query params que el componente
  // espera; el componente NO hace GET al backend, lee TODO de la URL.
  const cancelUrl =
    '/app/cancelar-reserva?id=res-001' +
    '&hotelName=Hotel%20Tequendama' +
    '&roomType=Habitacion%20Doble' +
    '&location=Bogota,%20Colombia' +
    '&checkIn=2027-01-15' +
    '&checkOut=2027-01-20' +
    '&guests=2' +
    '&nights=5' +
    '&roomRate=120' +
    '&taxes=0' +
    '&total=600' +
    '&guestEmail=cypress@test.com' +
    '&guestName=Cypress%20Tester';

  beforeEach(() => {
    cy.interceptCancellationCycle();
    cy.loginByToken();
  });

  // ────────────────────────────────────────────────────────
  // PARTE A: Navegacion y render
  // ────────────────────────────────────────────────────────
  describe('A. Llegada a la pagina', () => {
    it('A.1 navegacion desde Mis Reservas pasa los query params correctos', () => {
      cy.interceptMyReservationsCycle();
      cy.visit('/app/mis-reservas');
      cy.wait('@getMyReservas');

      // Filtrar a Upcoming para tener confirmadas
      cy.contains('button', /Upcoming|Pr.ximas/i).click();
      // Dentro del article de res-001 buscamos el boton "Cancel"/"Cancelar"
      // con tolerancia a whitespace alrededor del texto.
      cy.contains('article', 'res-001')
        .find('button')
        .contains(/^\s*(Cancel|Cancelar)\s*$/i)
        .click();

      cy.url().should('include', '/app/cancelar-reserva');
      cy.url().should('include', 'id=res-001');
      cy.url().should('include', 'guestEmail=');
      cy.url().should('include', 'total=');
    });

    it('A.2 la pagina renderiza el resumen leido del query param', () => {
      cy.visit(cancelUrl);

      cy.get('app-cancel-reservation-page').should('exist');
      cy.contains('Hotel Tequendama').should('be.visible');
      cy.contains('res-001').should('be.visible');
      // 2 huespedes, 5 noches segun el URL
      cy.contains(/2.*5.*nights|2.*5.*noches|2.*5.*noites/i).should('exist');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE B: Validaciones de la razon
  // ────────────────────────────────────────────────────────
  describe('B. Razon obligatoria', () => {
    it('B.1 boton "Confirm Cancellation" deshabilitado sin razon seleccionada', () => {
      cy.visit(cancelUrl);

      cy.contains(
        'button',
        /Confirm Cancellation|Confirmar Cancelaci.n|Confirmar Cancelamento/i,
      ).should('be.disabled');
    });

    it('B.2 al seleccionar una razon el boton se habilita', () => {
      cy.visit(cancelUrl);

      cy.fillCancellationForm({ reason: 'travel_plans' });

      cy.contains(
        'button',
        /Confirm Cancellation|Confirmar Cancelaci.n|Confirmar Cancelamento/i,
      ).should('not.be.disabled');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE C: Submit exitoso
  // ────────────────────────────────────────────────────────
  describe('C. Cancelacion exitosa', () => {
    it('C.1 click confirma → PUT /reservas con id_estado=e004 → redirect a /app/mis-reservas', () => {
      cy.visit(cancelUrl);

      cy.fillCancellationForm({ reason: 'emergency' });

      cy.contains(
        'button',
        /Confirm Cancellation|Confirmar Cancelaci.n|Confirmar Cancelamento/i,
      ).click();

      // Cadena: getEstados → updateReserva → getNotificaciones → sendEmailJs → createNotificacion
      cy.wait('@getEstados');
      cy.wait('@updateReserva').then(({ request }) => {
        // El componente busca el estado cuyo nombre normalizado contiene "cancel"
        // En estados.json: e004 = "Cancelada"
        expect(request.body.id_estado).to.equal('e004');
      });
      cy.wait('@getNotificaciones');
      cy.wait('@sendEmailJs');
      cy.wait('@createNotificacion');

      cy.url({ timeout: 10000 }).should('include', '/app/mis-reservas');
    });

    it('C.2 el payload del email a EmailJS incluye reservation_id, hotel_name y reason', () => {
      cy.visit(cancelUrl);
      cy.fillCancellationForm({ reason: 'work' });

      cy.contains(
        'button',
        /Confirm Cancellation|Confirmar Cancelaci.n|Confirmar Cancelamento/i,
      ).click();

      cy.wait('@sendEmailJs').then(({ request }) => {
        // Validamos el template_id de cancelacion (template_8yp6uod)
        expect(request.body.template_id).to.equal('template_8yp6uod');
        const params = request.body.template_params;
        expect(params.reservation_id).to.equal('res-001');
        expect(params.hotel_name).to.equal('Hotel Tequendama');
        expect(params.cancellation_reason).to.equal('work');
        expect(params.to_email).to.equal('cypress@test.com');
      });
    });

    it('C.3 el log de auditoria (POST /notificaciones) referencia la reserva cancelada', () => {
      cy.visit(cancelUrl);
      cy.fillCancellationForm({ reason: 'health' });

      cy.contains(
        'button',
        /Confirm Cancellation|Confirmar Cancelaci.n|Confirmar Cancelamento/i,
      ).click();

      cy.wait('@createNotificacion').then(({ request }) => {
        expect(request.body.titulo).to.equal('cancelacion');
        expect(request.body.id_reserva).to.equal('res-001');
        expect(request.body.descripcion).to.match(/res-001/);
      });
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE D: Idempotencia y errores
  // ────────────────────────────────────────────────────────
  describe('D. Idempotencia y errores', () => {
    it('D.1 si ya existe una notificacion previa NO envia el email y redirige', () => {
      // Sobrescribimos getNotificaciones para devolver una notificacion existente
      cy.intercept('GET', '**/api/v1/reservas/*/notificaciones*', {
        statusCode: 200,
        body: [{ id: 'notif-prev', titulo: 'cancelacion', id_reserva: 'res-001' }],
      }).as('getNotificacionesExisting');

      // Bloqueamos cualquier intento de envio de email para garantizar que no ocurre
      let emailRequests = 0;
      cy.intercept('POST', 'https://api.emailjs.com/api/v1.0/email/send', (req) => {
        emailRequests += 1;
        req.reply({ statusCode: 200, body: 'OK' });
      });

      cy.visit(cancelUrl);
      cy.fillCancellationForm({ reason: 'other' });
      cy.contains(
        'button',
        /Confirm Cancellation|Confirmar Cancelaci.n|Confirmar Cancelamento/i,
      ).click();

      cy.wait('@updateReserva');
      cy.wait('@getNotificacionesExisting');

      cy.url({ timeout: 10000 }).should('include', '/app/mis-reservas');

      cy.then(() => {
        expect(emailRequests, 'no se envia email cuando ya existe notificacion previa').to.equal(0);
      });
    });

    it('D.2 PUT 500 muestra mensaje de error y NO redirige', () => {
      cy.intercept('PUT', '**/api/v1/reservas/*', {
        statusCode: 500,
        body: { error: 'Failed to cancel reservation. Please try again.' },
      }).as('updateReservaError');

      cy.visit(cancelUrl);
      cy.fillCancellationForm({ reason: 'travel_plans' });

      cy.contains(
        'button',
        /Confirm Cancellation|Confirmar Cancelaci.n|Confirmar Cancelamento/i,
      ).click();

      cy.wait('@updateReservaError');
      cy.contains(/Failed to cancel reservation/i).should('be.visible');
      cy.url().should('include', '/app/cancelar-reserva');
    });
  });
});
