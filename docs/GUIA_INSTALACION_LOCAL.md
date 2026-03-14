# Guía de Instalación y Ejecución Local

## Descripción del Proyecto

Este proyecto es una arquitectura de microservicios para un sistema de reservas de hotel y procesamiento de pagos. Está compuesto por 4 microservicios Flask que siguen los principios de arquitectura limpia.

---

## Arquitectura del Sistema

### Microservicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Gateway** | 8081 | API Gateway - Punto de entrada público para todas las APIs |
| **Reservas** | 5000 | Microservicio de reservas - Operaciones CRUD para reservas |
| **Pagos** | 5002 | Microservicio interno de pagos - Basicamente para mantener estados de pagos de manera interna |
| **Ext-Payments** | 5001 | Microservicio externo de pagos - Simulación de procesamiento de pagos |

### Bases de Datos

Cada microservicio tiene su propia base de datos PostgreSQL:

| Base de Datos | Puerto Externo | Puerto Interno |
|---------------|----------------|----------------|
| `reservas-db` | 5433 | 5432 |
| `pagos-db` | 5435 | 5432 |
| `ext-payments-db` | 5434 | 5432 |

### Servicios de Infraestructura

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **ActiveMQ** | 61616 (OpenWire), 61613 (STOMP), 8161 (Consola Web) | Message Broker compatible con Amazon MQ |
| **Redis** | 6379 | Cache y bloqueo distribuido |

---

## Requisitos Previos

### Software Obligatorio

1. **Docker Desktop**
   - Descargar desde: https://www.docker.com/products/docker-desktop
   - Versión recomendada: 4.0 o superior
   - Asegúrese de que Docker Compose esté incluido (viene con Docker Desktop)

2. **Git**
   - Para clonar el repositorio
   - Descargar desde: https://git-scm.com/downloads

### Software Opcional (para desarrollo)

1. **Python 3.11**
   - Necesario solo si desea ejecutar servicios fuera de Docker
   - Descargar desde: https://www.python.org/downloads/

2. **Postman**
   - Para probar las APIs
   - Descargar desde: https://www.postman.com/downloads/

3. **Apache JMeter**
   - Para pruebas de carga y concurrencia
   - Descargar desde: https://jmeter.apache.org/download_jmeter.cgi

---

## Instalación

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/MISW4501-202611-ProyectoFinal-Grupo13.git
cd MISW4501-202611-ProyectoFinal-Grupo13
```

### Paso 2: Verificar Docker

Asegúrese de que Docker Desktop esté ejecutándose:

```bash
docker --version
docker-compose --version
```

---

## Ejecución del Proyecto

### Modo Escalado (Recomendado para pruebas de carga)

Este modo incluye múltiples instancias de los servicios:

```bash
docker-compose -f docker-compose-scaled.yml up --build
```

**Opciones adicionales:**

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f reservas
docker-compose logs -f pagos
docker-compose logs -f gateway
```


**Arquitectura en modo escalado:**
- 3 instancias de Gateway
- 3 instancias de Reservas
- Nginx como balanceador de carga (puerto 8081)

---

## Verificación de Servicios

### Health Checks

Una vez que los servicios estén ejecutándose, verifique que funcionen correctamente:

```bash
# Gateway Health Check
curl http://localhost:8081/health

# Reservas Health Check (directo)
curl http://localhost:5000/health

# Pagos Health Check (directo)
curl http://localhost:5002/health

# Ext-Payments Health Check (directo)
curl http://localhost:5001/health
```

### Consola de ActiveMQ

Acceda a la consola web de ActiveMQ para monitorear mensajes:

- **URL:** http://localhost:8161/admin/
- **Usuario:** admin
- **Contraseña:** admin

---

## Endpoints Principales

### A través del Gateway (Puerto 8081)

| Recurso | Método | Endpoint |
|---------|--------|----------|
| Países | GET, POST | `/api/v1/paises` |
| Ciudades | GET, POST | `/api/v1/ciudades` |
| Hoteles | GET, POST | `/api/v1/hoteles` |
| Habitaciones | GET, POST | `/api/v1/habitaciones` |
| Tarifas | GET, POST | `/api/v1/tarifas` |
| Estados | GET, POST | `/api/v1/estados` |
| Reservas | GET, POST | `/api/v1/reservas` |
| Pagos | GET, POST | `/api/v1/payments` |
| Notificaciones | GET, POST | `/api/v1/notificaciones` |

