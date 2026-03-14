# Evidencia de Prueba: Payment Abandonment Test Flow

## Información General

| Campo | Valor |
|-------|-------|
| **Fecha de Ejecución** | 14 de Marzo de 2026 |
| **Hora de Inicio** | 15:29:57 UTC |
| **Hora de Finalización** | 15:50:42 UTC |
| **Duración Total** | ~21 minutos |
| **Resultado** | ✅ **EXITOSO** |
| **Ambiente** | Docker Compose (Escalado) |

## Objetivo de la Prueba

Verificar que los pagos en estado `pendiente` se marcan automáticamente como `abandonado` después del tiempo configurado (`stale_minutes=20`).

## Configuración del Sistema

| Servicio | Instancias | Puerto |
|----------|------------|--------|
| nginx | 1 | 80 (8081 externo) |
| gateway | 3 | 8080 |
| reservas | 3 | 5000 |
| pagos | 1 | 5002 |
| ext-payments | 1 | 5001 |
| redis | 1 | 6379 |
| activemq | 1 | 61616 |

**Parámetros del Scheduler de Abandono:**
- `check_interval`: 60 segundos
- `stale_minutes`: 20 minutos

---

## Ejecución de Pasos

### Paso 1: Acquire Room Hold

**Request:**
```
POST /api/v1/habitaciones/ca1efcda-dd53-4645-a610-f1d4278c12c5/hold
```

**Payload:**
```json
{
    "id_usuario": "test-user-abandonment-001",
    "fecha_ingreso": "2026-03-19T19:00:00.000Z",
    "fecha_salida": "2026-03-20T16:00:00.000Z",
    "hold_duration_minutes": 30
}
```

**Resultado:**
| Campo | Valor |
|-------|-------|
| **Timestamp** | 2026-03-14 15:29:57 |
| **HTTP Status** | 201 Created |
| **Hold ID** | `0b640932-58ea-4e98-af79-2078bf707e4a` |
| **Tiempo de Respuesta** | 0.083s |

**Logs relevantes:**
```
[RESERVAS] INFO - [REDIS_LOCK] Lock acquired: room_hold_lock:ca1efcda-dd53-4645-a610-f1d4278c12c5:2026-03-19:2026-03-20 (attempt 1)
[RESERVAS] INFO - [RESERVAS] Hold acquired: 0b640932-58ea-4e98-af79-2078bf707e4a for room ca1efcda-dd53-4645-a610-f1d4278c12c5 by user test-user-abandonment-001
[RESERVAS] INFO - [REDIS_CACHE] Hold cached: room_hold_cache:ca1efcda-dd53-4645-a610-f1d4278c12c5:2026-03-19:2026-03-20 (TTL: 1799s)
[RESERVAS] INFO - [REDIS_LOCK] Lock released
```

✅ **Test Passed:** Room hold acquired successfully

---

### Paso 2: Create Reservation

**Request:**
```
POST /api/v1/reservas
```

**Payload:**
```json
{
    "fecha_ingreso": "2026-03-19T19:00:00.000Z",
    "fecha_salida": "2026-03-20T16:00:00.000Z",
    "total": 150.00,
    "nro_personas": 2,
    "id_usuario": "test-user-abandonment-001",
    "id_pais": "b50da626-7885-4574-b66d-cb6f301c94cf",
    "id_habitacion": "ca1efcda-dd53-4645-a610-f1d4278c12c5",
    "id_estado": "f107d922-218a-456d-82e2-95505194765d",
    "payment_method": "card"
}
```

**Resultado:**
| Campo | Valor |
|-------|-------|
| **Timestamp** | 2026-03-14 15:30:03 |
| **HTTP Status** | 201 Created |
| **Reservation ID** | `898cf21b-65fb-45e8-8f40-fe8f51cc9ee3` |
| **Payment ID** | `fb91292d-8db7-4d87-b43a-24b8f7614aad` |
| **Payment Status Inicial** | `pendiente` |
| **Tiempo de Respuesta** | 0.258s |

**Flujo de comunicación entre servicios:**
```
reservas-2 → pagos (POST /api/v1/payments) → 201
pagos → ext-payments (POST /api/v1/payment-intents) → 201
```

**Logs relevantes:**
```
[RESERVAS] INFO - [REDIS_LOCK] Lock acquired for reservation creation on room ca1efcda-dd53-4645-a610-f1d4278c12c5
[RESERVAS] INFO - Reserva created: 898cf21b-65fb-45e8-8f40-fe8f51cc9ee3, now registering payment...
[RESERVAS] INFO - Hold 0b640932-58ea-4e98-af79-2078bf707e4a released after reservation creation
[PAGOS] INFO - >>> Calling ext-payments: POST http://ext-payments:5001/api/v1/payment-intents
[PAGOS] INFO - <<< ext-payments responded: 201
[RESERVAS] INFO - Payment registered with status: pendiente
```

✅ **Test Passed:** Reservation created with payment in `pendiente` status

---

### Paso 3: Verify Initial Reservation Status

**Request:**
```
GET /api/v1/reservas/898cf21b-65fb-45e8-8f40-fe8f51cc9ee3
```

