import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { loadSavedState, saveAppState, getSavedThemeId, saveThemeId } from '../services/storage';
import { classifyTask, estimateTaskTime } from '../services/aiClassifier';
import { THEMES, DEFAULT_THEME } from '../theme/themes';
import { supabase } from '../services/supabase';

export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export const DEFAULT_HABITS = [
  { id: 'habit-1', emoji: '💧', label: 'Drink Water', done: false },
  { id: 'habit-2', emoji: '🚶', label: 'Take a Walk', done: false },
  { id: 'habit-3', emoji: '📖', label: 'Read 10 Min', done: false },
  { id: 'habit-4', emoji: '🧘', label: 'Breathe / Meditate', done: false },
  { id: 'habit-5', emoji: '📵', label: 'No Phone 1hr', done: false },
  { id: 'habit-6', emoji: '🌙', label: 'Sleep by 11pm', done: false },
];

function getInitialState() {
  return {
    tasks: [],
    thoughts: [],
    habits: DEFAULT_HABITS,
    focusSlots: { 'focus-1': null, 'focus-2': null, 'focus-3': null },
    moodToday: 0,
    history: [],
    moodLog: {},
    pomodoroSessions: 0,
    completedTaskLog: {},
    streak: 0,
    xp: 0,
    level: 1,
    badges: [],
    lastResetDate: null,
    completedArchive: [],
    activeThemeId: 'dark',
  };
}

