# Diagramas de Base de Datos por Microservicio

Este documento refleja el esquema real que hoy materializa cada microservicio mediante `db.create_all()`. Incluye los servicios con persistencia propia y aclara cuáles no tienen base de datos local.

## 1) Microservicio Gateway

El microservicio `gateway` no define modelos SQLAlchemy ni crea tablas propias. Su función es orquestación y proxy hacia los demás microservicios.

## 2) Microservicio Usuarios (`DB: usuarios`)

```plantuml
@startuml
hide methods
hide stereotypes
skinparam linetype ortho
skinparam shadowing false

entity "pais" as u_pais {
  * id : integer <<PK, auto>>
  --
  nombre : varchar(255) <<NOT NULL>>
}

entity "ciudad" as u_ciudad {
  * id : integer <<PK, auto>>
  --
  nombre : varchar(255) <<NOT NULL>>
  pais_id : integer <<FK, NOT NULL>>
}

entity "user_accounts" as user_accounts {
  * id : varchar(36) <<PK>>
  --
  nombre : varchar(255) <<NOT NULL>>
  email : varchar(255) <<UNIQUE, NOT NULL>>
  usuario : varchar(100) <<UNIQUE, NOT NULL>>
  ciudad_id : integer <<FK, NULL>>
  contrasena : varchar(255) <<NOT NULL>>
  creado_en : datetime <<NOT NULL>>
}

entity "tokens" as tokens {
  * id : varchar(36) <<PK>>
  --
  usuario_id : varchar(36) <<FK, NOT NULL>>
  access_token : text <<NOT NULL>>
  refresh_token : text <<NOT NULL>>
  access_token_expires_at : datetime <<NOT NULL>>
  refresh_token_expires_at : datetime <<NOT NULL>>
  creado_en : datetime <<NOT NULL>>
  revocado : boolean <<NOT NULL, default=false>>
}

u_pais ||--o{ u_ciudad : pais_id
u_ciudad ||--o{ user_accounts : ciudad_id
user_accounts ||--o{ tokens : usuario_id
@enduml
```

## 3) Microservicio Reservas (`DB: reservas`)

```plantuml
@startuml
hide methods
hide stereotypes
skinparam linetype ortho
skinparam shadowing false

entity "paises" as paises {
  * id : varchar(36) <<PK>>
  --
  nombre : varchar(100) <<NOT NULL>>
}

entity "ciudades" as ciudades {
  * id : varchar(36) <<PK>>
  --
  nombre : varchar(100) <<NOT NULL>>
  id_pais : varchar(36) <<FK, NOT NULL>>
}

entity "hoteles" as hoteles {
  * id : varchar(36) <<PK>>
  --
  nombre : varchar(200) <<NOT NULL>>
  email : varchar(200) <<NOT NULL>>
  descripcion : text <<NULL>>
  amenidades : text <<NULL>>
  id_ciudad : varchar(36) <<FK, NOT NULL>>
}

entity "habitaciones" as habitaciones {
  * id : varchar(36) <<PK>>
  --
  tipo : varchar(100) <<NOT NULL>>
  nro_habitacion : int <<NOT NULL>>
  capacidad : int <<NOT NULL>>
  camas : int <<NOT NULL>>
  id_hotel : varchar(36) <<FK, NOT NULL>>
}

entity "tarifas" as tarifas {
  * id : varchar(36) <<PK>>
  --
  nombre : varchar(100) <<NOT NULL>>
  valor : float <<NOT NULL>>
  descuento : float <<NOT NULL, default=0.0>>
  id_habitacion : varchar(36) <<FK, NOT NULL>>
}

entity "estados" as estados {
  * id : varchar(36) <<PK>>
  --
  nombre : varchar(100) <<NOT NULL>>
  descripcion : text <<NULL>>
}

entity "reservas" as reservas {
  * id : varchar(36) <<PK>>
  --
  fecha_ingreso : datetime <<NOT NULL>>
  fecha_salida : datetime <<NOT NULL>>
  total : float <<NOT NULL>>
  nro_personas : int <<NOT NULL>>
  id_usuario : varchar(36) <<NOT NULL>>
  id_pais : varchar(36) <<FK, NOT NULL>>
  id_habitacion : varchar(36) <<FK, NOT NULL>>
  id_estado : varchar(36) <<FK, NOT NULL>>
}

entity "pagos" as pagos_reservas {
  * id : varchar(36) <<PK>>
  --
  fecha_pago : datetime <<NOT NULL>>
  total : float <<NOT NULL>>
  estado : varchar(50) <<NOT NULL>>
  id_pais : varchar(36) <<FK, NOT NULL>>
  id_reserva : varchar(36) <<FK, NOT NULL>>
}

entity "notificaciones" as notificaciones {
  * id : varchar(36) <<PK>>
  --
  fecha_notif : datetime <<NOT NULL>>
  titulo : varchar(200) <<NOT NULL>>
  descripcion : text <<NULL>>
  id_reserva : varchar(36) <<FK, NOT NULL>>
}

entity "room_holds" as room_holds {
  * id : varchar(36) <<PK>>
  --
  id_habitacion : varchar(36) <<FK, NOT NULL>>
  id_usuario : varchar(36) <<NOT NULL>>
  fecha_ingreso : datetime <<NOT NULL>>
  fecha_salida : datetime <<NOT NULL>>
  created_at : datetime <<NOT NULL>>
  expires_at : datetime <<NOT NULL>>
}

paises ||--o{ ciudades : id_pais
ciudades ||--o{ hoteles : id_ciudad
hoteles ||--o{ habitaciones : id_hotel
habitaciones ||--o{ tarifas : id_habitacion
paises ||--o{ reservas : id_pais
estados ||--o{ reservas : id_estado
habitaciones ||--o{ reservas : id_habitacion
reservas ||--o{ pagos_reservas : id_reserva
reservas ||--o{ notificaciones : id_reserva
habitaciones ||--o{ room_holds : id_habitacion

note bottom of room_holds
Indices reales:
- ix_room_holds_habitacion_dates (id_habitacion, fecha_ingreso, fecha_salida)
- ix_room_holds_expires_at (expires_at)
end note
@enduml
```

