/**
 * MicroMind - app.js
 * Core Application Logic
 * - State management with localStorage persistence
 * - Brain Dump task creation
 * - Drag-and-drop task sorting
 * - Eisenhower matrix quadrant management
 * - Focus Three slot management
 * - Canvas particle burst animation on task completion
 * - Streak and daily completion tracking
 * - Daily reset functionality
 */

// ============================================================
// State Management
// ============================================================
const STATE_KEY = 'micromind_state';
const LAST_RESET_KEY = 'micromind_last_reset';
const STREAK_KEY = 'micromind_streak';

const DEFAULT_HABITS = [
    { id: 'habit-1', emoji: '💧', label: 'Drink Water', done: false },
    { id: 'habit-2', emoji: '🚶', label: 'Take a Walk', done: false },
    { id: 'habit-3', emoji: '📖', label: 'Read 10 Min', done: false },
    { id: 'habit-4', emoji: '🧘', label: 'Breathe / Meditate', done: false },
    { id: 'habit-5', emoji: '📵', label: 'No Phone 1hr', done: false },
    { id: 'habit-6', emoji: '🌙', label: 'Sleep by 11pm', done: false },
];

let state = {
    tasks: [],       // { id, text, category, completed, createdAt }
    habits: [],      // { id, emoji, label, done }
    focusSlots: {    // { 'focus-1': taskId|null, 'focus-2': taskId|null, 'focus-3': taskId|null }
        'focus-1': null,
        'focus-2': null,
        'focus-3': null,
    },
};

let streak = 0;
let draggedTaskId = null;

// ============================================================
// Persistence
// ============================================================
function saveState() {
    try {
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
        localStorage.setItem(STREAK_KEY, String(streak));
    } catch (e) { console.warn('Could not save state:', e); }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STATE_KEY);
        if (raw) state = { ...state, ...JSON.parse(raw) };
        if (!state.habits || state.habits.length === 0) state.habits = DEFAULT_HABITS.map(h => ({ ...h }));
        streak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
    } catch (e) {
        console.warn('Could not load state:', e);
        state.habits = DEFAULT_HABITS.map(h => ({ ...h }));
    }
}

// ============================================================
// Utility
// ============================================================
function generateId() {
    return 'task-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function showToast(message, icon = '✅') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================================
// Particle Burst Animation (Canvas)
// ============================================================
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1;
        this.decay = 0.025 + Math.random() * 0.02;
        this.radius = 3 + Math.random() * 4;
        const colors = ['#7c6fe0', '#34d399', '#fbbf24', '#f87171', '#22d3ee', '#a78bfa'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.18; // gravity
        this.vx *= 0.98;
        this.life -= this.decay;
        this.radius *= 0.97;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    }
}

function spawnParticles(x, y, count = 28) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });
    if (particles.length > 0) requestAnimationFrame(animateParticles);
}

let animating = false;
function triggerParticleBurst(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    spawnParticles(x, y);
    if (!animating) {
        animating = true;
        requestAnimationFrame(function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles = particles.filter(p => p.life > 0);
            particles.forEach(p => { p.update(); p.draw(); });
            if (particles.length > 0) requestAnimationFrame(loop);
            else animating = false;
        });
    }
}

// ============================================================
// Task Creation
// ============================================================
function createTask(text, category = 'inbox') {
    const task = {
        id: generateId(),
        text: text.trim(),
        category,
        completed: false,
        createdAt: Date.now(),
    };
    state.tasks.push(task);
    saveState();
    return task;
}

function addTaskFromInput() {
    const input = document.getElementById('dump-input');
    const text = input.value.trim();
    if (!text) return;
    createTask(text, 'inbox');
    input.value = '';
    renderAll();
}

// ============================================================
// Task Completion Toggle
// ============================================================
function toggleTaskComplete(taskId, checkboxEl) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.completed = !task.completed;
    saveState();

    if (task.completed) {
        triggerParticleBurst(checkboxEl);
    }

    renderAll();
    updateProgressRing();
}

// ============================================================
// Task Deletion
// ============================================================
function deleteTask(taskId) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    // Clean up focus slots
    for (const slot in state.focusSlots) {
        if (state.focusSlots[slot] === taskId) state.focusSlots[slot] = null;
    }
    saveState();
    renderAll();
}

// ============================================================
// Drag and Drop
// ============================================================
function setupDragAndDrop(taskEl, taskId) {
    taskEl.setAttribute('draggable', 'true');

    taskEl.addEventListener('dragstart', (e) => {
        draggedTaskId = taskId;
        taskEl.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId);
    });

    taskEl.addEventListener('dragend', () => {
        taskEl.classList.remove('dragging');
        draggedTaskId = null;
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });
}

