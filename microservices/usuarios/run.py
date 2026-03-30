import os
from app import create_app, db
from sqlalchemy import text, inspect

app = create_app(os.environ.get('FLASK_ENV', 'development'))

def init_db():
    with app.app_context():
        schema_name = app.config.get('DB_SCHEMA')
        if schema_name:
            db.session.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))
            db.session.commit()
        
        try:
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            if 'user_accounts' not in existing_tables:
                db.session.execute(text('DROP TABLE IF EXISTS tokens CASCADE'))
                db.session.execute(text('DROP TABLE IF EXISTS usuarios CASCADE'))
                db.session.execute(text('DROP TYPE IF EXISTS user_accounts CASCADE'))
                db.session.execute(text('DROP TYPE IF EXISTS usuarios CASCADE'))
                db.session.commit()
                db.create_all()
        except Exception as e:
            app.logger.warning(f"DB init warning (may be race condition): {e}")
            db.session.rollback()

init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
