let timerId = null;
let timeLeft = 25 * 60;
let currentMode = 'work';

const modes = {
    'work': { time: 25, bg: 'work-mode' },
    'short-break': { time: 5, bg: 'short-break-mode' },
    'long-break': { time: 26, bg: 'long-break-mode' }
};

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

// Tasks
document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskInput = document.getElementById('task-input');
    if (taskInput.value.trim()) {
        await fetch('/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: taskInput.value.trim() })
        });
        taskInput.value = '';
        renderTasks(await fetchTasks());
    }
});

async function fetchTasks() {
    const response = await fetch('/tasks');
    return await response.json();
}

async function toggleTask(id) {
    await fetch(`/toggle_task/${id}`, { method: 'PUT' });
    renderTasks(await fetchTasks());
}

async function deleteTask(id) {
    await fetch('/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    });
    renderTasks(await fetchTasks());
}

function renderTasks(tasks) {
    const taskList = document.getElementById('tasks');
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.innerHTML = `
            ${task.task}
            <div>
                <button onclick="toggleTask(${index})">✓</button>
                <button onclick="deleteTask(${index})">🗑️</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    renderTasks(await fetchTasks());
});