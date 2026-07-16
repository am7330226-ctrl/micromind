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
    history: [],     // [{ date, tasksCompleted, totalTasks, habitsCompleted, totalHabits, quadrantBreakdown, mood, pomodoroSessions }]
    moodToday: 0,    // 0 = unset, 1-5 = rated
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
    
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const nameGroup = document.getElementById('name-group');
    const authName = document.getElementById('auth-name');
    
    const submitBtn = document.getElementById('auth-submit-btn');
    const authTitle = document.getElementById('auth-title');
    const errorEl = document.getElementById('auth-error');
    const logoutBtn = document.getElementById('logout-btn');

    function setLoginMode(login) {
        isLoginMode = login;
        if (login) {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            nameGroup.style.display = 'none';
            authName.required = false;
            authTitle.textContent = 'Welcome Back';
            submitBtn.textContent = 'Log In';
        } else {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            nameGroup.style.display = 'flex';
            authName.required = true;
            authTitle.textContent = 'Create an Account';
            submitBtn.textContent = 'Sign Up';
        }
        errorEl.textContent = '';
    }

    if (tabLogin && tabSignup) {
        tabLogin.addEventListener('click', () => setLoginMode(true));
        tabSignup.addEventListener('click', () => setLoginMode(false));
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const name = authName.value;
            errorEl.textContent = 'Loading...';

            try {
                const endpoint = isLoginMode ? '/api/login' : '/api/register';
                const bodyData = isLoginMode ? { email, password } : { email, password, name };
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyData)
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
                
                if (data.name) updateProfileBadge(data.name);
                
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
            const badge = document.getElementById('profile-badge');
            if (badge) badge.style.display = 'none';
            
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
        const badge = document.getElementById('profile-badge');
        if (badge) badge.style.display = 'none';
    }
}

function updateProfileBadge(fullName) {
    const badge = document.getElementById('profile-badge');
    const nameEl = document.getElementById('profile-name');
    const initialsEl = document.getElementById('avatar-initials');
    
    if (!badge || !fullName) return;
    
    badge.style.display = 'flex';
    
    // Get first name for display
    const names = fullName.trim().split(' ');
    nameEl.textContent = names[0];
    
    // Get initials (up to 2)
    let initials = names[0].charAt(0).toUpperCase();
    if (names.length > 1) {
        initials += names[names.length - 1].charAt(0).toUpperCase();
    }
    initialsEl.textContent = initials;
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
            const badge = document.getElementById('profile-badge');
            if (badge) badge.style.display = 'none';
            return;
        }

        if (response.ok) {
            const result = await response.json();
            
            if (result.profile && result.profile.name) {
                updateProfileBadge(result.profile.name);
            }
            
            const data = result.data;
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
    const task = createTask(text, 'inbox');
    input.value = '';
    renderAll();
    // Kick off AI auto-sort in background
    if (typeof aiAutoSort === 'function') aiAutoSort(task.id, text);
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
        if (typeof playAudioTone === 'function') playAudioTone('check');
    } else {
        if (typeof playAudioTone === 'function') playAudioTone('uncheck');
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
    text.innerHTML = typeof parseRichText === 'function' ? parseRichText(task.text) : task.text;

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

    // AI badge — shows sorting state on new inbox tasks
    if (task.aiSorting) {
        const badge = document.createElement('span');
        badge.className = 'ai-badge sorting';
        badge.id = `ai-badge-${task.id}`;
        badge.textContent = '✨ AI sorting…';
        el.appendChild(badge);
    }

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
            if (typeof playAudioTone === 'function') {
                playAudioTone(habit.done ? 'check' : 'uncheck');
            }
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
    renderMoodWidget();
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

    // --- Snapshot today's stats into history ---
    const todayStr = new Date().toISOString().split('T')[0];
    const habitsCompleted = state.habits.filter(h => h.done).length;
    const totalHabits = state.habits.length;

    // Quadrant breakdown for completed tasks
    const qb = { q1: 0, q2: 0, q3: 0, q4: 0 };
    state.tasks.forEach(t => {
        if (t.completed && qb.hasOwnProperty(t.category)) {
            qb[t.category]++;
        }
        // Tasks in focus slots — check their original quadrant isn't tracked,
        // but count them in a general "focus" bucket mapped to q1
        if (t.completed && t.category.startsWith('focus-')) {
            qb.q1++;
        }
    });

    const historyEntry = {
        date: todayStr,
        tasksCompleted: completed,
        totalTasks: total,
        habitsCompleted: habitsCompleted,
        totalHabits: totalHabits,
        quadrantBreakdown: qb,
        mood: state.moodToday || 0,
        pomodoroSessions: typeof pomo !== 'undefined' ? pomo.sessions : 0,
    };

    // Avoid duplicate entries for the same day
    if (!state.history) state.history = [];
    const existingIdx = state.history.findIndex(h => h.date === todayStr);
    if (existingIdx >= 0) {
        state.history[existingIdx] = historyEntry;
    } else {
        state.history.push(historyEntry);
    }

    // Keep max 90 days of history
    if (state.history.length > 90) {
        state.history = state.history.slice(-90);
    }

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

    // Reset habits and mood
    state.habits = state.habits.map(h => ({ ...h, done: false }));
    state.moodToday = 0;

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
    initAnalytics();
    initMoodWidget();
    initSettings();
    initNotifications();
    initZenMode();
    initAmbientNoise();
    initShortcuts();
    initAI();
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
            textEl.innerHTML = typeof parseRichText === 'function' ? parseRichText(task.text) : task.text;

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
        pomoTaskLabelEl.innerHTML = '▶ ' + parseRichText(taskText);
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
// MOOD WIDGET MODULE
// ============================================================
const MOOD_LABELS = ['', 'Exhausted', 'Low', 'Okay', 'Good', 'Energized'];

function initMoodWidget() {
    const starsContainer = document.getElementById('mood-stars');
    if (!starsContainer) return;

    const stars = starsContainer.querySelectorAll('.mood-star');

    // Hover preview
    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.value);
            stars.forEach(s => {
                const sv = parseInt(s.dataset.value);
                s.classList.toggle('hovered', sv <= val && !s.classList.contains('active'));
            });
        });

        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hovered'));
        });

        star.addEventListener('click', () => {
            const val = parseInt(star.dataset.value);
            // Toggle off if clicking the same value
            if (state.moodToday === val) {
                state.moodToday = 0;
            } else {
                state.moodToday = val;
            }
            saveState();
            renderMoodWidget();

            // Pop animation
            if (state.moodToday > 0) {
                star.classList.add('pop');
                setTimeout(() => star.classList.remove('pop'), 400);
                showToast(`Mood set: ${MOOD_LABELS[state.moodToday]} ${'⭐'.repeat(state.moodToday)}`, '😊');
            }
        });
    });
}

