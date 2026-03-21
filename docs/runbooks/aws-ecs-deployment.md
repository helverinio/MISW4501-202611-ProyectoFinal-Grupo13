# Despliegue AWS ECS Blue-Green

Esta guía explica cómo usar el despliegue AWS de este repositorio sin asumir experiencia previa.

---

## 1. Qué se despliega

### Backend
- `gateway` en ECS Fargate detrás de un ALB público
- `reservas` en ECS Fargate detrás de un ALB interno
- `pagos` en ECS Fargate detrás de un ALB interno
- `ext-payments` en ECS Fargate detrás de un ALB interno
- Despliegue **blue-green** por servicio usando **AWS CodeDeploy**

### Datos e infraestructura base
- 1 VPC
- 2 subnets públicas
- 2 subnets privadas
- 1 RDS PostgreSQL compartido
- 1 ElastiCache Redis
- 1 Amazon MQ (ActiveMQ)
- ECR para imágenes Docker
- CloudWatch Logs

### Frontends
- `web-client` en S3 + CloudFront
- `web-admin` en S3 + CloudFront
- La API pública se expone también por CloudFront para tener HTTPS sin comprar dominio al inicio

---

## 2. Decisiones de costo tomadas

Para bajar costo sin romper el objetivo académico:

- ECS sobre **Fargate** para evitar administrar EC2
- **Sin NAT Gateway**: las tareas ECS salen por IP pública en subnets públicas
- RDS en **una sola instancia** PostgreSQL
- Aislamiento de backend por **schemas** en la misma base (`reservas`, `pagos`, `ext_payments`)
- Redis de un solo nodo
- Amazon MQ en `SINGLE_INSTANCE`
- Mínimos de escalado:
  - `gateway`: 2 tareas
  - `reservas`: 1 tarea
  - `pagos`: 1 tarea
  - `ext-payments`: 1 tarea
- Auto scaling conservador para subir solo cuando CPU lo necesite
- CloudFront `PriceClass_100`

Importante:
Blue-green implica que **durante un despliegue** temporalmente existirán tareas duplicadas del servicio que se está actualizando. Eso es normal.

---

## 3. Qué cambió en el código para soportar AWS

Se agregaron dos capacidades nuevas, compatibles con local:

### ActiveMQ seguro para Amazon MQ
Variables nuevas:
- `MQ_USE_SSL`
- `MQ_CA_CERT_PATH`

En local:
- `MQ_USE_SSL=false`
- `MQ_PORT=61613`

En AWS:
- `MQ_USE_SSL=true`
- `MQ_PORT=61617`

### Base compartida con schemas
Variable nueva:
- `DB_SCHEMA`

Cada servicio ahora puede ejecutar automáticamente:
- `CREATE SCHEMA IF NOT EXISTS <schema>`
- `db.create_all()` dentro de su schema

Eso permite usar **1 RDS PostgreSQL** con 3 schemas sin romper el entorno local.

---

## 4. Qué hace el workflow automático

Archivo:
- `.github/workflows/cd-aws-main.yml`

Se ejecuta cuando:
- un Pull Request hacia `main` se cierra y quedó **mergeado**

El workflow hace esto:
1. Asume un rol AWS por OIDC
2. Ejecuta `terraform apply`
3. Construye y publica imágenes Docker en ECR
4. Compila los 2 frontends Angular
5. Publica los frontends en S3
6. Invalida CloudFront de frontends
7. Registra nuevas task definitions en ECS
8. Lanza despliegue **blue-green** con CodeDeploy para:
   - `ext-payments`
   - `pagos`
   - `reservas`
   - `gateway`

Ese orden existe para respetar dependencias.

---

## 5. Primer uso: bootstrap manual

Hay una verdad incómoda: **la primera vez** debes autenticarte manualmente en AWS para crear la infraestructura base.

Eso pasa porque el propio workflow necesita un rol IAM que todavía no existe.

