CREATE TABLE IF NOT EXISTS comentarios_hoteles (
    id VARCHAR(36) PRIMARY KEY,
    id_hotel VARCHAR(36) NOT NULL REFERENCES hoteles(id),
    id_usuario VARCHAR(36) NOT NULL,
    id_reserva VARCHAR(36) NOT NULL REFERENCES reservas(id),
    comentario TEXT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_comentarios_hoteles_usuario_reserva UNIQUE (id_usuario, id_reserva)
);

CREATE INDEX IF NOT EXISTS ix_comentarios_hoteles_id_hotel
    ON comentarios_hoteles (id_hotel);

CREATE INDEX IF NOT EXISTS ix_comentarios_hoteles_id_hotel_created_at
    ON comentarios_hoteles (id_hotel, created_at DESC);