function setupDropZone(containerEl, category) {
    containerEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        containerEl.classList.add('drag-over');
    });

    containerEl.addEventListener('dragleave', (e) => {
        if (!containerEl.contains(e.relatedTarget)) {
            containerEl.classList.remove('drag-over');
        }
    });

    containerEl.addEventListener('drop', (e) => {
        e.preventDefault();
        containerEl.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
        if (!taskId) return;

        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Handle focus slot drops
        if (category.startsWith('focus-')) {
            // Check if slot is already occupied by another task
            const currentInSlot = state.focusSlots[category];
            if (currentInSlot && currentInSlot !== taskId) {
                // Move the previous task back to inbox
                const prevTask = state.tasks.find(t => t.id === currentInSlot);
                if (prevTask) prevTask.category = 'inbox';
                // Remove from old focus slot if it had one
                for (const s in state.focusSlots) {
                    if (state.focusSlots[s] === taskId) state.focusSlots[s] = null;
                }
            }
            // Remove task from its old focus slot (if already in focus)
            for (const s in state.focusSlots) {
                if (state.focusSlots[s] === taskId) state.focusSlots[s] = null;
            }
            state.focusSlots[category] = taskId;
            task.category = category;
        } else {
            // Moving between matrix/inbox quadrants
            // If the task was in a focus slot, clear it
            for (const s in state.focusSlots) {
                if (state.focusSlots[s] === taskId) state.focusSlots[s] = null;
            }
            task.category = category;
        }

        saveState();
        renderAll();
    });
}

// ============================================================
// Build a Task Element
// ============================================================
function buildTaskEl(task) {
    const el = document.createElement('div');
    el.className = 'task-item shine-anim' + (task.completed ? ' completed' : '');
    el.id = 'task-' + task.id;

    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '<span></span><span></span><span></span>';

    const checkbox = document.createElement('div');
    checkbox.className = 'task-checkbox' + (task.completed ? ' checked' : '');
    if (task.completed) {
        checkbox.innerHTML = '';
    }
    checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTaskComplete(task.id, checkbox);
    });

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete-btn';
    deleteBtn.title = 'Delete task';
    deleteBtn.innerHTML = '<i data-lucide="x"></i>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        el.style.opacity = '0';
        el.style.transform = 'scale(0.92) translateX(10px)';
        el.style.transition = '200ms ease';
        setTimeout(() => deleteTask(task.id), 200);
    });

    el.appendChild(dragHandle);
    el.appendChild(checkbox);
    el.appendChild(text);
    el.appendChild(deleteBtn);

    setupDragAndDrop(el, task.id);

    return el;
}

// ============================================================
// Render Lists
// ============================================================
function renderTasksInContainer(containerId, tasks) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (tasks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `<i data-lucide="inbox"></i><p>Drop tasks here</p>`;
        container.appendChild(empty);
    } else {
        tasks.forEach(task => {
            container.appendChild(buildTaskEl(task));
        });
    }
}

function renderInbox() {
    const tasks = state.tasks.filter(t => t.category === 'inbox');
    const container = document.getElementById('inbox-list');
    container.innerHTML = '';

    if (tasks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `<i data-lucide="sparkles"></i><p>Mind is clear! Type above to dump thoughts.</p>`;
        container.appendChild(empty);
    } else {
        tasks.forEach(task => container.appendChild(buildTaskEl(task)));
    }

    document.getElementById('inbox-count').textContent = tasks.filter(t => !t.completed).length;
}

function renderMatrix() {
    ['q1', 'q2', 'q3', 'q4'].forEach(q => {
        const tasks = state.tasks.filter(t => t.category === q);
        renderTasksInContainer(`${q}-list`, tasks);
    });
}

function renderFocusSlots() {
    ['focus-1', 'focus-2', 'focus-3'].forEach(slotKey => {
        const slotTarget = document.querySelector(`[data-category="${slotKey}"]`);
        if (!slotTarget) return;

        slotTarget.innerHTML = '';
        const taskId = state.focusSlots[slotKey];
        const task = taskId ? state.tasks.find(t => t.id === taskId) : null;

        if (task) {
            const taskEl = buildTaskEl(task);
            slotTarget.appendChild(taskEl);
        } else {
            const placeholder = document.createElement('span');
            placeholder.className = 'slot-placeholder';
            const slotNum = slotKey.replace('focus-', '');
            const labels = { '1': 'Drag primary focus here', '2': 'Drag secondary focus here', '3': 'Drag tertiary focus here' };
            placeholder.textContent = labels[slotNum] || 'Drop a task here';
            slotTarget.appendChild(placeholder);
        }
    });
}

