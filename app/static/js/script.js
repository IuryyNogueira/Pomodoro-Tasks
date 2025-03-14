let timerId = null;
let timeLeft = 25 * 60;
let currentMode = "work";

const modes = {
  work: { time: 25, bg: "work-mode" },
  "short-break": { time: 8, bg: "short-break-mode" },
  "long-break": { time: 26, bg: "long-break-mode" },
};

// Gera ou recupera um ID único para o usuário
function getUserId() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("userId", userId);
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

// Groups - Local Storage
function saveGroups(groups) {
  const userId = getUserId();
  localStorage.setItem(`groups_${userId}`, JSON.stringify(groups));
}

function loadGroups() {
  const userId = getUserId();
  const groups = localStorage.getItem(`groups_${userId}`);
  return groups ? JSON.parse(groups) : ["Todas"];
}

// Sound Effects
const buttonSound = new Audio("/static/sounds/button.mp3");
const levelUpSound = new Audio("/static/sounds/level-up.mp3");

buttonSound.addEventListener("canplaythrough", () =>
  console.log("Button sound loaded")
);
levelUpSound.addEventListener("canplaythrough", () =>
  console.log("Level-up sound loaded")
);

// Request Notification Permission
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Timer
function startTimer() {
  if (!timerId) {
    console.log("Playing button sound");
    buttonSound.play();
    document.querySelector(".timer-button.start").classList.add("active"); // Mark start button as active
    timerId = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();

      if (timeLeft <= 0) {
        clearInterval(timerId);
        timerId = null;
        document
          .querySelector(".timer-button.start")
          .classList.remove("active"); // Remove active class
        console.log("Playing level-up sound");
        levelUpSound.play();
        showNotification("Meus Parabéns! 🎉", "Pode relaxar... ");
        switchMode(currentMode === "work" ? "short-break" : "work");
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
  console.log("Playing button sound");
  buttonSound.play();
  document.querySelector(".timer-button.start").classList.remove("active"); // Remove active class
}

function showNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  document.getElementById("timer").textContent = `${minutes}:${seconds}`;
}

// Modos
function switchMode(mode) {
  currentMode = mode;
  timeLeft = modes[mode].time * 60;
  document.body.className = modes[mode].bg;
  resetTimer();
}

// Groups - Interface (updated)
document.getElementById("group-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const groupInput = document.getElementById("group-input");
  const groupName = groupInput.value.trim();

  if (groupName) {
    const groups = loadGroups();
    if (!groups.includes(groupName)) {
      groups.push(groupName);
      saveGroups(groups);
      groupInput.value = "";
      renderGroups(groups);
      renderGroupTabs(groups);
    }
  }
});

function renderGroups(groups) {
  const groupSelect = document.getElementById("group-select");
  groupSelect.innerHTML = "";

  groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    groupSelect.appendChild(option);
  });
}

function deleteGroup(groupName) {
  let groups = loadGroups();
  groups = groups.filter((group) => group !== groupName);
  saveGroups(groups);
  renderGroups(groups);
  renderGroupTabs(groups);
  renderTasks(loadTasks());
}

function renderGroupTabs(groups) {
  const groupTabs = document.getElementById("group-tabs");
  groupTabs.innerHTML = "";

  const allTab = document.createElement("button");
  allTab.textContent = "Todas";
  allTab.className = "group-tab";
  allTab.onclick = () => {
    renderTasks(loadTasks());
    highlightSelectedGroup(allTab);
    document.getElementById("group-select").value = "Todas";
  };
  groupTabs.appendChild(allTab);

  groups.forEach((group) => {
    const tab = document.createElement("div");
    tab.className = "group-tab-container";
    tab.innerHTML = `
      <button class="group-tab" onclick="toggleGroupTab(this, '${group}')">
        ${group} <span class="delete-group" onclick="deleteGroup('${group}')">x</span>
      </button>
    `;
    groupTabs.appendChild(tab);
  });
}

function toggleGroupTab(tab, group) {
  if (tab.classList.contains("selected")) {
    tab.classList.remove("selected");
    renderTasks(loadTasks());
    document.getElementById("group-select").value = "Todas";
  } else {
    const tabs = document.querySelectorAll(".group-tab");
    tabs.forEach((t) => t.classList.remove("selected"));
    tab.classList.add("selected");
    renderTasks(loadTasks().filter((task) => task.group === group));
    document.getElementById("group-select").value = group;
  }
}