function renderMoodWidget() {
    const starsContainer = document.getElementById('mood-stars');
    const feedbackEl = document.getElementById('mood-feedback');
    if (!starsContainer) return;

    const stars = starsContainer.querySelectorAll('.mood-star');
    const currentMood = state.moodToday || 0;

    stars.forEach(s => {
        const sv = parseInt(s.dataset.value);
        s.classList.toggle('active', sv <= currentMood);
    });

    if (feedbackEl) {
        feedbackEl.textContent = currentMood > 0 ? MOOD_LABELS[currentMood] : '';
    }
}

// ============================================================
// ANALYTICS MODULE
// ============================================================
let analyticsPanel, analyticsBackdrop, analyticsRange = 7;

function initAnalytics() {
    analyticsPanel = document.getElementById('analytics-panel');
    analyticsBackdrop = document.getElementById('analytics-backdrop');
    const toggleBtn = document.getElementById('analytics-toggle-btn');
    const closeBtn = document.getElementById('analytics-close-btn');

    if (toggleBtn) toggleBtn.addEventListener('click', openAnalytics);
    if (closeBtn) closeBtn.addEventListener('click', closeAnalytics);
    if (analyticsBackdrop) analyticsBackdrop.addEventListener('click', closeAnalytics);

    // Tab switching
    document.querySelectorAll('.analytics-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            analyticsRange = parseInt(tab.dataset.range);
            document.querySelectorAll('.analytics-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderAnalytics();
        });
    });
}

function openAnalytics() {
    if (!analyticsPanel) return;
    analyticsPanel.classList.add('open');
    analyticsBackdrop.classList.add('visible');
    renderAnalytics();
    lucide.createIcons();
}

function closeAnalytics() {
    if (!analyticsPanel) return;
    analyticsPanel.classList.remove('open');
    analyticsBackdrop.classList.remove('visible');
}