---

## Uso de Colección Postman

El proyecto incluye una colección de Postman para probar todas las APIs:

1. Abra Postman
2. Importe el archivo: `postman_collection.json`
3. Las variables de entorno ya están configuradas:
   - `gateway_url`: http://localhost:8081
   - `reservas_url`: http://localhost:5000
   - `pagos_url`: http://localhost:5002
   - `ext_payments_url`: http://localhost:5001

---

## Variables de Entorno

### Servicio Reservas

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `DATABASE_URL` | postgresql://postgres:postgres@reservas-db:5432/reservas | URL de conexión a PostgreSQL |
| `PAGOS_SERVICE_URL` | http://pagos:5002 | URL del servicio de pagos |
| `MQ_HOST` | activemq | Host del message broker |
| `MQ_PORT` | 61613 | Puerto STOMP de ActiveMQ |
| `MQ_USERNAME` | admin | Usuario de ActiveMQ |
| `MQ_PASSWORD` | admin | Contraseña de ActiveMQ |
| `REDIS_HOST` | redis | Host de Redis |
| `REDIS_PORT` | 6379 | Puerto de Redis |
| `REDIS_LOCK_TIMEOUT_SECONDS` | 30 | Timeout para bloqueos distribuidos |

### Servicio Pagos

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `DATABASE_URL` | postgresql://postgres:postgres@pagos-db:5432/pagos | URL de conexión a PostgreSQL |
| `EXT_PAYMENTS_URL` | http://ext-payments:5001 | URL del servicio externo de pagos |
| `PAGOS_WEBHOOK_URL` | http://gateway:8080 | URL del webhook para notificaciones |
| `MQ_MAX_RETRIES` | 3 | Reintentos máximos para mensajes |
| `MQ_DLQ_TOPIC` | /topic/PaymentStatusUpdated.DLQ | Topic para Dead Letter Queue |

### Servicio Gateway

| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `RESERVAS_SERVICE_URL` | http://reservas:5000 | URL del servicio de reservas |
| `PAGOS_SERVICE_URL` | http://pagos:5002 | URL del servicio de pagos |

---

## Comandos Útiles

### Gestión de Contenedores

```bash
# Detener todos los servicios
docker-compose down
docker-compose -f docker-compose-scaled.yml down 

# Detener y eliminar volúmenes (BORRA TODAS LAS BASES DE DATOS)
docker-compose down -v

# Reiniciar un servicio específico
docker-compose restart reservas

# Detener un servicio específico
docker-compose stop pagos

# Iniciar un servicio específico
docker-compose start pagos

# Ver estado de los contenedores
docker-compose ps

# Ver uso de recursos
docker stats
```

### Acceso a Bases de Datos

```bash
# Conectar a reservas-db
docker-compose exec reservas-db psql -U postgres -d reservas

# Conectar a pagos-db
docker-compose exec pagos-db psql -U postgres -d pagos

# Conectar a ext-payments-db
docker-compose exec ext-payments-db psql -U postgres -d ext_payments
```

### Acceso a Redis

```bash
docker-compose exec redis redis-cli
```

---

## Pruebas de Carga con JMeter

El proyecto incluye archivos de prueba JMeter en la carpeta `tests/jmeter/`:

### Ejecutar Prueba de Concurrencia

```bash
cd tests/jmeter

# Ejecutar prueba y generar reporte HTML
jmeter -n -t concurrent_payment_test.jmx -l results/raw_results.jtl -e -o results/html-report
```

### Prueba de Hold de Habitaciones

```bash
jmeter -n -t concurrent_room_hold_test.jmx -l results/hold_results.jtl -e -o results/hold-report
```

---

## Pruebas de Resiliencia

Para probar la resiliencia del sistema ante fallos:

```bash
# 1. Detener el servicio de pagos
docker-compose stop pagos

# 2. Realizar algunas operaciones (observar comportamiento)

# 3. Reiniciar el servicio de pagos
docker-compose start pagos

# 4. Verificar que los mensajes pendientes se procesen
```

---

## Solución de Problemas

### El contenedor no inicia

