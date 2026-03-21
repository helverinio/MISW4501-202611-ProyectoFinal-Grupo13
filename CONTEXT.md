# TravelHub - Plataforma de Reservas Hoteleras

## 📌 Contexto del Proyecto

TravelHub es una plataforma digital de reservas de hospedaje y tours con presencia en múltiples países de Latinoamérica (Colombia, Perú, Ecuador, México, Chile y Argentina).  

La plataforma conecta:

- Hoteles y hospedajes (~1200 propiedades)
- Agencias de viaje (~350)
- Operadores turísticos (~180)
- Viajeros finales (~450,000 usuarios activos)

Actualmente procesa alrededor de:

- ~18,000 reservas mensuales
- ~150 transacciones por minuto (hasta 800 TPM en picos)

El sistema actual presenta múltiples problemas:

- Alta latencia en búsquedas (3-5 segundos)
- Overbooking por falta de sincronización en inventario
- Sistema de pagos acoplado (fallas impactan todo el sistema)
- Baja escalabilidad (base de datos centralizada)
- Incumplimiento parcial de estándares de seguridad (PCI-DSS)
- Alta tasa de abandono (25-30%)

Estos problemas afectan directamente ingresos, experiencia de usuario y confiabilidad del sistema.

---

## 🎯 Objetivo del Proyecto

Diseñar e implementar una **arquitectura moderna, distribuida y resiliente** que permita:

- Reducir la latencia del sistema
- Eliminar el overbooking
- Escalar horizontalmente ante picos de tráfico
- Desacoplar completamente los pagos
- Cumplir con estándares de seguridad (PCI-DSS, GDPR)
- Mejorar la experiencia de usuario y la conversión

El objetivo de negocio es:

- Incrementar ingresos en un 25%
- Reducir costos operativos en un 15%
- Disminuir abandono de carrito al 8-10%

---

## 🧠 Contexto Arquitectónico

Este sistema está diseñado bajo principios de:

- Arquitectura de microservicios
- Comunicación síncrona (REST) y asíncrona (event-driven)
- Desacoplamiento entre dominios
- Alta disponibilidad y escalabilidad

### Dominios principales

- **Search / Availability**
- **Booking (Reservas)**
- **Payments**
- **Inventory (PMS Integration)**
- **User / Customer**
- **Notifications**

## 🛠️ Stack Tecnológico Implementado

| Capa | Tecnología |
|------|------------|
| Lenguaje | Python 3.11 |
| Framework web | Flask 3.0 |
| ORM | SQLAlchemy 2.0.23 + Flask-SQLAlchemy 3.1.1 |
| Migraciones | Flask-Migrate 4.0.4 |
| Servidor WSGI | gunicorn (workers=4, threads=4, worker-class=gthread) |
| Base de datos | PostgreSQL (una instancia por microservicio) |
| Cache / Locking | Redis (redis-py 4.6.0) |
| Message Broker | ActiveMQ via STOMP (stomp.py 8.1.0) |
| Balanceador | Nginx (modo escalado) |
| Contenedores | Docker + Docker Compose |

## 🔧 Microservicios Reales

| Servicio | Puerto | Responsabilidad |
|----------|--------|-----------------|
| `gateway` | 8081 | Reverse proxy, único punto de entrada público |
| `reservas` | 5000 | Catálogo + holds + reservas + pagos shadow + notificaciones |
| `pagos` | 5002 | Orquestación interna de pagos, lifecycle, abandonment scheduler |
| `ext-payments` | 5001 | Simulación de PSP externo (Stripe/MercadoPago) |

## 🔑 Patrones de Resiliencia Implementados

| Patrón | Servicio | Config real |
|--------|----------|-------------|
| Redis Distributed Lock | `reservas` | TTL=30s, release Lua atómico, clave: `room_hold_lock:{id}:{in}:{out}` |
| Redis Cache (holds) | `reservas` | TTL dinámico (= duration del hold, default 15 min) |
| Circuit Breaker | `reservas→pagos`, `pagos→ext-payments` | 5 fallos→OPEN, 30s→HALF_OPEN, 2 éxitos→CLOSED |
| Idempotency Guard | `pagos` | Un payment por `reservation_id` |
| Optimistic Lock | `pagos` | `UPDATE WHERE status='pendiente'` |
| Message Retry + DLQ | `reservas`, `pagos` | 3 reintentos via header, luego `/topic/PaymentStatusUpdated.DLQ` |
| Payment Abandonment | `pagos` | Scheduler cada 60s, umbral 20 min |