function getHistoryForRange(days) {
    if (!state.history || state.history.length === 0) return [];
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return state.history.filter(h => h.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date));
}

function renderAnalytics() {
    const history = getHistoryForRange(analyticsRange);
    renderHighlightCards(history);
    drawTasksBarChart(history);
    drawQuadrantDoughnut(history);
    drawMoodLineChart(history);
}

// --- Highlight Cards ---
function renderHighlightCards(history) {
    const hlStreak = document.getElementById('hl-streak');
    const hlTotal = document.getElementById('hl-total-tasks');
    const hlBest = document.getElementById('hl-best-day');
    const hlMood = document.getElementById('hl-avg-mood');

    // Longest streak
    if (hlStreak) hlStreak.textContent = streak + ' days';

    // Total tasks completed in range
    const totalCompleted = history.reduce((sum, h) => sum + (h.tasksCompleted || 0), 0);
    if (hlTotal) hlTotal.textContent = totalCompleted;

    // Best day
    if (hlBest) {
        if (history.length > 0) {
            const best = history.reduce((a, b) => (a.tasksCompleted || 0) >= (b.tasksCompleted || 0) ? a : b);
            const d = new Date(best.date + 'T00:00:00');
            hlBest.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            hlBest.textContent = '\u2014';
        }
    }

    // Average mood
    if (hlMood) {
        const moods = history.filter(h => h.mood > 0).map(h => h.mood);
        if (moods.length > 0) {
            const avg = (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1);
            hlMood.textContent = avg + ' \u2605';
        } else {
            hlMood.textContent = '\u2014';
        }
    }
}

// --- Canvas Chart Colors ---
const CHART_COLORS = {
    indigo: '#4f46e5',
    indigoSoft: 'rgba(79, 70, 229, 0.15)',
    emerald: '#10b981',
    emeraldSoft: 'rgba(16, 185, 129, 0.15)',
    amber: '#f59e0b',
    amberSoft: 'rgba(245, 158, 11, 0.15)',
    coral: '#ef4444',
    coralSoft: 'rgba(239, 68, 68, 0.15)',
    cyan: '#06b6d4',
    textMuted: '#94a3b8',
    gridLine: 'rgba(0, 0, 0, 0.06)',
};

// --- Bar Chart: Tasks Completed ---
function drawTasksBarChart(history) {
    const canvas = document.getElementById('chart-tasks-bar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Build labels for the full range, filling gaps with 0
    const days = analyticsRange;
    const labels = [];
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const shortLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push(shortLabel);
        const entry = history.find(h => h.date === dateStr);
        data.push(entry ? entry.tasksCompleted : 0);
    }

    const W = canvas.width;
    const H = canvas.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    const padLeft = 36, padRight = 12, padTop = 12, padBottom = 36;
    const chartW = W - padLeft - padRight;
    const chartH = H - padTop - padBottom;
    const maxVal = Math.max(...data, 1);
    const barCount = labels.length;
    const barGap = Math.max(2, chartW / barCount * 0.3);
    const barW = (chartW - barGap * (barCount + 1)) / barCount;

    // Grid lines
    ctx.strokeStyle = CHART_COLORS.gridLine;
    ctx.lineWidth = 1;
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
        const y = padTop + chartH - (chartH / gridSteps) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(W - padRight, y);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = CHART_COLORS.textMuted;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxVal / gridSteps * i), padLeft - 6, y + 3);
    }

    // Bars
    data.forEach((val, i) => {
        const x = padLeft + barGap + i * (barW + barGap);
        const barH = (val / maxVal) * chartH;
        const y = padTop + chartH - barH;

        // Bar gradient
        const grad = ctx.createLinearGradient(x, y, x, padTop + chartH);
        grad.addColorStop(0, CHART_COLORS.indigo);
        grad.addColorStop(1, 'rgba(79, 70, 229, 0.4)');
        ctx.fillStyle = grad;

        // Rounded top
        const radius = Math.min(barW / 2, 4);
        ctx.beginPath();
        ctx.moveTo(x, padTop + chartH);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.lineTo(x + barW - radius, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
        ctx.lineTo(x + barW, padTop + chartH);
        ctx.closePath();
        ctx.fill();

        // Value on top
        if (val > 0) {
            ctx.fillStyle = CHART_COLORS.indigo;
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(val, x + barW / 2, y - 4);
        }

        // X-axis label
        ctx.fillStyle = CHART_COLORS.textMuted;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        // Show fewer labels on week view vs month view
        if (days <= 7 || i % Math.ceil(days / 10) === 0) {
            ctx.fillText(labels[i], x + barW / 2, H - 6);
        }
    });
}

