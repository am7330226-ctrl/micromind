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
// ============================================================
// Node.js API Auth & Persistence
// ============================================================
let currentUserToken = localStorage.getItem('micromind_token') || null;
let isLoginMode = true;

function initAuth() {
    const authModal = document.getElementById('auth-modal');
    const authForm = document.getElementById('auth-form');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const submitBtn = document.getElementById('auth-submit-btn');
    const authTitle = document.getElementById('auth-title');
    const errorEl = document.getElementById('auth-error');
    const logoutBtn = document.getElementById('logout-btn');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            authTitle.textContent = isLoginMode ? 'Welcome to MicroMind' : 'Create an Account';
            submitBtn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
            toggleText.textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
            toggleBtn.textContent = isLoginMode ? 'Sign Up' : 'Log In';
            errorEl.textContent = '';
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            errorEl.textContent = 'Loading...';

            try {
                const endpoint = isLoginMode ? '/api/login' : '/api/register';
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    errorEl.textContent = data.error || 'An error occurred';
                    return;
                }

                currentUserToken = data.token;
                localStorage.setItem('micromind_token', currentUserToken);
                
                authModal.classList.remove('active');
                if (logoutBtn) logoutBtn.style.display = 'block';
                
                loadState();
            } catch (err) {
                errorEl.textContent = 'Failed to connect to server';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            currentUserToken = null;
            localStorage.removeItem('micromind_token');
            authModal.classList.add('active');
            logoutBtn.style.display = 'none';
            // Clear current view
            state.tasks = [];
            renderAll();
        });
    }

    // Check initial auth state
    if (currentUserToken) {
        authModal.classList.remove('active');
        if (logoutBtn) logoutBtn.style.display = 'block';
        loadState();
    } else {
        authModal.classList.add('active');
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

async function saveState() {
    if (!currentUserToken) return;
    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': currentUserToken
            },
            body: JSON.stringify({
                state: state,
                streak: streak,
                lastReset: localStorage.getItem(LAST_RESET_KEY) || ''
            })
        });
    } catch (e) { console.warn('Could not save state to server:', e); }
}

async function loadState() {
    if (!currentUserToken) return;
    try {
        const response = await fetch('/api/data', {
            headers: { 'Authorization': currentUserToken }
        });
        
        if (response.status === 401) {
            // Invalid token
            currentUserToken = null;
            localStorage.removeItem('micromind_token');
            document.getElementById('auth-modal').classList.add('active');
            document.getElementById('logout-btn').style.display = 'none';
            return;
        }

        if (response.ok) {
            const data = await response.json();
            if (data) {
                if (data.state) state = { ...state, ...data.state };
                if (data.streak !== undefined) streak = data.streak;
                if (data.lastReset) localStorage.setItem(LAST_RESET_KEY, data.lastReset);
            }
        }
        
        if (!state.habits || state.habits.length === 0) state.habits = DEFAULT_HABITS.map(h => ({ ...h }));
        renderAll();
    } catch (e) {
        console.warn('Could not load state from server:', e);
        if (!state.habits || state.habits.length === 0) state.habits = DEFAULT_HABITS.map(h => ({ ...h }));
        renderAll();
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
    initDateDisplay();
    initEventListeners();
    initAuth(); 
}

// Wait for DOM + Lucide to be ready
function bootApp() {
    init();
    initPomodoro();
    requestNotifPermission();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered!', reg))
            .catch(err => console.error('SW register failed:', err));
    }
}


// ============================================================
// POMODORO TIMER MODULE
// ============================================================
const POMO_DURATIONS = {
    focus: 25 * 60,
    short:  5 * 60,
    long:  15 * 60,
};

