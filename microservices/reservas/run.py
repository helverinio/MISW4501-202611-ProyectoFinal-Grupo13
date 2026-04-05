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
    db.session.commit()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
