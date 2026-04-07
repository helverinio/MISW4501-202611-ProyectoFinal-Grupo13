# Estrategia de Reduccion de Costos AWS

## 1. Hallazgos sobre el despliegue actual

La infraestructura activa descrita en Terraform y en los runbooks tiene estos costos fijos 24/7:

- 5 servicios en ECS Fargate con minimo de 6 tareas activas en total.
- 2 Application Load Balancers: uno publico y uno interno.
- 1 RDS PostgreSQL compartido.
- 1 nodo ElastiCache Redis.
- 1 broker Amazon MQ ActiveMQ.
- 3 distribuciones CloudFront y 2 buckets S3 para frontends.
- Container Insights habilitado en el cluster ECS.

Evidencia en el repo:

- Los minimos de ECS estan definidos en `infra/aws/terraform/main.tf`.
- RDS, Redis y MQ se crean en `infra/aws/terraform/main.tf`.
- El cluster ECS tiene `containerInsights = enabled`.
- El workflow principal de despliegue esta en `.github/workflows/cd-aws-main.yml`.

## 2. Que componentes pegan mas en costo

Ordenados por impacto esperado en este stack:

1. ECS Fargate 24/7.
2. RDS PostgreSQL 24/7.
3. Los dos ALB activos todo el tiempo.
4. Amazon MQ y ElastiCache activos todo el tiempo.
5. Container Insights y logs de CloudWatch.

En este proyecto, el mayor ahorro sin redisenar infraestructura viene de apagar computo y base de datos cuando no hay uso real. CloudFront y S3 normalmente no son el problema principal.

## 3. Estrategia recomendada

### Nivel 1. Parking nocturno del ambiente

Objetivo: bajar el costo diario sin tocar Terraform ni redisenar la arquitectura.

Accion recomendada:

- Escalar a cero todos los servicios ECS fuera del horario de uso.
- Detener la instancia RDS fuera del horario de uso.
- Volver a encender ambos al iniciar la jornada.

Esto es lo mas rentable porque elimina la mayor parte del costo variable del stack. En este repositorio ya existe el script `infra/aws/scripts/cost-parking.ps1` para hacerlo.

Importante:

- El script no solo pone `desired-count=0`; tambien baja `min-capacity=0` en Application Auto Scaling. Si no se hace eso, ECS puede volver a levantar tareas solo.
- RDS puede permanecer detenido hasta 7 dias; despues AWS lo vuelve a iniciar automaticamente.
- Este parking no apaga ALB, Redis ni Amazon MQ. Esos siguen cobrando.

Horario sugerido para un entorno academico:

- `down`: 10:00 p. m. hora Colombia
- `up`: 6:30 a. m. hora Colombia
- Fin de semana: dejar el ambiente parqueado desde viernes en la noche hasta lunes temprano

### Nivel 2. Limpieza de recursos huerfanos y duplicados

Definicion operativa del equipo:

- La region oficial es `us-east-2`.
- No deben existir recursos activos en `us-east-1`.

Riesgo a controlar:

- recursos huérfanos en `us-east-1` que sigan generando costo.

Accion recomendada:

- Ejecutar inventario semanal con `infra/aws/scripts/cleanup-aws-resources.ps1 -Action inventory`.
- Revisar el reporte en `infra/aws/scripts/reports/`.
- Eliminar solo recursos no gestionados por Terraform y confirmados como sobrantes.

Esta accion puede ahorrar mas que optimizaciones finas si todavia hay recursos prendidos fuera de `us-east-2`.

### Nivel 3. Congelar costo en fines de semana o demos cerradas

Si el ambiente no necesita disponibilidad continua, aplicar un parking extendido:

- viernes por la noche: `down`
- lunes temprano: `up -WaitForDb`

Para semanas sin entregas o demos, usar el mismo esquema. Esto aumenta mucho el ahorro mensual porque elimina periodos completos de inactividad.

### Nivel 4. Ajustes operativos de menor impacto

Estos no reemplazan el parking, pero ayudan:

- Reducir ruido de despliegues innecesarios a `main`.
- Revisar si Container Insights realmente se necesita de forma permanente.
- Revisar retencion de CloudWatch Logs si 14 dias es mas de lo necesario.

Los dos ultimos puntos ya implican cambios de configuracion, no rediseno, pero deben ir despues del parking porque su impacto suele ser menor.

## 4. Como operar el parking

### Ver estado

##### Confirmar usuario
```powershell
aws configure list-profiles
aws sts get-caller-identity --profile grupo13
$env:AWS_PROFILE = "grupo13"
$env:AWS_DEFAULT_REGION = "us-east-2"
aws sts get-caller-identity
```