function renderHabits() {
    const container = document.getElementById('habits-container');
    container.innerHTML = '';

    state.habits.forEach(habit => {
        const el = document.createElement('div');
        el.className = 'habit-item' + (habit.done ? ' done' : '');
        el.innerHTML = `
            <span class="habit-dot"></span>
            <span class="habit-emoji">${habit.emoji}</span>
            <span class="habit-label">${habit.label}</span>
        `;
        el.addEventListener('click', () => {
            habit.done = !habit.done;
            saveState();
            renderHabits();
        });
        container.appendChild(el);
    });
}

function renderAll() {
    renderInbox();
    renderMatrix();
    renderFocusSlots();
    renderHabits();
    updateProgressRing();
    updateStreak();
    lucide.createIcons();
}

// ============================================================
// Progress Ring
// ============================================================
function updateProgressRing() {
    const allTasks = state.tasks.filter(t => !t.category.startsWith('focus'));
    const focusTasks = [];
    for (const slot in state.focusSlots) {
        const id = state.focusSlots[slot];
        if (id) {
            const t = state.tasks.find(t => t.id === id);
            if (t) focusTasks.push(t);
        }
    }
    const allUnique = [...new Set([...allTasks, ...focusTasks])];
    const total = allUnique.length;
    const done = allUnique.filter(t => t.completed).length;

    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const circumference = 2 * Math.PI * 24; // r=24 → ~150.8
    const offset = circumference - (pct / 100) * circumference;

    const circle = document.getElementById('progress-circle');
    if (circle) circle.style.strokeDashoffset = offset;

    const pctEl = document.getElementById('progress-percentage');
    if (pctEl) pctEl.textContent = pct + '%';

    const ratioEl = document.getElementById('task-ratio');
    if (ratioEl) ratioEl.textContent = `${done}/${total}`;
}

// ============================================================
// Streak
// ============================================================
function updateStreak() {
    const el = document.getElementById('streak-count');
    if (el) el.textContent = streak;
}

// ============================================================
// Daily Reset
// ============================================================
function performDailyReset() {
    const completed = state.tasks.filter(t => t.completed).length;
    const total = state.tasks.length;

    // Increment streak if at least one task was completed
    if (completed > 0) {
        streak++;
    }

    // Archive (remove) completed tasks, keep incomplete
    state.tasks = state.tasks.filter(t => !t.completed);

    // Clear focus slots where tasks were completed (they're now deleted)
    for (const slot in state.focusSlots) {
        const taskId = state.focusSlots[slot];
        if (taskId) {
            const taskExists = state.tasks.find(t => t.id === taskId);
            if (!taskExists) state.focusSlots[slot] = null;
        }
    }

    // Reset habits
    state.habits = state.habits.map(h => ({ ...h, done: false }));

    // Save last reset date
    localStorage.setItem(LAST_RESET_KEY, new Date().toDateString());

    saveState();
    renderAll();

    showToast(
        `Reset complete! 🎉 ${completed}/${total} tasks done. Streak: ${streak} day${streak !== 1 ? 's' : ''}!`,
        '🌙'
    );
}

// ============================================================
// Event Listeners - Init
// ============================================================
function initEventListeners() {
    const input = document.getElementById('dump-input');
    const submitBtn = document.getElementById('dump-submit-btn');
    const clearBtn = document.getElementById('clear-inbox-btn');
    const resetBtn = document.getElementById('daily-reset-btn');

    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addTaskFromInput();
        });
    }
    if (submitBtn) submitBtn.addEventListener('click', addTaskFromInput);

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            state.tasks = state.tasks.filter(t => !(t.category === 'inbox' && t.completed));
            saveState();
            renderAll();
            showToast('Cleared completed inbox tasks!', '🧹');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Perform daily reset? Completed tasks will be archived and habits reset.')) {
                performDailyReset();
            }
        });
    }

    // Set up all drop zones
    const zones = [
        { id: 'inbox-list',   category: 'inbox' },
        { id: 'q1-list',      category: 'q1' },
        { id: 'q2-list',      category: 'q2' },
        { id: 'q3-list',      category: 'q3' },
        { id: 'q4-list',      category: 'q4' },
    ];

    zones.forEach(({ id, category }) => {
        const el = document.getElementById(id);
        if (el) setupDropZone(el, category);
    });

    // Focus slot drop zones
    ['focus-1', 'focus-2', 'focus-3'].forEach(slotKey => {
        const el = document.querySelector(`[data-category="${slotKey}"]`);
        if (el) setupDropZone(el, slotKey);
    });

    // Canvas resize
    window.addEventListener('resize', resizeCanvas);
}

// ============================================================
// Init Date Display
// ============================================================
function initDateDisplay() {
    const el = document.getElementById('current-date');
    if (el) el.textContent = formatDate(new Date());
}

// ============================================================
// Boot
// ============================================================
function init() {
    resizeCanvas();
    loadState();
    initDateDisplay();
    initEventListeners();
    renderAll();
}

// Wait for DOM + Lucide to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
