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
    db.session.commit()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