const XP_MAP = { q1: 50, q2: 40, q3: 20, q4: 10, inbox: 5 };
function calculateLevel(xp) { return Math.floor(Math.sqrt(xp / 100)) + 1; }

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK': {
      const rawTask = action.payload || action.task;
      if (!rawTask || typeof rawTask !== 'object') return state;

      const category = rawTask.category || classifyTask(rawTask.text);
      const timeEst = rawTask.timeEstimate || estimateTaskTime(rawTask.text);

      const newTask = {
        id: rawTask.id || generateId(),
        text: rawTask.text || 'New Task',
        completed: Boolean(rawTask.completed),
        category,
        timeEstimate: timeEst,
        createdAt: rawTask.createdAt || Date.now(),
        dueDate: rawTask.dueDate || null,
        notes: rawTask.notes || '',
        subtasks: rawTask.subtasks || [],
        ...rawTask,
      };

      return {
        ...state,
        tasks: [newTask, ...(state.tasks || [])],
      };
    }

    // ── Thought capture (Brain Dump with tags) ────────────────────────────────
    case 'ADD_THOUGHT': {
      const raw = action.payload;
      if (!raw || !raw.text) return state;
      const newThought = {
        id: generateId(),
        text: raw.text.trim(),
        tag: raw.tag || 'Idea',
        status: 'active',   // 'active' | 'reviewed' | 'archived'
        pinned: false,
        createdAt: Date.now(),
      };
      return {
        ...state,
        thoughts: [newThought, ...(state.thoughts || [])],
        xp: (state.xp || 0) + 5,
      };
    }

    case 'UPDATE_THOUGHT_STATUS': {
      return {
        ...state,
        thoughts: (state.thoughts || []).map(t =>
          t.id === action.id ? { ...t, status: action.status } : t
        ),
      };
    }

    case 'PIN_THOUGHT': {
      return {
        ...state,
        thoughts: (state.thoughts || []).map(t =>
          t.id === action.id ? { ...t, pinned: !t.pinned } : t
        ),
      };
    }

    case 'ARCHIVE_THOUGHT': {
      return {
        ...state,
        thoughts: (state.thoughts || []).map(t =>
          t.id === action.id ? { ...t, status: 'archived', pinned: false } : t
        ),
      };
    }

    case 'DELETE_THOUGHT': {
      return {
        ...state,
        thoughts: (state.thoughts || []).filter(t => t.id !== action.id),
      };
    }
    // ─────────────────────────────────────────────────────────────────────────

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.id),
        focusSlots: Object.fromEntries(
          Object.entries(state.focusSlots).map(([k, v]) => [k, v === action.id ? null : v])
        ),
      };

    case 'TOGGLE_TASK': {
      const today = new Date().toISOString().split('T')[0];
      const task = state.tasks.find(t => t.id === action.id);
      if (!task) return state;

      const isCompleting = action.completing !== undefined ? action.completing : !task.completed;
      let newXp = state.xp || 0;
      let newBadges = [...(state.badges || [])];

      let baseXP = XP_MAP[task.category] || 5;
      if (task.category.startsWith('focus-')) baseXP = 50;

      if (isCompleting) {
        newXp += baseXP;
      } else {
        newXp = Math.max(0, newXp - baseXP);
      }

      const newLevel = calculateLevel(newXp);
      const todayCount = (state.completedTaskLog[today] || 0) + (isCompleting ? 1 : -1);
      if (todayCount >= 10 && !newBadges.includes('task-crusher')) {
        newBadges.push('task-crusher');
      }

      const prevArchive = state.completedArchive || [];
      let newArchive;
      if (isCompleting) {
        newArchive = [
          {
            id: task.id,
            text: task.text,
            category: task.category,
            completedAt: new Date().toISOString(),
            dueDate: task.dueDate || null,
          },
          ...prevArchive,
        ];
      } else {
        newArchive = prevArchive.filter(a => a.id !== task.id);
      }

      return {
        ...state,
        xp: newXp,
        level: newLevel,
        badges: newBadges,
        tasks: state.tasks.map(t => (t.id === action.id ? { ...t, completed: isCompleting } : t)),
        completedTaskLog: {
          ...state.completedTaskLog,
          [today]: Math.max(0, todayCount),
        },
        completedArchive: newArchive,
      };
    }

    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => (t.id === action.id ? { ...t, category: action.category } : t)),
      };

    case 'SET_FOCUS_SLOT': {
      return {
        ...state,
        focusSlots: {
          ...state.focusSlots,
          [action.slotId]: action.taskId,
        },
      };
    }

    case 'SET_TASK_DUE_DATE':
      return {
        ...state,
        tasks: state.tasks.map(t => (t.id === action.id ? { ...t, dueDate: action.dueDate } : t)),
      };

    case 'UPDATE_TASK_NOTES':
      return {
        ...state,
        tasks: state.tasks.map(t => (t.id === action.id ? { ...t, notes: action.notes } : t)),
      };

    case 'ADD_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id
            ? {
                ...t,
                subtasks: [
                  ...(t.subtasks || []),
                  { id: generateId(), text: action.text, completed: false },
                ],
              }
            : t
        ),
      };

    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id
            ? {
                ...t,
                subtasks: (t.subtasks || []).map(s =>
                  s.id === action.subtaskId ? { ...s, completed: action.completed } : s
                ),
              }
            : t
        ),
      };

    case 'DELETE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id
            ? { ...t, subtasks: (t.subtasks || []).filter(s => s.id !== action.subtaskId) }
            : t
        ),
      };

    case 'TOGGLE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h => (h.id === action.id ? { ...h, done: !h.done } : h)),
      };

    case 'SET_MOOD': {
      const todayStr = new Date().toISOString().split('T')[0];
      return {
        ...state,
        moodToday: action.mood,
        moodLog: { ...state.moodLog, [todayStr]: action.mood },
      };
    }

    case 'SET_POMODORO_SESSIONS':
      return { ...state, pomodoroSessions: action.sessions };

    case 'DAILY_RESET': {
      const completedCount = state.tasks.filter(t => t.completed).length;
      const todayStr = new Date().toISOString().split('T')[0];

      const qb = { q1: 0, q2: 0, q3: 0, q4: 0 };
      state.tasks.forEach(t => {
        if (t.completed && qb[t.category] !== undefined) qb[t.category]++;
      });

      const historyEntry = {
        date: todayStr,
        tasksCompleted: completedCount,
        totalTasks: state.tasks.length,
        habitsCompleted: state.habits.filter(h => h.done).length,
        totalHabits: state.habits.length,
        quadrantBreakdown: qb,
        mood: state.moodToday || 0,
        pomodoroSessions: state.pomodoroSessions || 0,
      };

      const existingIndex = (state.history || []).findIndex(h => h.date === todayStr);
      let newHistory;
      if (existingIndex >= 0) {
        newHistory = state.history.map((h, i) => (i === existingIndex ? historyEntry : h));
      } else {
        newHistory = [historyEntry, ...(state.history || [])].slice(0, 90);
      }

      const newStreak = completedCount > 0 ? (state.streak || 0) + 1 : state.streak || 0;

      const shouldRegenerate = text => {
        const lower = text.toLowerCase();
        if (lower.includes('#daily') || lower.includes('@daily')) return true;
        return false;
      };

      const newTasks = state.tasks
        .filter(t => !t.completed || shouldRegenerate(t.text))
        .map(t => (t.completed ? { ...t, completed: false } : t));

      return {
        ...state,
        tasks: newTasks,
        habits: state.habits.map(h => ({ ...h, done: false })),
        moodToday: 0,
        history: newHistory,
        streak: newStreak,
        pomodoroSessions: 0,
        lastResetDate: todayStr,
        completedArchive: [],
      };
    }

    case 'CLEAR_COMPLETED_INBOX':
      return {
        ...state,
        tasks: state.tasks.filter(t => !(t.category === 'inbox' && t.completed)),
      };

    case 'SET_THEME':
      return { ...state, activeThemeId: action.themeId };

    case 'LOAD_STATE':
      return { ...getInitialState(), ...action.payload };

    default:
      return state;
  }
}

