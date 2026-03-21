# TravelHub – Plataforma de Reservas Hoteleras

## ¿Qué es este repositorio?

Este repositorio contiene la implementación (o parte de ella) del sistema **TravelHub**, una plataforma digital de reservas de hospedaje y tours que conecta hoteles, agencias y viajeros en Latinoamérica.

El sistema busca resolver problemas de:
- Alta latencia en búsquedas (3–5s actuales)
- Overbooking por inconsistencias de inventario
- Acoplamiento en pagos
- Baja escalabilidad y disponibilidad

---

## ¿Para qué existe?

Este repositorio existe para:

- Implementar una arquitectura moderna basada en microservicios
- Validar decisiones arquitectónicas mediante experimentos (ASR-driven)
- Cumplir requisitos de rendimiento, escalabilidad y seguridad
- Reducir abandono de carrito y mejorar conversión

---

## ¿Cómo correr el proyecto?

⚠️ Este repositorio puede depender de múltiples servicios.

Ver:
👉 `docs/runbooks/local-setup.md`

---

## ¿Cómo probarlo?

Las pruebas incluyen:

- Pruebas de concurrencia (JMeter)
- Validación de ASRs:
  - Creación de reserva ≤ 1.5s
  - Búsqueda ≤ 800ms
  - Disponibilidad ≤ 200ms

Ver:
👉 `docs/architecture/data-flow-main-scenarios.md`

---

## Arquitectura

Documentación principal:

- Bounded Contexts:
  👉 `docs/architecture/bounded-contexts.md`

- Flujos principales:
  👉 `docs/architecture/data-flow-main-scenarios.md`

- Decisiones arquitectónicas:
  👉 `docs/adr/ADR-INDEX.md`

---

## ADR (Architectural Decision Records)

Las decisiones arquitectónicas se encuentran en:

👉 `docs/adr/`

Incluyen decisiones como:
- Uso de Redis para locking distribuido
- Uso de mensajería asíncrona para pagos
- Separación de microservicios

---

## Repositorios relacionados

⚠️ Este sistema es distribuido. Puede estar compuesto por:

- Frontend Web (Angular)
- Backend (.NET / Python microservices)
- App móvil
- Infraestructura (AWS / Azure)

---

## Estado del proyecto

Proyecto académico MISO – Universidad de los Andes  
Enfocado en validación arquitectónica y prototipo funcional.

---

## Autoría

Equipo de proyecto – MISO