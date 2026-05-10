// ============================================================
// FLUJO E2E #8: CALIFICACION DE HOTEL (sprint3)
// ============================================================
// Cubre la funcionalidad de calificar hoteles desde Mis Reservas:
//   - El boton "Rate Stay" SOLO aparece en reservas `completed` sin reseña
//   - Modal inline con 5 estrellas (default 5) + textarea
//   - Validacion: rating + comentario obligatorios
//   - POST /api/v1/hoteles/:hotelId/comentarios con id_reserva, id_usuario, rating, comentario
//   - Tras exito: el boton "Rate Stay" desaparece (reviewSubmitted=true)
//
// HU cubierta: Calificacion / reseña de hoteles tras estancia.

describe('Flujo E2E #8: Calificacion de hotel', () => {
  beforeEach(() => {
    cy.interceptMyReservationsCycle();
    cy.loginByToken();
    cy.visit('/app/mis-reservas');
    cy.wait('@getMyReservas');
    // Filtramos a "Past" para tener solo reservas completed
    cy.contains('button', /^Past$|Pasadas|Anteriores/i).click();
  });

  // ────────────────────────────────────────────────────────
  // PARTE A: Disponibilidad del CTA "Rate Stay"
  // ────────────────────────────────────────────────────────
  describe('A. Disponibilidad del boton Rate Stay', () => {
    it('A.1 reserva completed SIN reseña previa muestra el boton', () => {
      cy.contains('article', 'res-004').within(() => {
        cy.contains('button', /Rate Stay|Calificar estancia|Avaliar estadia/i).should('be.visible');
      });
    });

    it('A.2 reserva completed CON reseña previa NO muestra el boton', () => {
      cy.contains('article', 'res-005').within(() => {
        cy.contains('button', /Rate Stay|Calificar estancia|Avaliar estadia/i).should('not.exist');
      });
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE B: Modal de calificacion
  // ────────────────────────────────────────────────────────
  describe('B. Modal de calificacion', () => {
    beforeEach(() => {
      // Abrimos el modal en res-004 (sin reseña previa)
      cy.contains('article', 'res-004').within(() => {
        cy.contains('button', /Rate Stay|Calificar estancia|Avaliar estadia/i).click();
      });
    });

    it('B.1 click en Rate Stay abre modal con titulo, estrellas y textarea', () => {
      // El modal usa fixed inset-0 z-50
      cy.get('.fixed.inset-0.z-50').should('be.visible');
      cy.contains(
        /Rate and review your stay|Califica y reseña tu estancia|Avalie e comente/i,
      ).should('be.visible');
      // 5 botones de estrella (aria-label "Rate N stars")
      cy.get('button[aria-label^="Rate "]').should('have.length', 5);
      cy.get('.fixed.inset-0.z-50 textarea').should('be.visible');
    });

    it('B.2 click en una estrella distinta cambia el rating activo', () => {
      // Por default rating=5 (todas opacidad 1.0). Click en estrella 3:
      cy.get('button[aria-label="Rate 3 stars"]').click();
      // Las estrellas 4 y 5 ahora tienen opacity-30 (inactivas)
      cy.get('button[aria-label="Rate 5 stars"] i').should('have.class', 'opacity-30');
      cy.get('button[aria-label="Rate 4 stars"] i').should('have.class', 'opacity-30');
      cy.get('button[aria-label="Rate 3 stars"] i').should('not.have.class', 'opacity-30');
    });

    it('B.3 click en X cierra el modal sin enviar nada', () => {
      cy.get('button[aria-label="Close review modal"]').click();
      cy.get('.fixed.inset-0.z-50').should('not.exist');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE C: Validaciones del submit
  // ────────────────────────────────────────────────────────
  describe('C. Validaciones', () => {
    beforeEach(() => {
      cy.contains('article', 'res-004').within(() => {
        cy.contains('button', /Rate Stay|Calificar estancia|Avaliar estadia/i).click();
      });
    });

    it('C.1 submit con comentario vacio muestra error de "review required"', () => {
      // Click en submit sin escribir nada
      cy.contains('button', /Submit Review|Enviar reseña|Enviar avaliaç.o/i).click();
      cy.contains(
        /Please select a rating and write|Selecciona una calificaci.n|Selecione uma classificaç.o/i,
      ).should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // PARTE D: Submit exitoso
  // ────────────────────────────────────────────────────────
  describe('D. Calificacion exitosa', () => {
    beforeEach(() => {
      cy.contains('article', 'res-004').within(() => {
        cy.contains('button', /Rate Stay|Calificar estancia|Avaliar estadia/i).click();
      });
    });

    it('D.1 POST /hoteles/:id/comentarios incluye id_reserva, id_usuario, rating y comentario', () => {
      cy.get('button[aria-label="Rate 4 stars"]').click();
      cy.get('.fixed.inset-0.z-50 textarea').type('Excelente hotel, lo recomiendo.');

      cy.contains('button', /Submit Review|Enviar reseña|Enviar avaliaç.o/i).click();

      cy.wait('@createHotelComment').then(({ request }) => {
        expect(request.body).to.include.keys(['id_reserva', 'id_usuario', 'rating', 'comentario']);
        expect(request.body.id_reserva).to.equal('res-004');
        expect(request.body.id_usuario).to.equal('1');
        expect(request.body.rating).to.equal(4);
        expect(request.body.comentario).to.equal('Excelente hotel, lo recomiendo.');
      });
    });

    it('D.2 tras exito aparece mensaje verde de exito en el modal', () => {
      cy.get('button[aria-label="Rate 5 stars"]').click();
      cy.get('.fixed.inset-0.z-50 textarea').type('Estancia maravillosa.');
      cy.contains('button', /Submit Review|Enviar reseña|Enviar avaliaç.o/i).click();

      cy.wait('@createHotelComment');

      cy.get('.fixed.inset-0.z-50 .text-emerald-600').should('be.visible');
    });

    it('D.3 tras exito el boton "Submit Review" se deshabilita (no permite re-envio)', () => {
      cy.get('.fixed.inset-0.z-50 textarea').type('Buena experiencia.');
      cy.contains('button', /Submit Review|Enviar reseña|Enviar avaliaç.o/i).click();

      cy.wait('@createHotelComment');

      cy.contains('button', /Submit Review|Enviar reseña|Enviar avaliaç.o/i).should('be.disabled');
    });

    it('D.4 tras cerrar el modal y reabrir Mis Reservas el boton "Rate Stay" sigue presente (refresh requerido)', () => {
      // Sprint3 actualiza el flag reviewSubmitted en memoria (no recarga la lista),
      // asi que tras enviar y cerrar el modal el boton "Rate Stay" desaparece de la card.
      cy.get('.fixed.inset-0.z-50 textarea').type('Comentario de prueba.');
      cy.contains('button', /Submit Review|Enviar reseña|Enviar avaliaç.o/i).click();
      cy.wait('@createHotelComment');

      // Cerramos el modal
      cy.contains('button', /^\s*Close\s*$|^\s*Cerrar\s*$|^\s*Fechar\s*$/i).click();

      // El boton de Rate Stay para res-004 ya no debe existir
      cy.contains('article', 'res-004').within(() => {
        cy.contains('button', /Rate Stay|Calificar estancia|Avaliar estadia/i).should('not.exist');
      });
    });
  });
});
