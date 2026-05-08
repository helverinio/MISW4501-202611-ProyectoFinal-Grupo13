import os
from app import create_app, db
from sqlalchemy import text

app = create_app(os.environ.get('FLASK_ENV', 'development'))

with app.app_context():
    schema_name = app.config.get('DB_SCHEMA')
    if schema_name:
        db.session.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))
        db.session.commit()
    db.create_all()

    # Incremental schema evolution for existing databases.
    db.session.execute(text(
        "ALTER TABLE IF EXISTS habitaciones "
        "ADD COLUMN IF NOT EXISTS id_tipo_habitacion VARCHAR(36)"
    ))
    db.session.execute(text(
        "ALTER TABLE IF EXISTS reservas "
        "ADD COLUMN IF NOT EXISTS id_cotizacion VARCHAR(36)"
    ))
    db.session.execute(text(
        "ALTER TABLE IF EXISTS reservas "
        "ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ))
    db.session.execute(text(
        "ALTER TABLE IF EXISTS reservas "
        "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ))
    db.session.execute(text(
        "ALTER TABLE IF EXISTS reservas "
        "ADD COLUMN IF NOT EXISTS updated_by_user_id VARCHAR(36)"
    ))
    db.session.execute(text(
        "ALTER TABLE IF EXISTS reservas "
        "ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0"
    ))
    db.session.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_reservas_id_usuario_created_at "
        "ON reservas (id_usuario, created_at DESC)"
    ))
    db.session.execute(text(
        "CREATE TABLE IF NOT EXISTS comentarios_hoteles ("
        "id VARCHAR(36) PRIMARY KEY, "
        "id_hotel VARCHAR(36) NOT NULL REFERENCES hoteles(id), "
        "id_usuario VARCHAR(36) NOT NULL, "
        "id_reserva VARCHAR(36) NOT NULL REFERENCES reservas(id), "
        "comentario TEXT NULL, "
        "rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), "
        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "
        "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "
        "activo BOOLEAN NOT NULL DEFAULT TRUE, "
        "CONSTRAINT uq_comentarios_hoteles_usuario_reserva UNIQUE (id_usuario, id_reserva)"
        ")"
    ))
    db.session.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_comentarios_hoteles_id_hotel "
        "ON comentarios_hoteles (id_hotel)"
    ))
    db.session.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_comentarios_hoteles_id_hotel_created_at "
        "ON comentarios_hoteles (id_hotel, created_at)"
    ))
    db.session.execute(text(
        "CREATE TABLE IF NOT EXISTS admin_hoteles ("
        "id VARCHAR(36) PRIMARY KEY, "
        "id_usuario VARCHAR(36) NOT NULL, "
        "id_hotel VARCHAR(36) NOT NULL REFERENCES hoteles(id), "
        "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "
        "CONSTRAINT uq_admin_hotel UNIQUE (id_usuario, id_hotel)"
        ")"
    ))
    db.session.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_admin_hoteles_id_usuario "
        "ON admin_hoteles (id_usuario)"
    ))

    # HU-P-22: estado 'Rechazada' + performance indexes for dashboard queries
    db.session.execute(text(
        "INSERT INTO estados (id, nombre, descripcion) VALUES "
        "('f290f1ee-6c54-4b01-90e6-d701748f0857', 'Rechazada', "
        "'La reserva fue rechazada por el administrador del hotel') "
        "ON CONFLICT (id) DO NOTHING"
    ))
    db.session.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_reservas_fecha_ingreso "
        "ON reservas (fecha_ingreso)"
    ))
    db.session.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_reservas_id_estado "
        "ON reservas (id_estado)"
    ))
    db.session.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_reservas_version "
        "ON reservas (version)"
    ))
    db.session.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_admin_hoteles_id_hotel "
        "ON admin_hoteles (id_hotel)"
    ))
    db.session.commit()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