// --- Doughnut Chart: Quadrant Distribution ---
function drawQuadrantDoughnut(history) {
    const canvas = document.getElementById('chart-quadrant-doughnut');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const W = canvas.width;
    const H = canvas.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // Aggregate quadrant totals
    const totals = { q1: 0, q2: 0, q3: 0, q4: 0 };
    history.forEach(h => {
        if (h.quadrantBreakdown) {
            totals.q1 += h.quadrantBreakdown.q1 || 0;
            totals.q2 += h.quadrantBreakdown.q2 || 0;
            totals.q3 += h.quadrantBreakdown.q3 || 0;
            totals.q4 += h.quadrantBreakdown.q4 || 0;
        }
    });

    const segments = [
        { label: 'Do First', value: totals.q1, color: CHART_COLORS.coral },
        { label: 'Schedule', value: totals.q2, color: CHART_COLORS.indigo },
        { label: 'Delegate', value: totals.q3, color: CHART_COLORS.amber },
        { label: 'Eliminate', value: totals.q4, color: CHART_COLORS.textMuted },
    ];

    const total = segments.reduce((s, seg) => s + seg.value, 0);
    const cx = W * 0.35;
    const cy = H / 2;
    const outerR = Math.min(cx, cy) - 16;
    const innerR = outerR * 0.55;

    if (total === 0) {
        // Empty state
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
        ctx.fillStyle = CHART_COLORS.gridLine;
        ctx.fill();

        ctx.fillStyle = CHART_COLORS.textMuted;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data yet', cx, cy + 4);
        return;
    }

    let startAngle = -Math.PI / 2;
    segments.forEach(seg => {
        if (seg.value === 0) return;
        const sliceAngle = (seg.value / total) * Math.PI * 2;

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
        ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();

        startAngle += sliceAngle;
    });

    // Center label
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy + 2);
    ctx.fillStyle = CHART_COLORS.textMuted;
    ctx.font = '9px Inter, sans-serif';
    ctx.fillText('TOTAL', cx, cy + 14);

    // Legend
    const legendX = W * 0.65;
    let legendY = cy - (segments.length * 22) / 2 + 10;
    segments.forEach(seg => {
        ctx.fillStyle = seg.color;
        ctx.beginPath();
        ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${seg.label}`, legendX + 12, legendY + 1);

        ctx.fillStyle = CHART_COLORS.textMuted;
        ctx.font = 'bold 11px Inter, sans-serif';
        const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
        ctx.fillText(`${seg.value} (${pct}%)`, legendX + 12, legendY + 15);

        legendY += 30;
    });
}

// --- Line Chart: Mood vs Productivity ---
function drawMoodLineChart(history) {
    const canvas = document.getElementById('chart-mood-line');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const W = canvas.width;
    const H = canvas.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const days = analyticsRange;
    const labels = [];
    const moodData = [];
    const taskData = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const shortLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push(shortLabel);
        const entry = history.find(h => h.date === dateStr);
        moodData.push(entry ? entry.mood || 0 : 0);
        taskData.push(entry ? entry.tasksCompleted || 0 : 0);
    }

    const padLeft = 36, padRight = 40, padTop = 16, padBottom = 36;
    const chartW = W - padLeft - padRight;
    const chartH = H - padTop - padBottom;
    const maxTasks = Math.max(...taskData, 1);
    const maxMood = 5;

    // Grid
    ctx.strokeStyle = CHART_COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padTop + chartH - (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(W - padRight, y);
        ctx.stroke();
    }

    // Draw a smooth line
    function drawLine(data, maxVal, color, fillColor) {
        if (data.length < 2) return;
        const points = data.map((v, i) => ({
            x: padLeft + (i / (data.length - 1)) * chartW,
            y: padTop + chartH - (v / maxVal) * chartH,
        }));

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx = (prev.x + curr.x) / 2;
            ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Fill under
        ctx.lineTo(points[points.length - 1].x, padTop + chartH);
        ctx.lineTo(points[0].x, padTop + chartH);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Dots
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    }

    drawLine(taskData, maxTasks, CHART_COLORS.indigo, CHART_COLORS.indigoSoft);
    drawLine(moodData, maxMood, CHART_COLORS.amber, CHART_COLORS.amberSoft);

    // X-axis labels
    ctx.fillStyle = CHART_COLORS.textMuted;
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((lbl, i) => {
        if (days <= 7 || i % Math.ceil(days / 10) === 0) {
            const x = padLeft + (i / (labels.length - 1)) * chartW;
            ctx.fillText(lbl, x, H - 6);
        }
    });

    // Y-axis labels (left = tasks, right = mood)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const y = padTop + chartH - (chartH / 4) * i;
        ctx.fillStyle = CHART_COLORS.indigo;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(Math.round(maxTasks / 4 * i), padLeft - 6, y + 3);
    }
    ctx.textAlign = 'left';
    for (let i = 0; i <= 4; i++) {
        const y = padTop + chartH - (chartH / 4) * i;
        ctx.fillStyle = CHART_COLORS.amber;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(Math.round(maxMood / 4 * i), W - padRight + 6, y + 3);
    }

    // Legend
    const legY = padTop + 2;
    ctx.beginPath();
    ctx.arc(padLeft + 10, legY, 4, 0, Math.PI * 2);
    ctx.fillStyle = CHART_COLORS.indigo;
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Tasks', padLeft + 18, legY + 3);

    ctx.beginPath();
    ctx.arc(padLeft + 66, legY, 4, 0, Math.PI * 2);
    ctx.fillStyle = CHART_COLORS.amber;
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Mood', padLeft + 74, legY + 3);
}

// ============================================================
// AUDIO MODULE (Web Audio API)
// ============================================================
let audioCtx = null;

function playAudioTone(type) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'check') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        osc.start(t);
        osc.stop(t + 0.3);
    } else if (type === 'uncheck') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        osc.start(t);
        osc.stop(t + 0.2);
    }
}

// ============================================================
// SETTINGS / DATA EXPORT & IMPORT MODULE
// ============================================================
function initSettings() {
    const settingsToggle = document.getElementById('settings-toggle-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings-btn');
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const importInput = document.getElementById('import-file-input');

    if (settingsToggle && settingsModal) {
        settingsToggle.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }

    if (closeSettings && settingsModal) {
        closeSettings.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = JSON.stringify(state, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `micromind-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Data exported successfully!', '📥');
        });
    }

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            importInput.click();
        });

        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tasks)) {
                        state = { ...state, ...parsed }; // merge with default structure
                        saveState();
                        renderAll();
                        if (settingsModal) settingsModal.classList.remove('active');
                        showToast('Data imported successfully!', '🚀');
                    } else {
                        alert('Invalid backup file format.');
                    }
                } catch (err) {
                    console.error('Import error:', err);
                    alert('Error parsing backup file.');
                }
                importInput.value = ''; // reset
            };
            reader.readAsText(file);
        });
    }
}

