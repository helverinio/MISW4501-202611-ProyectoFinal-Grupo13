-- Pricing engine schema for reservas microservice (USD backend)

CREATE TABLE IF NOT EXISTS tipos_habitacion (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    capacidad INT NOT NULL,
    camas INT NOT NULL,
    id_hotel VARCHAR(36) NOT NULL REFERENCES hoteles(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'habitaciones' AND column_name = 'id_tipo_habitacion'
    ) THEN
        ALTER TABLE habitaciones ADD COLUMN id_tipo_habitacion VARCHAR(36);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_habitaciones_id_tipo_habitacion'
    ) THEN
        ALTER TABLE habitaciones
            ADD CONSTRAINT fk_habitaciones_id_tipo_habitacion
            FOREIGN KEY (id_tipo_habitacion) REFERENCES tipos_habitacion(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS temporadas (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS temporadas_detalle (
    id VARCHAR(36) PRIMARY KEY,
    id_temporada VARCHAR(36) NOT NULL REFERENCES temporadas(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS planes_tarifarios (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    id_tipo_habitacion VARCHAR(36) NOT NULL REFERENCES tipos_habitacion(id)
);

CREATE TABLE IF NOT EXISTS reglas_tarifarias (
    id VARCHAR(36) PRIMARY KEY,
    id_plan_tarifario VARCHAR(36) NOT NULL REFERENCES planes_tarifarios(id),
    id_temporada VARCHAR(36) REFERENCES temporadas(id),
    fecha_inicio DATE,
    fecha_fin DATE,
    dias_semana_mask VARCHAR(20),
    precio_base_noche NUMERIC(12,2) NOT NULL,
    prioridad INT NOT NULL DEFAULT 0,
    min_noches INT,
    combinable BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS cotizaciones (
    id VARCHAR(36) PRIMARY KEY,
    id_usuario VARCHAR(36) NOT NULL,
    id_habitacion VARCHAR(36) NOT NULL REFERENCES habitaciones(id),
    fecha_ingreso DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    nro_personas INT NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS cotizacion_detalle (
    id VARCHAR(36) PRIMARY KEY,
    id_cotizacion VARCHAR(36) NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
    fecha_noche DATE NOT NULL,
    id_plan_tarifario VARCHAR(36) NOT NULL REFERENCES planes_tarifarios(id),
    id_regla_tarifaria VARCHAR(36) NOT NULL REFERENCES reglas_tarifarias(id),
    precio_noche NUMERIC(12,2) NOT NULL,
    subtotal_noche NUMERIC(12,2) NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'reservas' AND column_name = 'id_cotizacion'
    ) THEN
        ALTER TABLE reservas ADD COLUMN id_cotizacion VARCHAR(36);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_reservas_id_cotizacion'
    ) THEN
        ALTER TABLE reservas
            ADD CONSTRAINT fk_reservas_id_cotizacion
            FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS reserva_detalle_tarifa (
    id VARCHAR(36) PRIMARY KEY,
    id_reserva VARCHAR(36) NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    fecha_noche DATE NOT NULL,
    id_plan_tarifario VARCHAR(36) NOT NULL REFERENCES planes_tarifarios(id),
    id_regla_tarifaria VARCHAR(36) NOT NULL REFERENCES reglas_tarifarias(id),
    precio_noche NUMERIC(12,2) NOT NULL,
    subtotal_noche NUMERIC(12,2) NOT NULL
);
