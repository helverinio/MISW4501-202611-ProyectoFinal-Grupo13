# README-CI

Este repositorio quedó preparado para Integración Continua (CI) en GitHub Actions con estrategia GitFlow.

## 1) Detección de estructura del monorepo

### Microservicios backend (Python)
- microservices/reservas
- microservices/pagos
- microservices/ext-payments
- microservices/gateway

### Frontends web (Angular)
- frontends/web-client
- frontends/web-admin

### App móvil
- No se detectó carpeta/app móvil en la estructura actual del repo.
- Queda fuera del alcance de estos workflows por ahora, tal como se solicitó.

## 2) Workflows creados

### Reutilizables (base)
- .github/workflows/_python-service-ci.yml
- .github/workflows/_frontend-ci.yml

### Backends
- .github/workflows/ci-backend-reservas.yml
- .github/workflows/ci-backend-pagos.yml
- .github/workflows/ci-backend-ext-payments.yml
- .github/workflows/ci-backend-gateway.yml

### Frontends
- .github/workflows/ci-frontend-web-client.yml
- .github/workflows/ci-frontend-web-admin.yml

## 3) Cuándo se dispara cada workflow

Todos los workflows de componente se disparan en:
- push a ramas:
  - develop
  - feature/**
  - release/**
  - hotfix/**
- pull_request hacia:
  - develop
  - main

En `push`, cada workflow usa `paths` para ejecutarse solo cuando cambia su componente (o su propio YAML/reusable asociado).

Además, cada workflow incluye detección de cambios por job para reforzar esta regla:
- en `push`, ejecuta CI solo si cambió su componente;
- en `pull_request`, ejecuta CI completo en eventos `opened`, `reopened` y `ready_for_review` para validar integración antes del merge a `develop` o `main`.

Con esto, un commit en `feature/docs` que solo cambie documentación no ejecuta pipelines de backend/frontend.

## 4) Qué valida cada tipo

### Backends Python
Cada workflow backend:
1. Instala dependencias del microservicio (`requirements.txt`).
2. Instala stack de pruebas/cobertura conservador (`pytest`, `pytest-cov`) si no está definido explícitamente.
3. Verifica que existan tests Python (`test_*.py` o `*_test.py`).
4. Ejecuta pruebas unitarias con cobertura:
   - `--cov=app`
  - `--cov-fail-under=<threshold por servicio>`
5. Falla si no hay tests o si cobertura queda por debajo del umbral configurado para ese servicio.
6. Publica `coverage.xml` como artifact.

Umbrales actuales:
- reservas: 80
- pagos: 80
- gateway: 80
- ext-payments: 50

### Frontends web (Angular)
Cada workflow frontend:
1. Instala dependencias con `npm ci`.
2. Ejecuta lint con `npm run lint`.
3. Ejecuta pruebas con `npm run test -- --watch=false`.
4. Ejecuta build con `npm run build`.

## 5) Cambios de configuración adicionales

Para cumplir validación de lint de forma conservadora y estándar sin alterar lógica:
- Se agregó script `lint` en:
  - frontends/web-client/package.json
  - frontends/web-admin/package.json
- Implementación usada:
  - `prettier --check .`

Se reutilizó la configuración existente de Prettier (`.prettierrc`) generada por Angular CLI.

## 6) Rutas monitoreadas por workflow

- ci-backend-reservas.yml:
  - microservices/reservas/**
- ci-backend-pagos.yml:
  - microservices/pagos/**
- ci-backend-ext-payments.yml:
  - microservices/ext-payments/**
- ci-backend-gateway.yml:
  - microservices/gateway/**
- ci-frontend-web-client.yml:
  - frontends/web-client/**
- ci-frontend-web-admin.yml:
  - frontends/web-admin/**

Y adicionalmente cada workflow monitorea su propio archivo YAML + reusable relacionado.

## 7) Checks recomendados como Required (Branch Protection)

Configurar como required checks en GitHub:
- Backend CI - reservas / reservas
- Backend CI - pagos / pagos
- Backend CI - ext-payments / ext-payments
- Backend CI - gateway / gateway
- Frontend CI - web-client / web-client
- Frontend CI - web-admin / web-admin

## 8) Recomendación de Branch Protection

### Rama main (producción)
Recomendado habilitar:
- Require a pull request before merging.
- Require approvals: mínimo 1 (ideal 2 para producción).
- Dismiss stale pull request approvals when new commits are pushed.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Include administrators (opcional, recomendado).
- Restrict who can push to matching branches (opcional).
- Do not allow force pushes.
- Do not allow deletions.

Required checks en `main`:
- todos los checks CI anteriores (los que apliquen por cambios)

### Rama develop (integración)
Recomendado habilitar:
- Require a pull request before merging.
- Require approvals: mínimo 1.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Do not allow force pushes.
- Do not allow deletions.

Required checks en `develop`:
- mismos checks de CI (según componente afectado)

## 9) Pendientes manuales en GitHub

1. Crear reglas de branch protection para `main` y `develop`.
2. Marcar los checks de CI como required en cada regla.
3. (Opcional) Definir `CODEOWNERS` para aprobación por dominio.
4. (Opcional) Habilitar auto-merge solo cuando checks y approvals estén completos.

## 10) Supuestos realizados

- Los microservicios Python exponen código fuente bajo carpeta `app`.
- La cobertura esperada se mide sobre `app` y debe ser >= 80%.
- Excepción actual: `ext-payments` usa umbral temporal de 50%.
- Si un backend no tiene tests aún, el workflow falla por diseño para evitar merges con calidad insuficiente.
- Los frontends Angular usan Node 20 y npm lockfile.
- La app móvil todavía no existe en el repositorio actual.
