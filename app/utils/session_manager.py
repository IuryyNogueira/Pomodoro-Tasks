from flask import session

def initialize_session():
    """Inicializa a sessão com valores padrão"""
    session.setdefault('tasks', [])
    session.setdefault('user_preferences', {})