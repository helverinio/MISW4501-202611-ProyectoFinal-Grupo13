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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
