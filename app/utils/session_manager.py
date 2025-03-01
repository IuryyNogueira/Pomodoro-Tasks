from flask import session
import uuid

def initialize_session():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