const StateContext = createContext(null);
const DispatchContext = createContext(null);
const AuthContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, getInitialState());
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isFirstRender = useRef(true);

  // Initialize Auth & Storage
  useEffect(() => {
    async function initStore() {
      const saved = await loadSavedState();
      const themeId = await getSavedThemeId();
      if (saved) {
        dispatch({ type: 'LOAD_STATE', payload: { ...saved, activeThemeId: themeId } });
      } else {
        dispatch({ type: 'SET_THEME', themeId });
      }

      // Check Supabase session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (e) {}

      setIsLoaded(true);
    }

    initStore();

    // Supabase auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Save state on change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isLoaded) {
      saveAppState(state);
    }
  }, [state, isLoaded]);

  // Sync active theme object
  const activeTheme = THEMES.find(t => t.id === state.activeThemeId) || DEFAULT_THEME;

  const setTheme = useCallback(async themeId => {
    dispatch({ type: 'SET_THEME', themeId });
    await saveThemeId(themeId);
  }, []);

  // ── Derived Clarity Score (0–100) ─────────────────────────────────────────
  const clarityScore = useMemo(() => {
    const habitsDone = (state.habits || []).filter(h => h.done).length;
    const habitsTotal = (state.habits || []).length || 1;
    const habitPct = Math.round((habitsDone / habitsTotal) * 40); // 40 pts

    const moodPts = Math.round(((state.moodToday || 0) / 5) * 30); // 30 pts

    const tasksDone = (state.tasks || []).filter(t => t.completed).length;
    const tasksTotal = (state.tasks || []).length || 1;
    const taskPct = Math.min(tasksDone, tasksTotal);
    const tasksPts = Math.round((taskPct / tasksTotal) * 30); // 30 pts

    return Math.min(100, habitPct + moodPts + tasksPts);
  }, [state.habits, state.moodToday, state.tasks]);

  return (
    <StateContext.Provider value={{ ...state, theme: activeTheme, isLoaded, clarityScore }}>
      <DispatchContext.Provider value={dispatch}>
        <AuthContext.Provider value={{ user, setUser, setTheme }}>
          {children}
        </AuthContext.Provider>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useStoreState() {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useStoreState must be used within StoreProvider');
  return ctx;
}

export function useStoreDispatch() {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error('useStoreDispatch must be used within StoreProvider');
  return ctx;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within StoreProvider');
  return ctx;
}