## 4) Microservicio Pagos (`DB: pagos`)

```plantuml
@startuml
hide methods
hide stereotypes
skinparam linetype ortho
skinparam shadowing false

entity "payments" as p_payments {
  * id : varchar(36) <<PK>>
  --
  external_payment_id : varchar(36) <<NULL>>
  payment_intent_id : varchar(36) <<NOT NULL>>
  reservation_id : varchar(36) <<NOT NULL>>
  amount : float <<NOT NULL>>
  currency : varchar(3) <<NOT NULL>>
  status : varchar(20) <<NOT NULL, default='pendiente'>>
  payment_method : varchar(50) <<NOT NULL>>
  created_at : datetime <<NOT NULL>>
  updated_at : datetime <<NOT NULL>>
}
@enduml
```

## 5) Microservicio Ext-Payments (`DB: ext-payments`)

```plantuml
@startuml
hide methods
hide stereotypes
skinparam linetype ortho
skinparam shadowing false

entity "payment_intents" as ep_payment_intents {
  * id : varchar(36) <<PK>>
  --
  amount : float <<NOT NULL>>
  currency : varchar(3) <<NOT NULL>>
  description : varchar(255) <<NULL>>
  status : varchar(20) <<NOT NULL, default='pending'>>
  webhook_url : varchar(500) <<NULL>>
  reservation_id : varchar(36) <<NULL>>
  created_at : datetime <<NOT NULL>>
}

entity "payments" as ep_payments {
  * id : varchar(36) <<PK>>
  --
  payment_intent_id : varchar(36) <<NOT NULL>>
  amount : float <<NOT NULL>>
  currency : varchar(3) <<NOT NULL>>
  status : varchar(20) <<NOT NULL, default='completed'>>
  payment_method : varchar(50) <<NOT NULL>>
  created_at : datetime <<NOT NULL>>
  updated_at : datetime <<NOT NULL>>
}

ep_payment_intents ..> ep_payments : payment_intent_id
@enduml
```

## 6) Relaciones lógicas entre microservicios (sin FK física)

```plantuml
@startuml
hide methods
hide stereotypes
skinparam linetype ortho
skinparam shadowing false

entity "usuarios.user_accounts" as u_user_accounts {
  * id : varchar(36)
  --
  ciudad_id : integer
}

entity "reservas.reservas" as r_reservas {
  * id : varchar(36)
  --
  id_usuario : varchar(36)
}

entity "pagos.payments" as p_payments {
  * id : varchar(36)
  --
  reservation_id : varchar(36)
  payment_intent_id : varchar(36)
  external_payment_id : varchar(36)
}

entity "ext-payments.payment_intents" as ep_payment_intents {
  * id : varchar(36)
  --
  reservation_id : varchar(36)
}

entity "ext-payments.payments" as ep_payments {
  * id : varchar(36)
  --
  payment_intent_id : varchar(36)
}

u_user_accounts ..> r_reservas : r_reservas.id_usuario
r_reservas ..> p_payments : p_payments.reservation_id
r_reservas ..> ep_payment_intents : ep_payment_intents.reservation_id
p_payments ..> ep_payment_intents : p_payments.payment_intent_id
p_payments ..> ep_payments : p_payments.external_payment_id
ep_payment_intents ..> ep_payments : ep_payments.payment_intent_id
@enduml
```