1. Verifique los logs del contenedor:
   ```bash
   docker-compose logs nombre-del-servicio
   ```

2. Verifique que los puertos no estén en uso:
   ```bash
   # Windows
   netstat -an | findstr "8081"
   
   # Linux/Mac
   lsof -i :8081
   ```

### Error de conexión a la base de datos

1. Verifique que el contenedor de la base de datos esté corriendo:
   ```bash
   docker-compose ps | grep db
   ```

2. Verifique los healthchecks:
   ```bash
   docker inspect --format='{{json .State.Health}}' misw4501-202611-proyectofinal-grupo13-reservas-db-1
   ```

### ActiveMQ no responde

1. Espere a que el healthcheck complete (puede tardar hasta 20 segundos)
2. Verifique la consola web: http://localhost:8161/admin/
3. Reinicie el contenedor si es necesario:
   ```bash
   docker-compose restart activemq
   ```

### Redis no responde

```bash
# Verificar conectividad
docker-compose exec redis redis-cli ping
# Debe responder: PONG
```

### Limpiar todo y empezar de cero

```bash
# Detener todos los contenedores y eliminar volúmenes
docker-compose down -v

# Eliminar imágenes huérfanas
docker image prune -f

# Reconstruir desde cero
docker-compose up --build
```

---

## Estructura del Proyecto

```
MISW4501-202611-ProyectoFinal-Grupo13/
├── docs/                           # Documentación
├── ext-payments/                   # Servicio externo de pagos
│   ├── app/
│   │   ├── api/                   # Endpoints REST
│   │   ├── application/           # Casos de uso
│   │   └── domain/                # Entidades de dominio
│   ├── Dockerfile
│   ├── config.py
│   ├── requirements.txt
│   └── run.py
├── gateway/                        # API Gateway
│   ├── app/
│   │   ├── api/                   # Rutas de proxy
│   │   ├── infrastructure/        # Configuración
│   │   └── services/              # Servicios de comunicación
│   ├── Dockerfile
│   ├── config.py
│   ├── requirements.txt
│   └── run.py
├── nginx/                          # Balanceador de carga
│   ├── Dockerfile
│   └── nginx.conf
├── pagos/                          # Servicio de pagos
│   ├── app/
│   │   ├── api/
│   │   ├── application/
│   │   └── domain/
│   ├── Dockerfile
│   ├── config.py
│   ├── requirements.txt
│   └── run.py
├── reservas/                       # Servicio de reservas
│   ├── app/
│   │   ├── api/
│   │   ├── application/
│   │   ├── config/
│   │   └── domain/
│   ├── Dockerfile
│   ├── config.py
│   ├── requirements.txt
│   └── run.py
├── tests/
│   └── jmeter/                    # Pruebas de carga
├── postman/                        # Colecciones de Postman adicionales
├── docker-compose.yml              # Configuración Docker básica
├── docker-compose-scaled.yml       # Configuración Docker escalada
├── postman_collection.json         # Colección Postman principal
└── README.md
```

---

## Tecnologías Utilizadas

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| **Backend** | Python | 3.11 |
| **Framework** | Flask | 3.0.0 |
| **ORM** | SQLAlchemy | 2.0.23 |
| **Base de Datos** | PostgreSQL | 15 (Alpine) |
| **Message Broker** | Apache ActiveMQ | 5.18.3 |
| **Cache** | Redis | 7 (Alpine) |
| **Servidor WSGI** | Gunicorn | 21.2.0 |
| **Balanceador de Carga** | Nginx | Latest |
| **Contenedores** | Docker | Latest |
| **Orquestación** | Docker Compose | 3.8 |

---

## Consideraciones de Seguridad

> **IMPORTANTE:** Las credenciales por defecto son solo para desarrollo local.

Para ambientes de producción, asegúrese de:

1. Cambiar todas las contraseñas por defecto
2. Usar variables de entorno seguras
3. Configurar HTTPS/TLS
4. Implementar autenticación y autorización
5. Configurar firewalls y políticas de red

---

## Soporte

Si encuentra problemas o tiene preguntas:

1. Revise los logs de los contenedores
2. Verifique que todos los requisitos estén instalados
3. Consulte la documentación de Docker y Docker Compose
4. Abra un issue en el repositorio del proyecto

---

