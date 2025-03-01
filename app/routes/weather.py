from flask import Blueprint, jsonify, request
import requests
from app.config import Config

bp = Blueprint('weather', __name__, url_prefix='/weather')

@bp.route('/')
def get_weather():
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    
    if not (lat and lng):
        return jsonify({'error': 'Coordenadas obrigatórias'}), 400
    
    try:
        url = f"https://api.hgbrasil.com/weather?key={Config.HG_API_KEY}&lat={lat}&lon={lng}"
        response = requests.get(url)
        data = response.json().get('results', {})
        
        return jsonify({
            'city': data.get('city_name'),
            'temperature': data.get('temp'),
            'forecast': data.get('forecast', [])[0] if data.get('forecast') else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500