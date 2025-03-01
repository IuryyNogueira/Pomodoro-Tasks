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
        return {}
    
    try:
        with open(Config.DATA_FILE, 'r') as f:
            all_tasks = json.load(f)
            
            # Handle legacy list format
            if isinstance(all_tasks, list):
                logging.info("Migrating legacy task format to user-keyed dict")
                return {"General": all_tasks}  # Return old list as a general group
                
            return all_tasks.get(user_id, {"General": []})
            
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.warning(f"Loading tasks failed: {str(e)}")
        return {"General": []}

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
                all_tasks = {user_id: {"General": all_tasks}}
                
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
                
            group = request.json.get('group', 'General')
            new_task = {'task': request.json.get('task'), 'completed': False}
            if not new_task['task']:
                return jsonify({'error': 'Missing task text'}), 400
                
            tasks = load_tasks()
            if group not in tasks:
                tasks[group] = []
            tasks[group].append(new_task)
            save_tasks(tasks)
            return jsonify(new_task), 201

        if request.method == 'DELETE':
            if not request.is_json:
                return jsonify({'error': 'Invalid content type'}), 400
                
            group = request.json.get('group', 'General')
            try:
                task_id = int(request.json.get('id'))
            except (TypeError, ValueError):
                return jsonify({'error': 'Invalid task ID'}), 400
                
            tasks = load_tasks()
            if group in tasks and 0 <= task_id < len(tasks[group]):
                deleted_task = tasks[group].pop(task_id)
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
        group = request.args.get('group', 'General')
        tasks = load_tasks()
        if group in tasks and 0 <= task_id < len(tasks[group]):
            tasks[group][task_id]['completed'] = not tasks[group][task_id]['completed']
            save_tasks(tasks)
            return jsonify(tasks[group][task_id]), 200
        return jsonify({'error': 'Invalid ID'}), 400
    except Exception as e:
        logging.error(f"Toggle task failed: {str(e)}")
        return jsonify({'error': 'Server error'}), 500

@bp.route('/groups', methods=['POST'])
def create_group():
    try:
        if not request.is_json:
            return jsonify({'error': 'Invalid content type'}), 400
            
        group_name = request.json.get('group')
        if not group_name:
            return jsonify({'error': 'Missing group name'}), 400
            
        tasks = load_tasks()
        if group_name in tasks:
            return jsonify({'error': 'Group already exists'}), 400
            
        tasks[group_name] = []
        save_tasks(tasks)
        return jsonify({'message': 'Group created'}), 201
    except Exception as e:
        logging.error(f"Create group failed: {str(e)}")
        return jsonify({'error': 'Server error'}), 500