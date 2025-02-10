from flask import Flask, render_template, request, jsonify
import json
import os
import requests

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Desabilitar cache para desenvolvimento
DATA_FILE = os.path.join('data', 'tasks.json')
HG_API_KEY = "b60c3aec"

def load_tasks():
    if not os.path.exists(DATA_FILE):
        # Cria o arquivo se não existir
        with open(DATA_FILE, 'w') as f:
            json.dump([], f)
        return []
    
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        # Se o arquivo estiver corrompido, recria
        with open(DATA_FILE, 'w') as f:
            json.dump([], f)
        return []

def save_tasks(tasks):
    with open(DATA_FILE, 'w') as f:
        json.dump(tasks, f, indent=4)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/tasks', methods=['GET', 'POST', 'DELETE'])
def manage_tasks():
    tasks = load_tasks()
    
    if request.method == 'POST':
        new_task = {'task': request.json['task'], 'completed': False}
        tasks.append(new_task)
        save_tasks(tasks)
        return jsonify(new_task), 201
    
    elif request.method == 'DELETE':
        task_id = int(request.json['id'])
        if 0 <= task_id < len(tasks):
            deleted_task = tasks.pop(task_id)
            save_tasks(tasks)
            return jsonify(deleted_task), 200
        return jsonify({'error': 'ID inválido'}), 400
    
    return jsonify(tasks)

@app.route('/toggle_task/<int:task_id>', methods=['PUT'])
def toggle_task(task_id):
    tasks = load_tasks()
    if 0 <= task_id < len(tasks):
        tasks[task_id]['completed'] = not tasks[task_id]['completed']
        save_tasks(tasks)
        return jsonify(tasks[task_id]), 200
    return jsonify({'error': 'ID inválido'}), 400

@app.route('/weather')
def get_weather():
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    if not lat or not lng:
        return jsonify({'error': 'Latitude e longitude são necessários'}), 400
    url = f"https://api.hgbrasil.com/weather?key={HG_API_KEY}&lat={lat}&lon={lng}"
    response = requests.get(url)
    weather_data = response.json()
    city_name = weather_data.get('results', {}).get('city_name')
    current_weather = weather_data.get('results', {}).get('forecast', [])[0]
    temperature = weather_data.get('results', {}).get('temp')
    sunrise = weather_data.get('results', {}).get('sunrise')
    sunset = weather_data.get('results', {}).get('sunset')
    moon_phase = weather_data.get('results', {}).get('moon_phase')
    return jsonify({
        'city': city_name,
        'current_weather': current_weather,
        'temperature': temperature,
        'sunrise': sunrise,
        'sunset': sunset,
        'moon_phase': moon_phase
    })

if __name__ == '__main__':
    app.run(debug=True)