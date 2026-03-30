# CI/CD nativo AWS con Terraform

Este runbook crea despliegue continuo 100% en AWS usando:

- CodePipeline (orquestador)
- CodeBuild (build, terraform apply y deploy)
- CodeDeploy (blue/green ECS)
- ECS Fargate (microservicios)
- S3 + CloudFront (2 frontends)
- ALB publico como API Gateway de entrada
- Redis (ElastiCache) para cache

## 1. Que agrega esta implementacion

Archivos nuevos o modificados:

- `infra/aws/terraform/cicd.tf`
- `infra/aws/terraform/variables.tf`
- `infra/aws/terraform/outputs.tf`
- `infra/aws/codebuild/buildspec-cd.yml`
- `infra/aws/codebuild/deploy.sh`

## 2. Flujo de despliegue

Cuando se hace merge a main:

1. CodePipeline recibe cambio desde GitHub por CodeConnections.
2. Lanza un job de CodeBuild.
3. CodeBuild ejecuta:
   - `terraform apply`
   - build y push de imagenes backend a ECR
   - build de 2 frontends Angular
   - sync de frontends a S3 + invalidacion CloudFront
   - despliegue blue/green por servicio con CodeDeploy

## 3. Variables clave para escalar a 7 microservicios

Actualmente los defaults dejan por fuera el microservicio `gateway` (enrutamiento suplido por AWS), pero ya quedan parametrizados:

- `backend_services`
- `frontend_apps`
- `deployment_order`

Defaults actuales:

- `backend_services=["reservas","pagos","ext-payments"]`
- `deployment_order=["ext-payments","pagos","reservas"]`

Cuando agreguen nuevos microservicios, solo actualizan esas listas y crean:

1. carpeta `microservices/<nuevo-servicio>` con Dockerfile
2. taskdef template `infra/aws/terraform/taskdefs/<nuevo-servicio>.json.tpl`
3. entrada del servicio en `local.service_configs` dentro de `infra/aws/terraform/main.tf`

## 4. Activar el pipeline AWS nativo

### 4.1 Terraform apply

Ejemplo:

```bash
cd infra/aws/terraform
terraform init
terraform apply \
  -var="github_repository=OWNER/REPO" \
  -var="enable_aws_native_cicd=true"
```

Opcional: si ya tienen una conexion de CodeConnections creada, pasen:

```bash
-var="github_connection_arn=arn:aws:codestar-connections:..."
```

Si no pasan `github_connection_arn`, Terraform crea una conexion nueva y deben completar el handshake en AWS Console (estado Available).

### 4.2 Verificar outputs

```bash
terraform output aws_native_cicd_connection_arn
terraform output aws_native_cicd_pipeline_name
terraform output aws_native_cicd_codebuild_project_name
```

## 5. Recomendaciones para produccion

- Reemplazar `AdministratorAccess` del rol de CodeBuild por permisos minimos.
- Mover estado Terraform a backend remoto (S3 + DynamoDB lock).
- Separar entornos por workspaces o carpetas (dev, qa, prod).
- Poner aprobacion manual en CodePipeline antes de desplegar prod.
- Configurar dominio + certificados ACM para frontends y API.

## 6. Evitar doble despliegue

Este repositorio ya tiene un workflow de GitHub Actions para CD en:

- `.github/workflows/cd-aws-main.yml`

Si habilitan el pipeline nativo de AWS, dejen un solo camino activo para no desplegar dos veces por cada merge a main:

- O usan GitHub Actions
- O usan CodePipeline + CodeBuild
