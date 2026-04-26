// ============================================================
// FLUJO E2E #4: SINCRONIZACION DE INVENTARIO (cobertura parcial)
// ============================================================
// Este archivo prueba SOLO la parte observable desde el webclient del
// flujo "Sincronizacion de Inventario via Webhook PMS".
//
// ⚠️ ALCANCE:
//   El flujo completo es BACKEND-CENTRIC:
//     1. El PMS del hotel envia un webhook al backend indicando que el
//        hotel quedo lleno o una habitacion ya no esta disponible.
//     2. El backend actualiza su estado y/o base de datos.
//     3. El siguiente consumo de la API de busqueda refleja ese cambio.
//
//   El webclient NO dispara el webhook ni se suscribe a eventos
//   WebSocket/SSE; solo re-consume la API cuando el usuario hace una
//   nueva busqueda o recarga. Por lo tanto, esta suite solo prueba que
//   la UI reacciona correctamente cuando el backend responde con
//   disponibilidad CERO o reducida — lo cual es el efecto observable
//   de una sincronizacion de inventario exitosa.
//
//   Lo que NO se cubre aqui (y requiere pruebas de integracion backend):
//     - Recepcion e idempotencia del webhook.
//     - Condiciones de race entre webhook y reservas concurrentes.
//     - Consistencia entre holds activos e inventario PMS.
//
// Historias de usuario relacionadas (criterios del backlog):
//   HU-W-17       "La informacion de disponibilidad debe provenir de
//                 datos sincronizados casi en tiempo real con los
//                 sistemas PMS integrados por la plataforma."
//   HU-W-17       "Los resultados deben excluir habitaciones que ya esten
//                 comprometidas por reservas confirmadas o por holds
//                 activos para el mismo rango de fechas."