### Requisitos en tu máquina
- AWS CLI configurado con una cuenta que pueda crear infraestructura
- Terraform >= 1.6
- Docker
- Node 20

### Antes de `aws configure`: ¿de dónde sale el `AWS Access Key ID`?

Para alguien que empieza, hay 3 caminos posibles:

#### Opción 1. Usar AWS CloudShell
Es la más simple si no quieres pelear con credenciales locales.

1. Entra a la consola de AWS
2. Abre **CloudShell**
3. Clona el repositorio dentro de CloudShell
4. Ejecuta desde ahí Terraform

Ventaja:
- No necesitas `aws configure`
- AWS ya te autentica dentro de CloudShell

#### Opción 2. Usar un usuario IAM con access key
Es la opción más común para principiantes cuando trabajas desde tu PC.

**No uses la cuenta root.**

Pasos:
1. Entra a la consola de AWS con una cuenta que tenga permisos para crear usuarios IAM
2. Ve a **IAM**
3. Ve a **Users**
4. Crea un usuario nuevo, por ejemplo: `terraform-bootstrap`
5. Asigna permisos suficientes para el bootstrap inicial
  - para un laboratorio académico simple: `AdministratorAccess`
6. Dentro del usuario, ve a:
  - **Security credentials**
  - **Access keys**
  - **Create access key**
7. Elige uso tipo **Command Line Interface (CLI)**
8. AWS te mostrará:
  - `Access key ID`
  - `Secret access key`

Eso es exactamente lo que pide `aws configure`.

#### Opción 3. Usar AWS IAM Identity Center / SSO
Es más seguro, pero requiere que tu cuenta ya lo tenga configurado.

Si tu organización usa SSO, en vez de `aws configure` usarías:

```bash
aws configure sso
```

Si no sabes qué es SSO, probablemente para este caso no es la ruta más rápida.

### Paso 1. Configura credenciales AWS localmente
```bash
aws configure
```

Cuando te pregunte esto:

```text
AWS Access Key ID: <tu access key id>
AWS Secret Access Key: <tu secret access key>
Default region name: us-east-1
Default output format: json
```

Si no tienes `Access key ID`, vuelve a la consola AWS y créalo desde IAM como se explicó arriba.

### Paso 2. Ve a Terraform
```bash
cd infra/aws/terraform
```

### Paso 3. Inicializa Terraform
```bash
terraform init
```

### Paso 4. Aplica infraestructura base
```bash
terraform apply -var="github_repository=OWNER/REPO"
```

Ejemplo:
```bash
terraform apply -var="github_repository=mi-org/MISW4501-202611-ProyectoFinal-Grupo13"
```

### Paso 5. Copia el output del rol GitHub Actions
```bash
terraform output github_actions_role_arn
```

### Paso 6. Crea este secret en GitHub
En el repo, ve a:
- `Settings`
- `Secrets and variables`
- `Actions`
- `New repository secret`

Crea:
- `AWS_GITHUB_ACTIONS_ROLE_ARN`

Valor:
- el ARN que salió en `terraform output github_actions_role_arn`

Después de esto, el resto ya puede ser automático por merge a `main`.

---

## 6. Cómo lanzar el primer despliegue real

Tienes dos opciones.

### Opción A. Hacer un PR pequeño a `main`
La más limpia.

1. Crea una rama
2. Haz un cambio pequeño
3. Abre PR a `main`
4. Mergea el PR
5. GitHub Actions hará todo el despliegue

### Opción B. Ejecutar manualmente el mismo pipeline
No está creado como workflow manual por ahora. Si quieres, se puede agregar `workflow_dispatch` luego.

---

## 7. Cómo saber si quedó funcionando

### Backend
Terraform entrega el ALB público y el CloudFront de API.

Obtén la URL HTTPS de la API:
```bash
cd infra/aws/terraform
terraform output api_cloudfront_domain_name
```

