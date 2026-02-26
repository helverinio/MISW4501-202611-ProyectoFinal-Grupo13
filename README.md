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

This will start all services and their databases.

## API Endpoints

### Gateway (Public API) - http://localhost:8081

#### Reservations
- `POST /api/v1/reservations` - Create a reservation
- `GET /api/v1/reservations` - Get all reservations
- `GET /api/v1/reservations/{id}` - Get a reservation by ID
- `PUT /api/v1/reservations/{id}` - Update a reservation
- `DELETE /api/v1/reservations/{id}` - Delete a reservation

#### Payments
- `POST /api/v1/payments` - Make a payment
- `GET /api/v1/payments/{id}` - Get a payment by ID

## Example Requests

### Create a Reservation
```bash
curl -X POST http://localhost:8081/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-123", "event_id": "event-456", "seat_number": "A1"}'
```

### Make a Payment
```bash
curl -X POST http://localhost:8081/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{"reservation_id": "res-123", "amount": 100.00, "currency": "USD", "payment_method": "credit_card"}'
```

## Project Structure

```
proyecto1-experiment/
├── docker-compose.yml
├── gateway/                 # API Gateway
│   ├── app/
│   │   ├── api/v1/         # API routes
│   │   └── services/       # Service clients
│   ├── Dockerfile
│   └── requirements.txt
├── reservas/               # Reservations Microservice
│   ├── app/
│   │   ├── api/v1/         # API routes
│   │   ├── application/    # Use cases
│   │   ├── domain/         # Entities & repositories
│   │   └── infrastructure/ # DB models & implementations
│   ├── Dockerfile
│   └── requirements.txt
├── pagos/                  # Internal Payments Microservice
│   ├── app/
│   │   ├── api/v1/
│   │   ├── application/
│   │   ├── domain/
│   │   └── infrastructure/
│   ├── Dockerfile
│   └── requirements.txt
└── ext-payments/           # External Payments Microservice
    ├── app/
    │   ├── api/v1/
    │   ├── application/
    │   ├── domain/
    │   └── infrastructure/
    ├── Dockerfile
    └── requirements.txt
```

## Clean Architecture Layers

Each microservice follows clean architecture:

- **Domain Layer**: Core business entities and repository interfaces
- **Application Layer**: Use cases/business logic
- **Infrastructure Layer**: Database models, repository implementations
- **API Layer**: REST endpoints (versioned as v1)