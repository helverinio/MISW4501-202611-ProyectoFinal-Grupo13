# Manual: Acceso a RDS desde contenedores ECS (sin exponer RDS)

Este runbook explica como conectarse a la base de datos RDS desde los contenedores de microservicios en ECS Fargate usando ECS Exec.

Aplica para:
- Servicio `th-prod-usuarios` (schema `usuarios`)
- Servicio `th-prod-reservas` (schema `reservas`)

## 1. Prerrequisitos

- AWS CLI instalado y funcionando.
- Permisos IAM para `ecs:ExecuteCommand` y lectura de ECS.
- Profile AWS configurado: `grupo13`.
- Session Manager Plugin instalado.

## 2. Configuracion de sesion (PowerShell)

```powershell
$env:AWS_PROFILE = "grupo13"
$env:AWS_DEFAULT_REGION = "us-east-2"
aws sts get-caller-identity
```

Si este comando responde correctamente, puedes continuar.

## 3. Flujo para BD de usuarios

### Paso 1. Obtener task activo

```powershell
$cluster = "th-prod-ecs"
$service = "th-prod-usuarios"

$taskArn = aws ecs list-tasks --cluster $cluster --service-name $service --desired-status RUNNING --query "taskArns[0]" --output text
$taskId = $taskArn.Split("/")[-1]

Write-Host "TaskArn: $taskArn"
Write-Host "TaskId: $taskId"
```

### Paso 2. Entrar al contenedor

```powershell
aws ecs execute-command --cluster th-prod-ecs --task $taskId --container usuarios --interactive --command "/bin/sh"
```

Prompt esperado:

```sh
#
```

### Paso 3. Validar variables de conexion

```sh
env | grep -Ei "DB|DATABASE|POSTGRES|PGHOST|PGPORT|PGUSER|PGDATABASE"
```

Debe aparecer `DATABASE_URL` apuntando a RDS con `search_path=usuarios`.

### Paso 4. Probar query minima

```sh
python -c "import os, psycopg2; conn=psycopg2.connect(os.environ['DATABASE_URL']); cur=conn.cursor(); cur.execute('select 1'); print(cur.fetchone()); conn.close()"
```

Resultado esperado:

```text
(1,)
```

### Paso 5. Listar tablas del schema usuarios

```sh
python -c "import os, psycopg2; conn=psycopg2.connect(os.environ['DATABASE_URL']); cur=conn.cursor(); cur.execute(\"select table_name from information_schema.tables where table_schema='usuarios' order by table_name\"); print(cur.fetchall()); conn.close()"
```

### Paso 6. Ejecutar consulta de solo lectura

```sh
python -c "import os, psycopg2; conn=psycopg2.connect(os.environ['DATABASE_URL']); cur=conn.cursor(); cur.execute('select * from usuarios.user_accounts limit 10'); print(cur.fetchall()); conn.close()"
```

Si la tabla no existe, toma una tabla valida del paso anterior.

### Paso 7. Salir del contenedor

```sh
exit
```

## 4. Flujo para BD de reservas

### Paso 1. Obtener task activo

```powershell
$cluster = "th-prod-ecs"
$service = "th-prod-reservas"

$taskArn = aws ecs list-tasks --cluster $cluster --service-name $service --desired-status RUNNING --query "taskArns[0]" --output text
$taskId = $taskArn.Split("/")[-1]

Write-Host "TaskArn: $taskArn"
Write-Host "TaskId: $taskId"
```

### Paso 2. Entrar al contenedor

```powershell
aws ecs execute-command --cluster th-prod-ecs --task $taskId --container reservas --interactive --command "/bin/sh"
```

### Paso 3. Validar variables de conexion

```sh
env | grep -Ei "DB|DATABASE|POSTGRES|PGHOST|PGPORT|PGUSER|PGDATABASE"
```

Debe aparecer `DATABASE_URL` apuntando a RDS con `search_path=reservas`.

### Paso 4. Probar query minima

```sh
python -c "import os, psycopg2; conn=psycopg2.connect(os.environ['DATABASE_URL']); cur=conn.cursor(); cur.execute('select 1'); print(cur.fetchone()); conn.close()"
```

### Paso 5. Listar tablas del schema reservas

```sh
python -c "import os, psycopg2; conn=psycopg2.connect(os.environ['DATABASE_URL']); cur=conn.cursor(); cur.execute(\"select table_name from information_schema.tables where table_schema='reservas' order by table_name\"); print(cur.fetchall()); conn.close()"
```

### Paso 6. Ejecutar consulta de solo lectura

```sh
python -c "import os, psycopg2; conn=psycopg2.connect(os.environ['DATABASE_URL']); cur=conn.cursor(); cur.execute('select * from reservas.reservations limit 10'); print(cur.fetchall()); conn.close()"
```

Si la tabla no existe, usa una tabla valida del paso anterior.

### Paso 7. Salir del contenedor

```sh
exit
```

## 5. Consulta SQL generica reutilizable

Dentro del contenedor:

```sh
python -c "import os, psycopg2; conn=psycopg2.connect(os.environ['DATABASE_URL']); cur=conn.cursor(); cur.execute(\"TU_SQL_AQUI\"); print(cur.fetchall()); conn.close()"
```

Ejemplo:

```sh
python -c "import os, psycopg2; conn=psycopg2.connect(os.environ['DATABASE_URL']); cur=conn.cursor(); cur.execute(\"select now()\"); print(cur.fetchall()); conn.close()"
```

## 6. Troubleshooting

1. `execute-command` falla o no conecta:
- Verifica que el task este en estado `RUNNING`.
- Reobtiene `taskId` y reintenta.

2. Error de contenedor:
- El nombre debe coincidir con el definido en task definition (`usuarios` o `reservas`).

3. Error de tabla inexistente:
- Lista tablas primero y usa un nombre valido del schema.

4. Timeout desde tu laptop a RDS:
- Este metodo no depende del acceso publico de RDS porque la consulta se ejecuta desde ECS dentro de la VPC.

## 7. Seguridad operacional recomendada

- Ejecutar solo consultas de lectura en ambientes productivos, salvo aprobacion explicita.
- No guardar contrasenas en scripts locales.
- Cerrar la sesion (`exit`) al terminar.