// ============================================================
// LOCAL PUSH NOTIFICATIONS MODULE
// ============================================================
function initNotifications() {
    setInterval(checkReminders, 60 * 1000);
    setTimeout(checkReminders, 5000); // initial check after 5s
}

function checkReminders() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const now = new Date();
    const todayStr = now.toDateString();
    const hour = now.getHours();

    // 1. Morning Reminder (9:00 AM or later)
    if (hour >= 9) {
        const lastMorning = localStorage.getItem('micromind_lastMorningNotif');
        if (lastMorning !== todayStr) {
            const hasTasks = state.tasks.length > 0;
            if (!hasTasks) {
                new Notification('MicroMind', {
                    body: 'Start your day right! Time for a quick brain dump.',
                    icon: 'icon.svg'
                });
                localStorage.setItem('micromind_lastMorningNotif', todayStr);
            }
        }
    }

    // 2. Evening Reminder (5:00 PM or later)
    if (hour >= 17) {
        const lastEvening = localStorage.getItem('micromind_lastEveningNotif');
        if (lastEvening !== todayStr) {
            let allFocusDone = true;
            for (const slot in state.focusSlots) {
                const taskId = state.focusSlots[slot];
                if (taskId) {
                    const task = state.tasks.find(t => t.id === taskId);
                    if (task && !task.completed) {
                        allFocusDone = false;
                        break;
                    }
                } else {
                    allFocusDone = false;
                }
            }

            if (!allFocusDone) {
                new Notification('MicroMind', {
                    body: 'Don\'t forget to finish your Focus Three tasks for today!',
                    icon: 'icon.svg'
                });
                localStorage.setItem('micromind_lastEveningNotif', todayStr);
            }
        }
    }
}