describe('Flujo E2E #4: Sincronizacion de inventario (parcial)', () => {
  const searchUrl =
    '/app/search-results?busqueda=Bogota&fecha_ingreso=2026-04-10' +
    '&fecha_salida=2026-04-15&nro_personas=2';

  beforeEach(() => {
    cy.loginByToken();
  });

  // ────────────────────────────────────────────────────────
  // A. Inventario reducido en una nueva busqueda
  // ────────────────────────────────────────────────────────
  describe('A. El frontend refleja cambios de inventario al re-buscar', () => {
    it('A.1 primera busqueda: hotel disponible con habitaciones', () => {
      cy.interceptSearchHotels('search-results.json');

      cy.visit(searchUrl);
      cy.wait('@searchHotelsRequest');

      cy.get('#hotel-cards app-hotel-result-card').should('have.length.at.least', 1);
    });

    it('A.2 tras webhook PMS: nueva busqueda muestra estado "sin disponibilidad"', () => {
      // Simulamos que tras el webhook, el backend responde con 0 habitaciones
      // disponibles. El frontend puede:
      //  (a) Renderizar el hotel con precio $0 (no reservable)
      //  (b) Renderizar un componente vacio (app-search-results-empty)
      //  (c) Sprint2: renderizar la card pero SIN selector app-hotel-result-card
      //      (ej. en una vista alternativa). Lo que importa es que
      //      ningun listado mostrar precio > 0.
      cy.interceptSearchHotels('search-results-no-availability.json');

      cy.visit(searchUrl);
      cy.wait('@searchHotelsRequest');

      // Aserciones laxas: a nivel de page no debe aparecer un precio > 0
      // ni un boton "Reservar ahora" habilitado para este hotel.
      // Verificamos al menos UNA de estas condiciones:
      //   - Texto "$0" / "0,00" / "0.00" presente
      //   - Texto "sin habitacion" / "no rooms" / "sem quarto"
      //   - Texto "no disponible" / "not available" / "indisponivel"
      //   - O bien el componente app-search-results-empty existe
      cy.get('body').then(($body) => {
        const text = $body.text();
        const hasZeroPrice = /\$\s*0[.,]\s*0{1,2}\b|US\$\s*0\b/i.test(text);
        const hasUnavailable =
          /sin habitacion|no rooms|sem quarto|0 habitacion|no disponible|not available|indisponivel/i.test(
            text,
          );
        const emptyComponent = $body.find('app-search-results-empty').length > 0;

        expect(
          hasZeroPrice || hasUnavailable || emptyComponent,
          'la pagina debe indicar de alguna forma que no hay disponibilidad',
        ).to.be.true;
      });
    });

    it('A.3 cambiar destino y re-buscar dispara una nueva peticion a buscar-disponibles', () => {
      // Demostramos que el frontend re-consulta la API (no cachea agresivamente).
      // Cada navegacion a /app/search-results con query params distintos dispara
      // un nuevo POST, que es el mecanismo por el cual el webclient "ve" los
      // cambios sincronizados desde el PMS.
      cy.interceptSearchHotels('search-results.json');

      cy.visit(searchUrl);
      cy.wait('@searchHotelsRequest');

      // Cambiamos la URL para simular nueva busqueda (otro destino)
      cy.visit(
        '/app/search-results?busqueda=Medellin&fecha_ingreso=2026-04-10' +
          '&fecha_salida=2026-04-15&nro_personas=2',
      );
      cy.wait('@searchHotelsRequest');

      // El segundo wait confirma que el endpoint se volvio a llamar
      cy.get('@searchHotelsRequest.all').should('have.length', 2);
    });

    it('A.4 una segunda busqueda tras webhook muestra inventario reducido (escenario dinamico)', () => {
      // Simulamos el flujo completo: una primera busqueda devuelve hoteles,
      // luego el PMS dispara un webhook, y una segunda busqueda devuelve
      // disponibilidad cero. Este escenario es MAS realista que A.2 porque
      // prueba la transicion, no solo el estado final.
      let requestCount = 0;
      cy.intercept('POST', '**/api/v1/hoteles/buscar-disponibles', (req) => {
        requestCount += 1;
        req.reply({
          fixture:
            requestCount === 1 ? 'search-results.json' : 'search-results-no-availability.json',
        });
      }).as('dynamicSearch');

      // Primera busqueda: backend con inventario
      cy.visit(searchUrl);
      cy.wait('@dynamicSearch');
      cy.get('#hotel-cards app-hotel-result-card').should('have.length.at.least', 1);

      // "El PMS envia un webhook al backend" — simulado cambiando el fixture servido.
      // Recargar la pagina fuerza una nueva consulta a buscar-disponibles.
      cy.reload();
      cy.wait('@dynamicSearch');

      // Ahora la UI debe reflejar la disponibilidad cero. Dependiendo del
      // comportamiento del componente, el hotel puede filtrarse o mostrarse
      // con un estado especial.
      cy.get('body').then(($body) => {
        const hotelCards = $body.find('#hotel-cards app-hotel-result-card');
        if (hotelCards.length > 0) {
          cy.get('#hotel-cards app-hotel-result-card')
            .first()
            .within(() => {
              cy.contains(
                /\$\s*0[.,]?0?0?|0\s*rooms?|sin habitacion|sem quarto|no rooms|0 habitacion/i,
              ).should('exist');
            });
        } else {
          cy.get('app-search-results-empty').should('exist');
        }
      });
    });
  });

  // ────────────────────────────────────────────────────────
  // B. Consistencia: detalle de hotel ante cambios de inventario
  // ────────────────────────────────────────────────────────
  describe('B. Detalle de hotel respeta disponibilidad sincronizada', () => {
    it('B.1 si el hotel no tiene habitaciones (post-webhook) muestra mensaje "no rooms"', () => {
      // Mockeamos los endpoints del detalle con respuestas vacias.
      // IMPORTANTE: el detalle tambien dispara POST /buscar-disponibles
      // para obtener precios. Sin el intercept, la peticion real devuelve
      // 401 (token de Cypress es falso) y el interceptor HTTP redirige a
      // /login antes de que el componente pinte el mensaje "no rooms".
      cy.intercept('GET', '**/api/v1/hoteles/h*', { fixture: 'hotel-by-id.json' }).as(
        'getHotelById',
      );
      cy.intercept('GET', '**/api/v1/hoteles/*/habitaciones', {
        statusCode: 200,
        body: [],
      }).as('getHotelRoomsEmpty');
      cy.intercept('POST', '**/api/v1/hoteles/buscar-disponibles', {
        fixture: 'search-results-no-availability.json',
      }).as('searchEmpty');

      cy.visit(
        '/app/hoteles/h001?busqueda=Bogota&fecha_ingreso=2026-04-10' +
          '&fecha_salida=2026-04-15&nro_personas=2',
      );
      cy.wait(['@getHotelById', '@getHotelRoomsEmpty']);

      cy.contains(/no rooms|no hay habitaciones|nao ha quartos/i).should('be.visible');
    });
  });

  // ────────────────────────────────────────────────────────
  // C. LIMITACION DOCUMENTADA: webhooks no son testeables E2E desde el web
  // ────────────────────────────────────────────────────────
  //
  // No implementamos tests para los siguientes escenarios porque requieren
  // infraestructura fuera del alcance del webclient:
  //
  //   - Verificar que el backend recibe el webhook con la firma/token correcto.
  //   - Validar idempotencia (mismo webhook enviado 2 veces produce 1 efecto).
  //   - Reaccion a eventos push en tiempo real sin recarga del cliente.
  //   - Concurrencia entre un hold activo y un webhook de "hotel lleno".
  //
  // Estas pruebas DEBEN vivir en el proyecto de pruebas del backend, no aqui.
});
