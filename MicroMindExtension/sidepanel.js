// sidepanel.js — Sidepanel script for MicroMind Extension

let tasks = [];

const spTaskInput = document.getElementById('spTaskInput');
const spAddTaskBtn = document.getElementById('spAddTaskBtn');
const streakCount = document.getElementById('streakCount');

const q1List = document.getElementById('q1List');
const q2List = document.getElementById('q2List');
const q3List = document.getElementById('q3List');
const q4List = document.getElementById('q4List');
const inboxList = document.getElementById('inboxList');

const q1Count = document.getElementById('q1Count');
const q2Count = document.getElementById('q2Count');
const q3Count = document.getElementById('q3Count');
const q4Count = document.getElementById('q4Count');

// Load tasks from storage
function loadData() {
  chrome.storage.local.get(['micromind_tasks', 'micromind_streak'], (data) => {
    tasks = data.micromind_tasks || [];
    const streak = data.micromind_streak || 1;
    streakCount.textContent = `🔥 ${streak}d`;
    render();
  });
}

// Storage change listener for real-time updates
chrome.storage.onChanged.addListener((changes) => {
  if (changes.micromind_tasks) {
    tasks = changes.micromind_tasks.newValue || [];
    render();
  }
});

function classifyCategory(text) {
  const lower = text.toLowerCase();
  if (/\b(urgent|asap|critical|due today|today|fix|bug)\b/.test(lower)) return 'q1';
  if (/\b(plan|strategy|goals|study|learn|workout|design|read)\b/.test(lower)) return 'q2';
  if (/\b(email|call|reply|text|meeting|sync|book)\b/.test(lower)) return 'q3';
  if (/\b(scroll|browse|watch|game|social)\b/.test(lower)) return 'q4';
  return 'inbox';
}

spAddTaskBtn.addEventListener('click', handleAddTask);
spTaskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAddTask();
});

function handleAddTask() {
  const text = spTaskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: Math.random().toString(36).slice(2, 10),
    text,
    completed: false,
    category: classifyCategory(text),
    createdAt: Date.now(),
  };

  tasks = [newTask, ...tasks];
  chrome.storage.local.set({ micromind_tasks: tasks });
  spTaskInput.value = '';
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  chrome.storage.local.set({ micromind_tasks: tasks });
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  chrome.storage.local.set({ micromind_tasks: tasks });
}

function createTaskItem(t) {
  const item = document.createElement('div');
  item.className = `sp-task-item ${t.completed ? 'completed' : ''}`;

  const check = document.createElement('div');
  check.className = `sp-task-checkbox ${t.completed ? 'checked' : ''}`;
  check.textContent = t.completed ? '✓' : '';
  check.onclick = () => toggleTask(t.id);

  const span = document.createElement('span');
  span.className = 'sp-task-text';
  span.textContent = t.text;

  const delBtn = document.createElement('button');
  delBtn.className = 'sp-delete-btn';
  delBtn.textContent = '✕';
  delBtn.onclick = () => deleteTask(t.id);

  item.appendChild(check);
  item.appendChild(span);
  item.appendChild(delBtn);
  return item;
}

function render() {
  const q1 = tasks.filter(t => t.category === 'q1');
  const q2 = tasks.filter(t => t.category === 'q2');
  const q3 = tasks.filter(t => t.category === 'q3');
  const q4 = tasks.filter(t => t.category === 'q4');
  const inbox = tasks.filter(t => t.category === 'inbox' || !t.category);

  q1Count.textContent = q1.length;
  q2Count.textContent = q2.length;
  q3Count.textContent = q3.length;
  q4Count.textContent = q4.length;

  q1List.innerHTML = '';
  q1.forEach(t => q1List.appendChild(createTaskItem(t)));

  q2List.innerHTML = '';
  q2.forEach(t => q2List.appendChild(createTaskItem(t)));

  q3List.innerHTML = '';
  q3.forEach(t => q3List.appendChild(createTaskItem(t)));

  q4List.innerHTML = '';
  q4.forEach(t => q4List.appendChild(createTaskItem(t)));

  inboxList.innerHTML = '';
  inbox.forEach(t => inboxList.appendChild(createTaskItem(t)));
}

loadData();
