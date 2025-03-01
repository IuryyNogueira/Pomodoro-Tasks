document.addEventListener("DOMContentLoaded", function () {
  const taskForm = document.getElementById("task-form");
  const groupForm = document.getElementById("group-form");
  const taskList = document.getElementById("task-list");
  const groupSelect = document.getElementById("group-select");

  taskForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const taskInput = document.getElementById("task-input");
    const group = groupSelect.value;
    const task = taskInput.value.trim();

    if (task) {
      fetch("/tasks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task, group }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            alert(data.error);
          } else {
            loadTasks(group);
            taskInput.value = "";
          }
        });
    }
  });

  groupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const groupInput = document.getElementById("group-input");
    const group = groupInput.value.trim();

    if (group) {
      fetch("/tasks/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ group }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            alert(data.error);
          } else {
            const option = document.createElement("option");
            option.value = group;
            option.textContent = group;
            groupSelect.appendChild(option);
            groupInput.value = "";
          }
        });
    }
  });

  groupSelect.addEventListener("change", function () {
    loadTasks(groupSelect.value);
  });

  function loadTasks(group) {
    fetch(`/tasks/?group=${group}`)
      .then((response) => response.json())
      .then((data) => {
        taskList.innerHTML = "";
        if (data[group]) {
          data[group].forEach((task, index) => {
            const li = document.createElement("li");
            li.textContent = task.task;
            if (task.completed) {
              li.classList.add("completed");
            }
            li.addEventListener("click", function () {
              fetch(`/tasks/${index}?group=${group}`, {
                method: "PUT",
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.error) {
                    alert(data.error);
                  } else {
                    loadTasks(group);
                  }
                });
            });
            taskList.appendChild(li);
          });
        }
      });
  }

  loadTasks(groupSelect.value);
});
