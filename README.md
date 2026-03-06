# proyecto1-experiment

Microservices architecture for reservations and payments system.

## Architecture

This project consists of 4 Flask microservices following clean architecture principles:

### Services

| Service | Port | Description |
|---------|------|-------------|
| **Gateway** | 8081 | API Gateway - Public entry point for all APIs |
| **Reservas** | 5000 | Reservations microservice - CRUD operations for reservations |
| **Pagos** | 5002 | Internal payments microservice - Calls ext-payments |
| **Ext-Payments** | 5001 | External payments microservice - Payment processing simulation |

### Databases

Each microservice has its own PostgreSQL database:
- `reservas-db` (port 5433)
- `pagos-db` (port 5435)
- `ext-payments-db` (port 5434)

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Run All Services

```bash
docker-compose up --build
```

### To generate a full HTML dashboard report with charts and detailed analysis:
```bash
jmeter -n -t concurrent_payment_test.jmx -l results/raw_results.jtl -e -o results/html-report
```

### To run the resilience test flow:
```bash
docker-compose stop pagos
docker-compose start pagos
```

This will start all services and their databases.