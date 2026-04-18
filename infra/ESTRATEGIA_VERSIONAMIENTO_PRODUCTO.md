# Estrategia de Versionamiento de Producto (PoC en 3 sprints)

## Objetivo
Definir una estrategia simple para identificar de forma visible qué versión del producto se entrega en cada sprint del PoC, priorizando una sola versión para todo el producto.

## Alcance y principio clave
- Alcance: todo el producto (frontend web, backend/microservicios, infraestructura y documentación de entrega).
- Principio: manejar **una versión única de producto** por entrega de sprint.
- Excepción: la app móvil puede mantener su propio versionado técnico (por requisitos de stores o ciclos de publicación), pero debe mapearse a la versión global del producto.

## Propuesta de esquema de versión (simple)
Usar formato SemVer simplificado para el producto:
- `v0.<sprint>.<patch>` durante el PoC.
- Donde:
  - `0`: fase pre-release/PoC.
  - `<sprint>`: 1, 2, 3 (marca la entrega principal del sprint).
  - `<patch>`: correcciones menores dentro del mismo sprint (si aplica).

Ejemplos:
- Sprint 1: `v0.1.0`
- Sprint 2: `v0.2.0`
- Sprint 3: `v0.3.0`
- Hotfix en sprint 2: `v0.2.1`

## Regla de visibilidad por sprint
Cada cierre de sprint debe dejar explícito:
1. Versión de producto entregada.
2. Fecha de entrega.
3. Resumen corto de alcance incluido.
4. Estado de componentes clave (opcional, solo informativo).

Se recomienda publicar esa información en un único registro visible para el equipo (por ejemplo, changelog o release notes del repositorio).

## Versiones de componentes
### Regla general
- No versionar componentes por separado como política principal.
- La versión oficial para reporte y seguimiento es la versión global del producto.

### Excepción móvil
- La app móvil puede usar su versión técnica propia (ejemplo: `1.4.0`),
  pero cada release móvil debe declarar explícitamente a qué versión global corresponde.

Ejemplo de mapeo:
- Producto `v0.2.0` -> Móvil `1.3.0`
- Producto `v0.3.0` -> Móvil `1.4.0`

## Operación propuesta (sin implementar aún)
### Opción A: Manual (mínima complejidad)
- Al final de cada sprint se define la versión objetivo.
- Se crea la release con esa versión.
- Se actualiza el registro de versión entregada.

Ventajas:
- Muy simple.
- Cero automatización inicial.

Desventajas:
- Mayor riesgo de error humano.

### Opción B: Semi-automatizada (recomendada a corto plazo)
- Mantener una fuente única de verdad para versión (por ejemplo, archivo `VERSION` o metadato de release).
- Pipeline toma esa versión para nombrar artefactos y release notes.
- Validación básica: no permitir publicar si falta versión.

Ventajas:
- Mantiene simplicidad.
- Reduce errores y mejora trazabilidad.

Desventajas:
- Requiere un ajuste menor en CI/CD.

## Convención para el PoC (recomendada)
- Sprint 1 entrega: `v0.1.0`
- Sprint 2 entrega: `v0.2.0`
- Sprint 3 entrega: `v0.3.0`
- Si hay ajustes entre entregas: subir `patch` (`v0.2.1`, `v0.2.2`, etc.).

Al cierre del PoC se puede evaluar pasar a:
- `v1.0.0` si el producto se considera listo para etapa productiva.

## Plantilla mínima de registro de entrega
- Versión producto:
- Sprint:
- Fecha:
- Alcance principal:
- Cambios relevantes:
- Estado móvil (versión técnica y mapeo):

## Decisiones tomadas en esta propuesta
- Se prioriza una sola versión global de producto.
- Se permite versión técnica independiente solo para móvil, con mapeo obligatorio.
- Se favorece una estrategia simple para 3 sprints de PoC.
- No se implementa automatización en esta etapa; solo se define la estrategia.
