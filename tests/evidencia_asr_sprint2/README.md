# Evidencia ASR Sprint 2 — Scripts de performance

Carpeta de evidencia para la validación de Atributos de Calidad (ASR)
del Sprint 2 del proyecto TravelHub (MISW4501-202611 Grupo 13).

## Contenido

| Archivo                        | Propósito |
|-------------------------------|-----------|
| `conftest.py`                  | Módulo compartido: autenticación, descubrimiento de IDs, utilidades estadísticas |
| `asr03_hotel_detail.py`        | Benchmark ASR03 — GET /hoteles/{id} × 100, umbral p95 ≤ 500 ms |
| `asr04_crear_reserva.py`       | Benchmark ASR04 — POST /reservas × 50 + cleanup, umbral p95 ≤ 1 500 ms |
| `asr05_procesar_pago.py`       | Benchmark ASR05 — POST /payments/{id}/process × 30, umbral p95 ≤ 3 000 ms |
| `asr06_historial_reservas.py`  | Benchmark ASR06 — GET /usuarios/{id}/reservas × 100, umbral p95 ≤ 1 000 ms |
| `run_all.py`                   | Ejecuta los 4 scripts y genera tabla resumen |

La evidencia teórica de los ASR de seguridad y modificabilidad (ASR15, 16, 18, 20, 23)
se encuentra en [`docs/EVIDENCIA_ASR_SPRINT2.md`](../../docs/EVIDENCIA_ASR_SPRINT2.md).

---

## Prerrequisitos

```bash
pip install requests
```

`requests` es la única dependencia adicional. Los scripts usan solo la stdlib
de Python para estadísticas (sin numpy/pandas).

---

## Ejecución

### Todos los benchmarks (recomendado)

```bash
cd tests/evidencia_asr_sprint2
python run_all.py
```

La ejecución completa tarda aproximadamente **5–8 minutos** (280 llamadas HTTP
a producción, más la creación/eliminación de 80 reservas de prueba).

### Un script individual

```bash
cd tests/evidencia_asr_sprint2
python asr03_hotel_detail.py
python asr04_crear_reserva.py
python asr05_procesar_pago.py
python asr06_historial_reservas.py
```

---

## Configuración

En `conftest.py` se pueden ajustar los siguientes parámetros:

| Variable           | Valor por defecto | Descripción |
|--------------------|-------------------|-------------|
| `BASE_URL`         | CloudFront prod   | URL base del API de producción |
| `CREDENTIALS`      | jperez / ***      | Credenciales de usuario de prueba |
| `BASE_DATE_OFFSET` | `90`              | Días desde hoy para las reservas de ASR04 |
| `PAGO_DATE_OFFSET` | `300`             | Días desde hoy para las reservas de ASR05 |

### Ajuste de fechas

Los scripts ASR04 y ASR05 crean reservas de prueba con fechas futuras.
Si el sistema devuelve `HTTP 422` con mensaje de «sin regla tarifaria»,
ajustar `BASE_DATE_OFFSET` y `PAGO_DATE_OFFSET` a un rango que tenga
reglas tarifarias activas en producción (consultar `GET /api/v1/tarifas`).

---

## Salida esperada

```
========================================================
  EVIDENCIA ASR SPRINT 2 — TravelHub
  Fecha de ejecución: 2026-04-26 14:30:00
========================================================
  SETUP — Autenticando contra producción AWS
  ✓ Login       | user_id = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  ✓ Hotel       | id = ...  nombre = Hotel Demo Bogotá
  ✓ Habitación  | id = ...  tipo = doble
  ✓ País        | id = ...  nombre = Colombia
  ✓ Estado      | id = ...  nombre = Pendiente

[ASR03] Iniciando: 100 llamadas a GET /hoteles/{id} …

ASR03 - Carga rápida detalle de hotel
Llamadas: 100  |  Umbral p95: 500ms
────────────────────────────────────────────────────────
p50:   120.3ms   p75:   180.5ms   p95:   280.1ms   p99:   340.8ms
min:    85.2ms   max:   420.1ms   media:  145.7ms
────────────────────────────────────────────────────────
RESULTADO: ✅ PASS  (p95=280.1ms ≤ 500ms)

...

========================================================
  RESUMEN EJECUTIVO — Sprint 2
========================================================
ASR      Escenario                              n    p95(ms)  Umbral   Veredicto
--------------------------------------------------------------------------------
ASR03    Carga rápida detalle de hotel         100      280.1     500  ✅ PASS
ASR04    Creación rápida de una reserva         50      820.5    1500  ✅ PASS
ASR05    Procesamiento ágil de pagos            30     1450.2    3000  ✅ PASS
ASR06    Carga rápida del histórico            100      310.7    1000  ✅ PASS
--------------------------------------------------------------------------------

  RESULTADO GLOBAL: ✅ TODOS LOS ASRs CUMPLEN
```

---

## Impacto en producción

- **ASR03 / ASR06**: Solo lecturas (GET). Sin efecto sobre datos.
- **ASR04**: Crea y **elimina** 50 reservas de prueba. Las reservas eliminadas
  no generan pagos procesados.
- **ASR05**: Crea 30 reservas y procesa sus pagos (simulados por `ext-payments`).
  Intenta eliminar las reservas al finalizar. Los pagos quedan en estado procesado
  en el microservicio `pagos`.

Se recomienda ejecutar en horario de baja demanda (fuera de horas pico).

---

## Ambiente de prueba

| Parámetro     | Valor |
|---------------|-------|
| Ambiente      | Producción AWS |
| API Gateway   | CloudFront `d1r8df79ch2otn.cloudfront.net` |
| Región AWS    | us-east-1 |
| ECS Services  | gateway · reservas · pagos · usuarios · ext-payments |