const POMO_LABELS = {
    focus: 'Focus Time',
    short: 'Short Break',
    long:  'Long Break',
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 88; // ≈ 552.9

const pomo = {
    mode:           'focus',
    secondsLeft:    POMO_DURATIONS.focus,
    totalSeconds:   POMO_DURATIONS.focus,
    running:        false,
    intervalId:     null,
    sessions:       0,
    linkedTaskId:   null,
    linkedTaskText: null,
};

/* --- DOM refs (resolved after DOMContentLoaded) --- */
let pomoWidget, pomoBackdrop, pomoToggleBtn,
    pomoCloseBtn, pomoStartBtn, pomoResetBtn, pomoSkipBtn,
    pomoTimeEl, pomoModeLabelEl, pomoRingFill,
    pomoSessionDotsEl, pomoTaskLabelEl, pomoFocusSlotsEl,
    pomoPlayIcon, pomoStartLabel;

function initPomodoro() {
    pomoWidget        = document.getElementById('pomodoro-widget');
    pomoBackdrop      = document.getElementById('pomodoro-backdrop');
    pomoToggleBtn     = document.getElementById('pomodoro-toggle-btn');
    pomoCloseBtn      = document.getElementById('pomodoro-close-btn');
    pomoStartBtn      = document.getElementById('pomo-start-btn');
    pomoResetBtn      = document.getElementById('pomo-reset-btn');
    pomoSkipBtn       = document.getElementById('pomo-skip-btn');
    pomoTimeEl        = document.getElementById('pomo-time');
    pomoModeLabelEl   = document.getElementById('pomo-mode-label');
    pomoRingFill      = document.getElementById('pomo-ring-fill');
    pomoSessionDotsEl = document.getElementById('pomo-session-dots');
    pomoTaskLabelEl   = document.getElementById('pomodoro-task-label');
    pomoFocusSlotsEl  = document.getElementById('pomo-focus-slots');
    pomoPlayIcon      = document.getElementById('pomo-play-icon');
    pomoStartLabel    = document.getElementById('pomo-start-label');

    // Toggle open/close
    pomoToggleBtn.addEventListener('click', () => {
        const isOpen = pomoWidget.classList.contains('open');
        if (isOpen) pomodoroClose(); else pomodoroOpen();
    });
    pomoCloseBtn.addEventListener('click', pomodoroClose);
    pomoBackdrop.addEventListener('click', pomodoroClose);

    // Mode tabs
    document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (pomo.running) return; // can't switch while running
            pomoSetMode(btn.dataset.mode);
        });
    });

    // Controls
    pomoStartBtn.addEventListener('click', pomoToggleTimer);
    pomoResetBtn.addEventListener('click', pomoReset);
    pomoSkipBtn.addEventListener('click',  pomoSkip);

    // Init display
    pomoUpdateDisplay();
    pomoUpdateSessionDots();
    pomoRenderFocusTaskPicker();
}

function pomodoroOpen() {
    pomoRenderFocusTaskPicker();
    pomoWidget.classList.add('open');
    pomoBackdrop.classList.add('visible');
    lucide.createIcons();
}

function pomodoroClose() {
    pomoWidget.classList.remove('open');
    pomoBackdrop.classList.remove('visible');
}