**Resultado:**
| Campo | Valor |
|-------|-------|
| **Timestamp** | 2026-03-14 15:30:08 |
| **HTTP Status** | 200 OK |
| **Tiempo de Respuesta** | 0.081s |

✅ **Test Passed:** Reservation retrieved successfully

---

### Paso 4: Verify Initial Payment Status (pendiente)

**Request:**
```
GET /api/v1/payments/fb91292d-8db7-4d87-b43a-24b8f7614aad
```

**Resultado:**
| Campo | Valor |
|-------|-------|
| **Timestamp** | 2026-03-14 15:30:15 |
| **HTTP Status** | 200 OK |
| **Payment Status** | `pendiente` |
| **Tiempo de Respuesta** | 0.004s |

✅ **Test Passed:** Payment status is `pendiente`

---

### Tiempo de Espera (Wait Period)

| Campo | Valor |
|-------|-------|
| **Inicio del período de espera** | 15:30:15 |
| **Configuración stale_minutes** | 20 minutos |
| **Tiempo esperado de abandono** | ~15:50:15 |

---

### Scheduler de Abandono - Detección Automática

**Timestamp:** 2026-03-14 15:50:16 (aproximadamente 20 minutos después)

**Logs del proceso de abandono:**
```
[PAGOS] INFO - [ABANDONMENT] Found 1 stale pending payment(s)
[PAGOS] INFO - [ABANDONMENT] Payment fb91292d-8db7-4d87-b43a-24b8f7614aad marked as 'abandonado' (created_at: 2026-03-14 15:30:03.534583)
```

| Campo | Valor |
|-------|-------|
| **Pagos detectados como stale** | 1 |
| **Payment ID procesado** | `fb91292d-8db7-4d87-b43a-24b8f7614aad` |
| **Fecha de creación original** | 2026-03-14 15:30:03.534583 |
| **Tiempo transcurrido** | ~20 minutos 13 segundos |
| **Nuevo status** | `abandonado` |

✅ **Scheduler funcionó correctamente**

---

### Paso 5: Check Payment Status (After Wait)

**Request:**
```
GET /api/v1/payments/fb91292d-8db7-4d87-b43a-24b8f7614aad
```

**Resultado:**
| Campo | Valor |
|-------|-------|
| **Timestamp** | 2026-03-14 15:50:42 |
| **HTTP Status** | 200 OK |
| **Payment Status** | `abandonado` |
| **Tiempo de Respuesta** | 0.006s |

✅ **Test Passed:** Payment status changed to `abandonado`

---

## Resumen de Resultados

| Paso | Descripción | Resultado |
|------|-------------|-----------|
| 1 | Acquire Room Hold | ✅ PASSED |
| 2 | Create Reservation | ✅ PASSED |
| 3 | Verify Initial Reservation Status | ✅ PASSED |
| 4 | Verify Initial Payment Status (pendiente) | ✅ PASSED |
| 5 | Check Payment Status (abandonado) | ✅ PASSED |

## Verificación del Comportamiento

| Criterio | Esperado | Actual | Estado |
|----------|----------|--------|--------|
| Payment inicial en `pendiente` | ✅ | ✅ | PASS |
| Scheduler detecta pagos stale | ✅ | ✅ | PASS |
| Cambio automático a `abandonado` | ✅ | ✅ | PASS |
| Tiempo de abandono ~20 min | 20 min | ~20 min 13s | PASS |

---

## Conclusión

**La prueba de Payment Abandonment Test Flow se ejecutó exitosamente.** 

El sistema demostró correctamente la capacidad de:

1. ✅ Crear reservas con pagos en estado `pendiente`
2. ✅ Detectar pagos que permanecen en estado `pendiente` por más del tiempo configurado (20 minutos)
3. ✅ Marcar automáticamente dichos pagos como `abandonado`
4. ✅ Mantener la consistencia de datos a través de todos los microservicios

El scheduler de abandono de pagos funciona según lo diseñado, ejecutándose cada 60 segundos y marcando como abandonados los pagos que superan el umbral de 20 minutos en estado pendiente.

---

## Información Técnica Adicional

### IDs Generados Durante la Prueba

| Entidad | ID |
|---------|-----|
| Hold | `0b640932-58ea-4e98-af79-2078bf707e4a` |
| Reservation | `898cf21b-65fb-45e8-8f40-fe8f51cc9ee3` |
| Payment | `fb91292d-8db7-4d87-b43a-24b8f7614aad` |
| User | `test-user-abandonment-001` |
| Room | `ca1efcda-dd53-4645-a610-f1d4278c12c5` |

### Servicios Involucrados

- **reservas-1, reservas-2, reservas-3**: Manejaron requests de hold y reserva
- **pagos-1**: Procesó pagos y ejecutó el scheduler de abandono
- **ext-payments-1**: Simuló el procesador de pagos externo
- **nginx-1**: Balanceador de carga
- **redis-1**: Cache y locks distribuidos
- **activemq-1**: Message broker

---

*Documento generado automáticamente basado en logs de ejecución de pruebas.*
