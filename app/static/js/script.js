let timerId = null;
let timeLeft = 25 * 60;
let currentMode = 'work';

const modes = {
    'work': { time: 25, bg: 'work-mode' },
    'short-break': { time: 5, bg: 'short-break-mode' },
    'long-break': { time: 15, bg: 'long-break-mode' }
};

// Gera ou recupera um ID único para o usuário
function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('userId', userId);
    }
    return userId;
}

// Tasks - Armazenamento Local
function saveTasks(tasks) {
    const userId = getUserId();
    localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasks));
}

function loadTasks() {
    const userId = getUserId();
    const tasks = localStorage.getItem(`tasks_${userId}`);
    return tasks ? JSON.parse(tasks) : [];
}

// Timer
function startTimer() {
    if (!timerId) {
        timerId = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerId);
                timerId = null;
                alert('Tempo esgotado! 🎉');
                switchMode(currentMode === 'work' ? 'short-break' : 'work');
                startTimer();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    timeLeft = modes[currentMode].time * 60;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
}

// Modos
function switchMode(mode) {
    currentMode = mode;
    timeLeft = modes[mode].time * 60;
    document.body.className = modes[mode].bg;
    resetTimer();
}

// Tasks - Interface
document.getElementById('task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const taskInput = document.getElementById('task-input');
    const taskText = taskInput.value.trim();
    
    if (taskText) {
        const tasks = loadTasks();
        tasks.push({ task: taskText, completed: false });
        saveTasks(tasks);
        taskInput.value = '';
        renderTasks(tasks);
    }
});

function toggleTask(index) {
    const tasks = loadTasks();
    tasks[index].completed = !tasks[index].completed;
    saveTasks(tasks);
    renderTasks(tasks);
}

function deleteTask(index) {
    const tasks = loadTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderTasks(tasks);
}

function renderTasks(tasks) {
    const taskList = document.getElementById('tasks');
    taskList.innerHTML = tasks.length > 0 
        ? '' 
        : '<li class="empty">Nenhuma tarefa ainda!</li>';
    
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.innerHTML = `
            <span>${task.task}</span>
            <div class="task-actions">
                <button class="complete-btn" onclick="toggleTask(${index})">✓</button>
                <button class="delete-btn" onclick="deleteTask(${index})">🗑️</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderTasks(loadTasks());
});