// ============================================================
// ZEN MODE & AMBIENT NOISE
// ============================================================
let isZenMode = false;
let ambientNoisePlaying = false;
let ambientNoiseSource = null;
let ambientNoiseGain = null;

function initZenMode() {
    const zenBtn = document.getElementById('zen-mode-btn');
    const zenIcon = document.getElementById('zen-mode-icon');
    if (zenBtn) {
        zenBtn.addEventListener('click', () => {
            isZenMode = !isZenMode;
            if (isZenMode) {
                document.body.classList.add('zen-mode');
                zenIcon.setAttribute('data-lucide', 'minimize');
                // Request native browser fullscreen
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(e => console.log('Fullscreen failed', e));
                }
            } else {
                document.body.classList.remove('zen-mode');
                zenIcon.setAttribute('data-lucide', 'maximize');
                // Exit native browser fullscreen
                if (document.exitFullscreen && document.fullscreenElement) {
                    document.exitFullscreen().catch(e => console.log('Exit fullscreen failed', e));
                }
            }
            lucide.createIcons();
        });
    }
}

function initAmbientNoise() {
    const noiseBtn = document.getElementById('ambient-noise-btn');
    if (noiseBtn) {
        noiseBtn.addEventListener('click', () => {
            ambientNoisePlaying = !ambientNoisePlaying;
            if (ambientNoisePlaying) {
                startAmbientNoise();
                noiseBtn.classList.add('active');
            } else {
                stopAmbientNoise();
                noiseBtn.classList.remove('active');
            }
        });
    }
}

function startAmbientNoise() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    ambientNoiseSource = audioCtx.createBufferSource();
    ambientNoiseSource.buffer = noiseBuffer;
    ambientNoiseSource.loop = true;

    // Filter white noise to make it brown noise (warm/rain-like)
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; // Cut off high frequencies

    ambientNoiseGain = audioCtx.createGain();
    // Fade in
    ambientNoiseGain.gain.setValueAtTime(0, audioCtx.currentTime);
    ambientNoiseGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 2); // 2 second fade in

    ambientNoiseSource.connect(filter);
    filter.connect(ambientNoiseGain);
    ambientNoiseGain.connect(audioCtx.destination);

    ambientNoiseSource.start(0);
}

function stopAmbientNoise() {
    if (ambientNoiseGain && ambientNoiseSource) {
        // Fade out
        const t = audioCtx.currentTime;
        ambientNoiseGain.gain.setValueAtTime(ambientNoiseGain.gain.value, t);
        ambientNoiseGain.gain.linearRampToValueAtTime(0, t + 1); // 1 second fade out
        
        ambientNoiseSource.stop(t + 1);
        
        // Cleanup references after stop
        setTimeout(() => {
            ambientNoiseSource = null;
            ambientNoiseGain = null;
        }, 1000);
    }
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
function initShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore shortcuts if the user is typing in an input or textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }

        // Focus brain dump input
        if (e.key === '/') {
            e.preventDefault();
            const dumpInput = document.getElementById('dump-input');
            if (dumpInput) dumpInput.focus();
            return;
        }

        // Hover-based shortcuts
        const hoveredTaskEl = document.querySelector('.task-item:hover');
        if (hoveredTaskEl) {
            const taskId = hoveredTaskEl.dataset.id;
            const task = state.tasks.find(t => t.id === taskId);
            
            if (!task) return;

            // Space to complete task
            if (e.key === ' ') {
                e.preventDefault();
                const checkbox = hoveredTaskEl.querySelector('input[type="checkbox"]');
                toggleTaskComplete(taskId, checkbox);
                return;
            }

            // 1, 2, 3, 4 to move task to respective matrix quadrant
            if (['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                const targetCategory = `quadrant-${e.key}`;
                
                // Clear from focus slots if it was in one
                for (const s in state.focusSlots) {
                    if (state.focusSlots[s] === taskId) state.focusSlots[s] = null;
                }
                
                task.category = targetCategory;
                saveState();
                renderAll();
                
                // Tiny UI sound for moving a task
                if (typeof audioCtx !== 'undefined' && audioCtx) {
                    const t = audioCtx.currentTime;
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(800 + (parseInt(e.key) * 150), t);
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                    osc.start(t);
                    osc.stop(t + 0.1);
                }
            }
        }
    });
}

