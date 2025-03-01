import os

class Config:
    # Configurações básicas
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-secret-' + os.urandom(16).hex())
    SESSION_TYPE = 'filesystem'
    STATIC_FOLDER = 'static'
    TEMPLATES_FOLDER = 'templates'