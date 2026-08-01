// popup.js — Popup logic for MicroMind Extension

const DEFAULT_HABITS = [
  { id: 'h1', emoji: '💧', label: 'Water', done: false },
  { id: 'h2', emoji: '🚶', label: 'Walk', done: false },
  { id: 'h3', emoji: '📖', label: 'Read', done: false },
  { id: 'h4', emoji: '🧘', label: 'Meditate', done: false },
];

let tasks = [];
let habits = DEFAULT_HABITS;
let timerSeconds = 25 * 60;
let timerInterval = null;

// DOM Elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const aiPreview = document.getElementById('aiPreview');
const aiBadge = document.getElementById('aiBadge');
const aiTime = document.getElementById('aiTime');
const habitsRow = document.getElementById('habitsRow');
const timerText = document.getElementById('timerText');
const timerToggleBtn = document.getElementById('timerToggleBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const openSidePanelBtn = document.getElementById('openSidePanelBtn');

// Initialize State from Storage
chrome.storage.local.get(['micromind_tasks', 'micromind_habits'], (data) => {
  tasks = data.micromind_tasks || [];
  habits = data.micromind_habits || DEFAULT_HABITS;
  render();
});

// Category classifier
function classify(text) {
  const lower = text.toLowerCase();
  if (/\b(urgent|asap|critical|due today|today|fix|bug)\b/.test(lower)) return 'Q1 DO FIRST';
  if (/\b(plan|strategy|goals|study|learn|workout|design|read)\b/.test(lower)) return 'Q2 SCHEDULE';
  if (/\b(email|call|reply|text|meeting|sync|book)\b/.test(lower)) return 'Q3 DELEGATE';
  if (/\b(scroll|browse|watch|game|social)\b/.test(lower)) return 'Q4 ELIMINATE';
  return 'INBOX';
}

function estimate(text) {
  const words = text.split(/\s+/).length;
  if (words > 10) return '45m';
  if (words > 5) return '30m';
  return '15m';
}

// Input key listeners
taskInput.addEventListener('input', () => {
  const val = taskInput.value.trim();
  if (val) {
    aiPreview.classList.remove('hidden');
    aiBadge.textContent = classify(val);
    aiTime.textContent = estimate(val);
  } else {
    aiPreview.classList.add('hidden');
  }
});

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAddTask();
});
addTaskBtn.addEventListener('click', handleAddTask);

function handleAddTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: Math.random().toString(36).slice(2, 10),
    text,
    completed: false,
    category: classify(text).toLowerCase().replace(' ', '-'),
    createdAt: Date.now(),
  };

  tasks = [newTask, ...tasks];
  saveTasks();
  taskInput.value = '';
  aiPreview.classList.add('hidden');
  render();
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function toggleHabit(id) {
  habits = habits.map(h => h.id === id ? { ...h, done: !h.done } : h);
  chrome.storage.local.set({ micromind_habits: habits });
  renderHabits();
}

function saveTasks() {
  chrome.storage.local.set({ micromind_tasks: tasks });
}

// Render Functions
function render() {
  taskCount.textContent = tasks.length;
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.innerHTML = '<div style="font-size:12px; color:var(--text-secondary); text-align:center; padding:12px;">No tasks. Brain dump above!</div>';
  } else {
    tasks.forEach(t => {
      const item = document.createElement('div');
      item.className = `task-item ${t.completed ? 'completed' : ''}`;

      const check = document.createElement('div');
      check.className = `task-checkbox ${t.completed ? 'checked' : ''}`;
      check.textContent = t.completed ? '✓' : '';
      check.onclick = () => toggleTask(t.id);

      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = t.text;

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = '✕';
      delBtn.onclick = () => deleteTask(t.id);

      item.appendChild(check);
      item.appendChild(span);
      item.appendChild(delBtn);
      taskList.appendChild(item);
    });
  }

  renderHabits();
}

function renderHabits() {
  habitsRow.innerHTML = '';
  habits.forEach(h => {
    const chip = document.createElement('div');
    chip.className = `habit-chip ${h.done ? 'done' : ''}`;
    chip.innerHTML = `<span>${h.emoji}</span><span>${h.label}</span>`;
    chip.onclick = () => toggleHabit(h.id);
    habitsRow.appendChild(chip);
  });
}

// Timer Logic
timerToggleBtn.addEventListener('click', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerToggleBtn.textContent = 'Start Focus';
  } else {
    timerToggleBtn.textContent = 'Pause';
    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerDisplay();
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerToggleBtn.textContent = 'Done!';
      }
    }, 1000);
  }
});

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  timerText.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Side Panel Launcher
openSidePanelBtn.addEventListener('click', async () => {
  if (chrome.sidePanel?.open) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId) {
      chrome.sidePanel.open({ windowId: tab.windowId });
      window.close();
    }
  } else {
    alert('Pin side panel directly from Chrome toolbar menu!');
  }
});