/* --- Mode Switching --- */
function pomoSetMode(mode) {
    pomo.mode         = mode;
    pomo.secondsLeft  = POMO_DURATIONS[mode];
    pomo.totalSeconds = POMO_DURATIONS[mode];

    // Tabs
    document.querySelectorAll('.pomo-mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });

    // Widget colour class
    pomoWidget.classList.remove('mode-focus', 'mode-short', 'mode-long');
    pomoWidget.classList.add('mode-' + mode);

    pomoUpdateDisplay();
    pomoUpdateRing();
}

/* --- Timer Tick --- */
function pomoToggleTimer() {
    if (pomo.running) {
        pomoPause();
    } else {
        pomoStart();
    }
}

function pomoStart() {
    pomo.running = true;
    pomoWidget.classList.add('running');
    pomoUpdateStartBtn();

    // Show badge on header btn
    if (!document.querySelector('.pomo-running-badge')) {
        const badge = document.createElement('span');
        badge.className = 'pomo-running-badge';
        pomoToggleBtn.appendChild(badge);
    }

    pomo.intervalId = setInterval(() => {
        pomo.secondsLeft--;

        if (pomo.secondsLeft <= 0) {
            pomo.secondsLeft = 0;
            pomoUpdateDisplay();
            pomoUpdateRing();
            pomoTimerDone();
            return;
        }

        pomoUpdateDisplay();
        pomoUpdateRing();
    }, 1000);
}

function pomoPause() {
    pomo.running = false;
    clearInterval(pomo.intervalId);
    pomoWidget.classList.remove('running');
    pomoUpdateStartBtn();
}

function pomoReset() {
    pomoPause();
    pomo.secondsLeft  = POMO_DURATIONS[pomo.mode];
    pomo.totalSeconds = POMO_DURATIONS[pomo.mode];
    pomoUpdateDisplay();
    pomoUpdateRing();
    // Remove badge
    const badge = document.querySelector('.pomo-running-badge');
    if (badge) badge.remove();
}

function pomoSkip() {
    pomoPause();
    // Advance to next logical mode
    const next = pomo.mode === 'focus' ? 'short' : 'focus';
    pomoSetMode(next);
}

function pomoTimerDone() {
    pomoPause();

    // Count sessions (focus sessions only)
    if (pomo.mode === 'focus') {
        pomo.sessions = Math.min(pomo.sessions + 1, 8);
        pomoUpdateSessionDots();
    }

    // Flash the widget
    pomoWidget.classList.add('done-flash');
    setTimeout(() => pomoWidget.classList.remove('done-flash'), 1500);

    // Remove running badge
    const badge = document.querySelector('.pomo-running-badge');
    if (badge) badge.remove();

    // Browser notification
    if (Notification && Notification.permission === 'granted') {
        const isFocus = pomo.mode === 'focus';
        new Notification('MicroMind 🍅', {
            body: isFocus
                ? `Focus session done! Time for a break.`
                : `Break over! Ready to focus?`,
            icon: '🍅',
        });
    }

    // Toast in-app
    const msg = pomo.mode === 'focus'
        ? `🎉 Focus session done! ${pomo.sessions} session${pomo.sessions !== 1 ? 's' : ''} today.`
        : `✅ Break over — ready to focus again!`;
    showToast(msg, '🍅');

    // Auto-advance to next mode
    const next = pomo.mode === 'focus' ? 'short' : 'focus';
    pomoSetMode(next);
}

/* --- Display Helpers --- */
function pomoUpdateDisplay() {
    const m = Math.floor(pomo.secondsLeft / 60).toString().padStart(2, '0');
    const s = (pomo.secondsLeft % 60).toString().padStart(2, '0');
    pomoTimeEl.textContent   = `${m}:${s}`;
    pomoModeLabelEl.textContent = POMO_LABELS[pomo.mode];

    // Update browser tab title when timer is open and running
    if (pomo.running) {
        document.title = `${m}:${s} — MicroMind`;
    } else {
        document.title = 'MicroMind - Daily Mental Declutter';
    }
}

function pomoUpdateRing() {
    const ratio   = pomo.secondsLeft / pomo.totalSeconds;
    const offset  = RING_CIRCUMFERENCE * (1 - ratio);
    pomoRingFill.style.strokeDashoffset = offset;
}

function pomoUpdateStartBtn() {
    if (pomo.running) {
        pomoPlayIcon.setAttribute('data-lucide', 'pause');
        pomoStartLabel.textContent = 'Pause';
    } else {
        pomoPlayIcon.setAttribute('data-lucide', 'play');
        pomoStartLabel.textContent = pomo.secondsLeft < pomo.totalSeconds ? 'Resume' : 'Start';
    }
    lucide.createIcons();
}

function pomoUpdateSessionDots() {
    pomoSessionDotsEl.innerHTML = '';
    const MAX_DOTS = 4;
    for (let i = 0; i < MAX_DOTS; i++) {
        const dot = document.createElement('span');
        dot.className = 'pomo-dot' + (i < pomo.sessions ? ' filled' : '');
        pomoSessionDotsEl.appendChild(dot);
    }
}

/* --- Focus Task Picker --- */
function pomoRenderFocusTaskPicker() {
    if (!pomoFocusSlotsEl) return;
    pomoFocusSlotsEl.innerHTML = '';

    const slotKeys = ['focus-1', 'focus-2', 'focus-3'];
    let hasAny = false;

    slotKeys.forEach((key, idx) => {
        const taskId = state.focusSlots[key];
        const task   = taskId ? state.tasks.find(t => t.id === taskId) : null;

        if (task) {
            hasAny = true;
            const btn = document.createElement('button');
            btn.className = 'pomo-slot-btn' + (pomo.linkedTaskId === taskId ? ' active-slot' : '');

            const numEl = document.createElement('span');
            numEl.className = 'pomo-slot-num';
            numEl.textContent = idx + 1;

            const textEl = document.createElement('span');
            textEl.className = 'pomo-slot-text';
            textEl.textContent = task.text;

            btn.appendChild(numEl);
            btn.appendChild(textEl);
            btn.addEventListener('click', () => pomoLinkTask(task.id, task.text));
            pomoFocusSlotsEl.appendChild(btn);
        }
    });

    if (!hasAny) {
        const empty = document.createElement('p');
        empty.className = 'pomo-slot-empty';
        empty.style.fontSize = '0.78rem';
        empty.style.padding = '4px 0';
        empty.textContent = 'Drag tasks into "Today\'s Focus Three" first.';
        pomoFocusSlotsEl.appendChild(empty);
    }
}

function pomoLinkTask(taskId, taskText) {
    if (pomo.linkedTaskId === taskId) {
        pomo.linkedTaskId   = null;
        pomo.linkedTaskText = null;
        pomoTaskLabelEl.textContent = 'No task selected';
    } else {
        pomo.linkedTaskId   = taskId;
        pomo.linkedTaskText = taskText;
        pomoTaskLabelEl.textContent = '\u25B6 ' + taskText;
    }
    pomoRenderFocusTaskPicker();
}

/* --- Browser Notification Permission --- */
function requestNotifPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// ============================================================
// Boot — placed after all module code so const declarations are initialized
// ============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
} else {
    bootApp();
}
