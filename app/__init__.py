from flask import Flask
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    
    # Configurações de sessão
    app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-123')
    
    # Registrar blueprints
    from app.routes.main import bp as main_bp  # 👈 Novo
    from app.routes import tasks, weather
    
    app.register_blueprint(main_bp)  # 👈 Registrar primeiro
    app.register_blueprint(tasks.bp)
    app.register_blueprint(weather.bp)
    
    return app