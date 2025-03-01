from flask import Blueprint, jsonify, request, session
import json
import logging
from app.config import Config
from app.utils import initialize_session

bp = Blueprint('tasks', __name__, url_prefix='/tasks')

def load_tasks():
    user_id = session.get('user_id')
    if not user_id:
        logging.warning("No user_id found in session")
        return []
    
    try:
        with open(Config.DATA_FILE, 'r') as f:
            all_tasks = json.load(f)
            
            # Handle legacy list format
            if isinstance(all_tasks, list):
                logging.info("Migrating legacy task format to user-keyed dict")
                return all_tasks  # Return old list to be re-saved as dict
                
            return all_tasks.get(user_id, [])
            
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.warning(f"Loading tasks failed: {str(e)}")
        return []

def save_tasks(tasks):
    user_id = session.get('user_id')
    if not user_id:
        logging.error("Cannot save tasks without user_id")
        return

    try:
        with open(Config.DATA_FILE, 'r') as f:
            all_tasks = json.load(f)
            
            # Convert legacy list format to dict
            if isinstance(all_tasks, list):
                logging.info("Converting legacy task list to dict format")
                all_tasks = {user_id: all_tasks}
                
    except FileNotFoundError:
        all_tasks = {}
    except json.JSONDecodeError as e:
        logging.error(f"Corrupted data file: {str(e)}")
        all_tasks = {}

    if not isinstance(all_tasks, dict):
        logging.error("Invalid data format, resetting to empty dict")
        all_tasks = {}

    all_tasks[user_id] = tasks
    
    try:
        with open(Config.DATA_FILE, 'w') as f:
            json.dump(all_tasks, f, indent=2)
    except IOError as e:
        logging.error(f"Failed to save tasks: {str(e)}")
        raise

@bp.before_request
def handle_session():
    initialize_session()

@bp.route('/', methods=['GET', 'POST', 'DELETE'])
def manage_tasks():
    try:
        if request.method == 'POST':
            if not request.is_json:
                return jsonify({'error': 'Invalid content type'}), 400
                
            new_task = {'task': request.json.get('task'), 'completed': False}
            if not new_task['task']:
                return jsonify({'error': 'Missing task text'}), 400
                
            tasks = load_tasks()
            tasks.append(new_task)
            save_tasks(tasks)
            return jsonify(new_task), 201

        if request.method == 'DELETE':
            if not request.is_json:
                return jsonify({'error': 'Invalid content type'}), 400
                
            try:
                task_id = int(request.json.get('id'))
            except (TypeError, ValueError):
                return jsonify({'error': 'Invalid task ID'}), 400
                
            tasks = load_tasks()
            if 0 <= task_id < len(tasks):
                deleted_task = tasks.pop(task_id)
                save_tasks(tasks)
                return jsonify(deleted_task), 200
            return jsonify({'error': 'Invalid ID'}), 400

        return jsonify(load_tasks())

    except Exception as e:
        logging.error(f"Task operation failed: {str(e)}")
        return jsonify({'error': 'Server error'}), 500

@bp.route('/<int:task_id>', methods=['PUT'])
def toggle_task(task_id):
    try:
        tasks = load_tasks()
        if 0 <= task_id < len(tasks):
            tasks[task_id]['completed'] = not tasks[task_id]['completed']
            save_tasks(tasks)
            return jsonify(tasks[task_id]), 200
        return jsonify({'error': 'Invalid ID'}), 400
    except Exception as e:
        logging.error(f"Toggle task failed: {str(e)}")
        return jsonify({'error': 'Server error'}), 500