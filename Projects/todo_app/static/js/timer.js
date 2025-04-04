const socket = io();

// Handle task updates dynamically
socket.on('update_tasks', (tasks) => {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = ''; // Clear existing tasks

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        li.innerHTML = `${task.content} - Due in <span class="timer" data-due="${task.due_date}"></span>
                        <button class="delete-btn" data-id="${task.id}">Delete</button>`;
        taskList.appendChild(li);
    });

    attachDeleteListeners(); // Reattach delete listeners
    startTimers(); // Re-initialize timers
});

// Submit task form
document.getElementById('task-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const content = document.getElementById('content').value;
    const due_in = document.getElementById('due_in').value;

    socket.emit('add_task', { content, due_in });
    document.getElementById('task-form').reset();
});

// Attach delete listeners to buttons
function attachDeleteListeners() {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const taskId = button.dataset.id;
            socket.emit('delete_task', { id: taskId });
        });
    });
}

// Start countdown timers
function startTimers() {
    const timers = document.querySelectorAll('.timer');

    timers.forEach(timer => {
        const dueDate = new Date(timer.dataset.due);

        function updateTimer() {
            const now = new Date();
            const timeLeft = dueDate - now;

            if (timeLeft <= 0) {
                timer.textContent = "Expired";
                return;
            }

            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);

            timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            setTimeout(updateTimer, 1000); // Update every second
        }

        updateTimer();
    });
}

attachDeleteListeners();
startTimers();