```powershell
.\infra\aws\scripts\cost-parking.ps1 -Action status
```

### Apagar en la noche

```powershell
.\infra\aws\scripts\cost-parking.ps1 -Action down
```

### Encender en la manana

```powershell
.\infra\aws\scripts\cost-parking.ps1 -Action up -WaitForDb
```

Opciones utiles:

- `-Region us-east-2`
- `-ClusterName th-prod-ecs`
- `-DbInstanceIdentifier th-prod-postgres`
- `-SkipRds` si se quiere dejar la base encendida
- `-SkipEcs` si solo se quiere manejar RDS

## 5. Opciones de automatizacion sin cambiar infraestructura

### Opcion A. Windows Task Scheduler

Crear dos tareas en la maquina operativa del equipo:

- tarea nocturna: ejecuta `cost-parking.ps1 -Action down`
- tarea matutina: ejecuta `cost-parking.ps1 -Action up -WaitForDb`

Ventaja: no requiere tocar AWS.

### Opcion B. GitHub Actions programado

Crear un workflow programado que:

- asuma el mismo rol OIDC ya usado por CD;
- ejecute el script con `down` y `up` en horarios definidos.

Ventaja: automatizacion centralizada y auditable.

### Opcion C. Ejecucion manual controlada

Si prefieren evitar automatismo por ahora:

- ejecutar `down` al terminar pruebas o demo;
- ejecutar `up -WaitForDb` antes de clase o validacion.

Esto sigue generando ahorro real y evita errores de horario durante la adopcion inicial.

## 6. Lo que no baja realmente el costo hoy

Estas acciones tienen impacto bajo o indirecto comparadas con parking:

- optimizar CloudFront;
- cambiar invalidaciones del frontend;
- limpiar imagenes ECR por debajo de lo ya definido;
- micro-ajustes en S3.

Son validas, pero no deben ser la prioridad.

## 7. Recomendacion ejecutiva

La mejor estrategia costo/beneficio para este repositorio es:

1. Adoptar parking nocturno de ECS y RDS desde ya.
2. Hacer inventario frecuente en `us-east-2` y validar que `us-east-1` quede vacio.
3. Aplicar parking extendido en fines de semana.
4. Solo despues, revisar Container Insights y retencion de logs.

Si el equipo necesita una sola accion con impacto real este mes, debe ser la automatizacion de `cost-parking.ps1`.

## 8. Alcance oficial de infraestructura

Para evitar confusiones durante la migracion de region, este es el criterio oficial.

### 8.1 Infra oficial del proyecto (SI forma parte)

Son recursos gestionados por Terraform en `infra/aws/terraform/main.tf` y deben existir unicamente en `us-east-2`:

- Red: VPC, subnets, route tables, internet gateway, security groups.
- Datos y mensajeria: RDS PostgreSQL, ElastiCache Redis, Amazon MQ.
- Contenedores: ECS cluster, ECS services, ECS task definitions, auto scaling.
- Exposicion: ALB publico/interno, listeners, target groups.
- Artefactos: ECR repositories.
- Frontends y edge: S3 buckets, CloudFront distributions (frontends y API).
- Configuracion y observabilidad: Secrets Manager, CloudWatch log groups.
- IAM del despliegue: role de GitHub Actions OIDC y provider de GitHub.

Regla operativa:

- Si un recurso de esta lista aparece en `us-east-1`, se considera drift y debe migrarse o retirarse de forma controlada.

### 8.2 Recursos fuera de alcance de borrado automatico (NO forma parte)

No se deben borrar automaticamente sin revision humana:

- Recursos globales o compartidos de IAM que puedan afectar otros proyectos.
- Recursos sin etiqueta `ManagedBy=terraform`.
- Cualquier recurso no declarado en Terraform.

Ejemplo detectado en inventario:

- `payments:payment-instrument` sin `ManagedBy=terraform`.

### 8.3 Estado actual observado

Con el inventario generado (`aws-resource-inventory-20260402-161546.csv`):

- Se detectaron recursos etiquetados de infraestructura en `us-east-1`.
- No se detectaron recursos etiquetados equivalentes en `us-east-2`.

Esto confirma que el despliegue actual activo esta en `us-east-1` y la migracion a `us-east-2` aun no se ha materializado.

### 8.4 Regla de decision para limpieza

1. Primero crear y validar infraestructura en `us-east-2`.
2. Cambiar operacion/CD para que solo apunte a `us-east-2`.
3. Solo despues ejecutar limpieza de `us-east-1`.

No se debe eliminar infraestructura de `us-east-1` antes de validar que `us-east-2` queda funcional de extremo a extremo.