---

---

## ⚙️ Reglas Clave del Dominio

### 1. Reservas (Booking)

- Se usa un **carrito con hold temporal (15 minutos)**
- Solo un usuario puede reservar una habitación a la vez
- No debe existir **overbooking (0%)**
- Se utiliza control de concurrencia (lock distribuido / constraint)

---

### 2. Pagos

- Los pagos son **asíncronos**
- El sistema registra estado `PENDING`
- El procesamiento ocurre en background
- Debe existir:

  - Idempotencia (no cobros duplicados)
  - Reintentos automáticos
  - Tolerancia a fallos

---

### 3. Inventario

- Se sincroniza con sistemas externos (PMS)
- Actualización casi en tiempo real (< 2 minutos)
- Manejo de múltiples monedas

---

### 4. Experiencia de Usuario

- No se debe bloquear la UI
- Operaciones críticas deben ser rápidas y resilientes

---

## 🚀 Requisitos de Calidad (ASRs)

Estos son CRÍTICOS. Deben respetarlos:

| Operación | Objetivo |
|----------|--------|
| Búsqueda | ≤ 800 ms (p95) |
| Detalle de hotel | ≤ 500 ms |
| Disponibilidad | ≤ 200 ms (p99) |
| Crear reserva | ≤ 1.5 s |
| Pago | ≤ 3 s |

---

## 📈 Escalabilidad

- Base: 150 TPM
- Pico esperado: 800 TPM
- Usuarios concurrentes: hasta 3600
- Autoescalado horizontal requerido

---

## 🔐 Seguridad

- TLS 1.2+ obligatorio
- Encriptación AES-256 en datos sensibles
- Tokenización de tarjetas (NO almacenar tarjetas)
- Autenticación MFA para admin
- RBAC (control de acceso por roles)

---

## 🧪 Consideraciones de Implementación

- Evitar acoplamiento entre servicios
- Usar patrones como:

  - Saga
  - Outbox
  - Circuit Breaker
  - Retry con backoff
  - Idempotent Consumer

- Diseñar APIs versionadas (OpenAPI/Swagger)
- Mantener cobertura de pruebas ≥ 70%

---

## 🧩 Qué debe entender

Cuando sugieras código o cambios:

1. Este es un sistema distribuido (NO monolito)
2. La latencia es crítica
3. La concurrencia es alta
4. La consistencia es importante (especialmente en reservas y pagos)
5. Se prioriza resiliencia sobre sincronía
6. El sistema debe escalar horizontalmente
7. Los errores deben manejarse de forma controlada (no fallas en cascada)

---

## 🏗️ Filosofía del Proyecto

> “El sistema debe seguir funcionando incluso cuando partes del sistema fallen.”

Esto implica:

- Tolerancia a fallos
- Aislamiento de servicios
- Procesos asíncronos
- Observabilidad (logs, métricas, trazas)

---

## 📦 Alcance del Repositorio

Este repositorio puede contener:

- Microservicios backend (Python / Node / etc.)
- Frontend web
- Aplicación móvil
- Infraestructura como código
- Pipelines CI/CD

---

## 🧑‍💻 Nota para Desarrollo

Antes de implementar cualquier funcionalidad:

- Validar impacto en latencia
- Validar impacto en concurrencia
- Validar impacto en consistencia
- Validar impacto en seguridad

---

## ⚠️ Antipatrones a evitar

- Lógica de negocio en frontend
- Transacciones largas bloqueantes
- Acoplamiento entre servicios
- Llamadas síncronas innecesarias
- Reintentos sin control
- Falta de idempotencia

---

## 📌 Resumen

TravelHub no es solo una app de reservas.

Es un sistema distribuido de alta concurrencia que debe ser:

- Rápido ⚡
- Escalable 📈
- Seguro 🔐
- Resiliente 🛡️

---