La API pública quedará en algo como:
```text
https://dxxxxxxxxxxxxx.cloudfront.net
```

Prueba salud:
```bash
curl https://<api-cloudfront-domain>/health
```

### Frontends
URLs:
```bash
terraform output frontend_urls
```

Obtendrás algo como:
- `web-client`: `https://dxxxx.cloudfront.net`
- `web-admin`: `https://dyyyy.cloudfront.net`

---

## 8. Qué recursos debes revisar si algo falla

### GitHub Actions
Primero revisa el job:
- `CD AWS - main`

### ECS
Revisa en consola AWS:
- ECS
- Cluster `${resource_prefix}-${environment}-ecs`
- Services
- Events
- Running tasks

### CodeDeploy
Si el blue-green falló:
- CodeDeploy
- Applications
- Deployment groups
- Deployment details

### Logs
Cada servicio escribe en CloudWatch Logs:
- `/ecs/<prefix>/<service>`

Ejemplos:
- `/ecs/th-prod/gateway`
- `/ecs/th-prod/reservas`
- `/ecs/th-prod/pagos`
- `/ecs/th-prod/ext-payments`

### Load Balancer
Revisa health checks:
- ALB público para `gateway`
- ALB interno para privados

### Base de datos
La instancia es una sola, pero las tablas viven por schema:
- `reservas`
- `pagos`
- `ext_payments`

---

## 9. Variables importantes en producción

### `gateway`
- `RESERVAS_SERVICE_URL=http://<internal-alb>:5000`
- `PAGOS_SERVICE_URL=http://<internal-alb>:5002`

### `reservas`
- `DATABASE_URL=...search_path=reservas`
- `DB_SCHEMA=reservas`
- `PAGOS_SERVICE_URL=http://<internal-alb>:5002`
- `REDIS_HOST=<elasticache-endpoint>`
- `MQ_HOST=<amazon-mq-host>`
- `MQ_PORT=61617`
- `MQ_USE_SSL=true`

### `pagos`
- `DATABASE_URL=...search_path=pagos`
- `DB_SCHEMA=pagos`
- `EXT_PAYMENTS_URL=http://<internal-alb>:5001`
- `PAGOS_WEBHOOK_URL=http://<public-alb-dns>`
- `MQ_HOST=<amazon-mq-host>`
- `MQ_PORT=61617`
- `MQ_USE_SSL=true`

### `ext-payments`
- `DATABASE_URL=...search_path=ext_payments`
- `DB_SCHEMA=ext_payments`

---

## 10. Qué NO hace automáticamente este setup

Para que no haya falsas expectativas:

- No crea un dominio propio
- No crea certificados ACM para dominio custom
- No configura WAF
- No migra estado Terraform a backend remoto S3
- No hace smoke tests post-deploy
- No crea ambientes separados `staging/prod`

Está optimizado para:
- costo bajo
- baja operación manual
- despliegue reproducible
- blue-green real en ECS

---

## 11. Recomendación de uso para el curso

Si el objetivo es académico y mostrar disciplina de despliegue:

1. Hacer bootstrap una sola vez con `terraform apply`
2. Guardar `AWS_GITHUB_ACTIONS_ROLE_ARN` en GitHub Secrets
3. Proteger `main` para permitir merges solo por PR
4. Usar los checks CI ya existentes como requisito
5. Cada merge a `main` dispara CD automático

---

## 12. Próximos endurecimientos recomendados

Cuando esto ya esté estable, lo siguiente sería:

1. Agregar `workflow_dispatch` para redeploy manual
2. Agregar smoke tests después del deploy
3. Agregar dominio propio + ACM
4. Mover Terraform state a S3 + DynamoDB lock
5. Reducir permisos del rol GitHub Actions (hoy está amplio para simplificar bootstrap)
6. Agregar ambiente `staging` separado de `prod`