function highlightSelectedGroup(selectedTab) {
  const tabs = document.querySelectorAll(".group-tab");
  tabs.forEach((tab) => tab.classList.remove("selected"));
  selectedTab.classList.add("selected");
}

// Tasks - Interface (updated)
document.getElementById("task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const taskInput = document.getElementById("task-input");
  const taskText = taskInput.value.trim();
  const groupSelect = document.getElementById("group-select");
  const groupName = groupSelect.value;

  if (taskText) {
    const tasks = loadTasks();
    tasks.unshift({
      task: taskText,
      group: groupName,
      completed: false,
      pomodoros: 0, // contador iniciado em 0
    });
    saveTasks(tasks);
    taskInput.value = "";
    renderTasks(tasks.filter((task) => task.group === groupName)); // Filter tasks by selected group
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
  const taskList = document.getElementById("tasks");
  taskList.innerHTML =
    tasks.length > 0 ? "" : '<li class="empty">Nenhuma tarefa ainda!</li>';

  // Separate completed and incomplete tasks
  const incompleteTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  // Helper function to render each task item
  function renderTaskItem(task) {
    const index = tasks.indexOf(task);
    return `
      <li class="${task.completed ? "completed" : ""}">
        <span>${task.task} (${task.group})</span>
        <div class="task-actions">
            <button class="increment-btn" onclick="incrementPomodoro(${index})">+</button>
            <span class="pomodoro-counter">${task.pomodoros || 0}</span>
            <button class="decrement-btn" onclick="decrementPomodoro(${index})">-</button>
            <button class="complete-btn" onclick="toggleTask(${index})">✓</button>
            <button class="delete-btn" onclick="deleteTask(${index})">🗑️</button>
        </div>
      </li>
    `;
  }

  // Render incomplete tasks
  incompleteTasks.forEach((task) => {
    taskList.innerHTML += renderTaskItem(task);
  });

  // Render completed tasks
  completedTasks.forEach((task) => {
    taskList.innerHTML += renderTaskItem(task);
  });
}

function incrementPomodoro(index) {
  const tasks = loadTasks();
  if (!tasks[index].pomodoros) {
    tasks[index].pomodoros = 0;
  }
  tasks[index].pomodoros++;
  saveTasks(tasks);
  renderTasks(tasks);
}

function decrementPomodoro(index) {
  const tasks = loadTasks();
  if (tasks[index].pomodoros > 0) {
    tasks[index].pomodoros--;
    saveTasks(tasks);
    renderTasks(tasks);
  }
}

// Inicialização (updated)
document.addEventListener("DOMContentLoaded", () => {
  const groups = loadGroups();
  renderGroups(groups);
  renderGroupTabs(groups);
  renderTasks(loadTasks());
  document.getElementById("group-select").value = "Todas"; // Set default group selection to "Todas"
  document.getElementById("work-time").value = modes.work.time;
  document.getElementById("short-break-time").value = modes["short-break"].time;
  document.getElementById("long-break-time").value = modes["long-break"].time;

  // Preload images
  preloadImages([
    "/static/images/sleeping-cat.gif",
    "/static/images/clouds.png",
    "/static/images/tardeN.png",
    "/static/images/tardE.png",
    "/static/images/nightT.png",
    "/static/images/night.gif",
  ]);
});

function toggleSettings() {
  const settings = document.getElementById("settings");
  settings.classList.toggle("hidden");
}

function saveSettings() {
  const workTime = parseInt(document.getElementById("work-time").value, 10);
  const shortBreakTime = parseInt(
    document.getElementById("short-break-time").value,
    10
  );
  const longBreakTime = parseInt(
    document.getElementById("long-break-time").value,
    10
  );

  if (workTime > 0 && shortBreakTime > 0 && longBreakTime > 0) {
    modes.work.time = workTime;
    modes["short-break"].time = shortBreakTime;
    modes["long-break"].time = longBreakTime;
    resetTimer();
    toggleSettings();
  } else {
    alert("Por favor, insira valores válidos.");
  }
}

function preloadImages(imageUrls) {
  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}