// ============================================================
// LOCAL AI MODULE
// ============================================================
let aiWorker = null;
let aiReady = false;
const CONFIDENCE_THRESHOLD = 0.60;

// Map model category to human-readable quadrant name
const CATEGORY_NAMES = {
    'q1': 'Do First',
    'q2': 'Schedule',
    'q3': 'Delegate',
    'q4': "Don't Do",
};

function initAI() {
    // Check for Web Worker support
    if (typeof Worker === 'undefined') {
        setAIStatus('error', 'AI Unavailable');
        return;
    }

    try {
        aiWorker = new Worker('./ai-worker.js', { type: 'module' });
    } catch (e) {
        console.warn('AI Worker failed to start:', e);
        setAIStatus('error', 'AI Unavailable');
        return;
    }

    aiWorker.addEventListener('message', (event) => {
        const { type, status, taskId, category, score, error, progress } = event.data;

        if (type === 'status') {
            if (status === 'loading') {
                setAIStatus('loading', 'AI Loading…');
                const wrap = document.getElementById('ai-progress-bar-wrap');
                if (wrap) wrap.style.display = 'block';
            } else if (status === 'ready') {
                aiReady = true;
                setAIStatus('ready', '✦ AI Ready');
                const wrap = document.getElementById('ai-progress-bar-wrap');
                if (wrap) wrap.style.display = 'none';
            } else if (status === 'error') {
                setAIStatus('error', 'AI Error');
                console.error('AI Worker error:', error);
            }
        }

        if (type === 'progress') {
            const bar = document.getElementById('ai-progress-bar');
            const label = document.getElementById('ai-progress-label');
            if (bar && progress !== undefined) bar.style.width = Math.round(progress) + '%';
            if (label) label.textContent = `Downloading AI model (first time only)… ${Math.round(progress)}%`;
        }

        if (type === 'result' && taskId) {
            const task = state.tasks.find(t => t.id === taskId);
            if (!task) return;

            // Remove sorting flag
            task.aiSorting = false;

            if (error) {
                console.warn('AI classification error:', error);
                saveState();
                renderAll();
                return;
            }

            if (score >= CONFIDENCE_THRESHOLD && category) {
                // Move task to predicted quadrant
                for (const s in state.focusSlots) {
                    if (state.focusSlots[s] === taskId) state.focusSlots[s] = null;
                }
                task.category = category;
                saveState();
                renderAll();
                showToast(`🤖 Sorted "${task.text.substring(0, 30)}" → ${CATEGORY_NAMES[category]}`, '✨');
            } else {
                // Not confident enough — leave in Inbox, show a subtle badge
                saveState();
                renderAll();
            }
        }
    });

    // Kick off model load immediately in background
    aiWorker.postMessage({ type: 'load' });
}

function setAIStatus(state, label) {
    const chip = document.getElementById('ai-status-chip');
    const labelEl = document.getElementById('ai-status-label');
    if (!chip || !labelEl) return;
    chip.className = `ai-status-chip ai-status-${state}`;
    labelEl.textContent = label;
}

function aiAutoSort(taskId, text) {
    if (!aiWorker || !aiReady) return; // Model not ready yet

    // Mark the task as being sorted
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.aiSorting = true;
    saveState();
    renderAll();

    aiWorker.postMessage({ type: 'classify', taskId, text });
}

// ============================================================
// RICH TEXT & TAG PARSING
// ============================================================
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function parseRichText(text) {
    let safeText = escapeHTML(text);
    
    // Bold: **text**
    safeText = safeText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    safeText = safeText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    safeText = safeText.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Links: [text](url)
    safeText = safeText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
        let cleanUrl = url;
        if (cleanUrl.startsWith('&#39;') || cleanUrl.startsWith('&quot;')) {
            cleanUrl = cleanUrl.replace(/^(?:&#39;|&quot;)+|(?:&#39;|&quot;)+$/g, '');
        }
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    });
    
    // Tags: #tag
    safeText = safeText.replace(/(^|\s)#([\w-]+)/g, (match, prefix, tag) => {
        return `${prefix}<span class="task-tag" data-tag="${tag.toLowerCase()}">#${tag}</span>`;
    });
    
    return safeText;
}

// ============================================================
// Boot — placed after all module code so const declarations are initialized
// ============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
} else {
    bootApp();
}
