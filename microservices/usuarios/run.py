import os
from app import create_app, db
from sqlalchemy import text, inspect
from app.infrastructure.models import UsuarioModel, CiudadModel, PaisModel, TokenModel

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

            inspector = inspect(db.engine)
            user_account_columns = {col['name'] for col in inspector.get_columns('user_accounts')}
            if 'ciudad_id' not in user_account_columns:
                db.session.execute(text('ALTER TABLE user_accounts ADD COLUMN ciudad_id INTEGER'))

            fk_rows = db.session.execute(text("""
                SELECT conname
                FROM pg_constraint
                WHERE conname = 'fk_user_accounts_ciudad_id'
            """)).fetchall()
            if not fk_rows:
                db.session.execute(text("""
                    ALTER TABLE user_accounts
                    ADD CONSTRAINT fk_user_accounts_ciudad_id
                    FOREIGN KEY (ciudad_id) REFERENCES ciudad(id)
                """))

            db.session.commit()
        except Exception as e:
            app.logger.warning(f"DB init warning (may be race condition): {e}")
            db.session.rollback()

init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
