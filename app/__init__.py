from flask import Flask
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    
    # Configuração segura da chave secreta
    app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24))
    
    # Registrar blueprints
    from .routes import tasks, weather, main  # Imports relativos
    
    app.register_blueprint(tasks.bp)
    app.register_blueprint(weather.bp)
    app.register_blueprint(main.bp)
    
    return app

app = create_app()  # Expose the app object directly