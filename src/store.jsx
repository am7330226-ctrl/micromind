/**
 * store.jsx — Centralised state management using React Context + useReducer.
 * Integrates with the Express /api/data endpoint for server-side persistence.
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────
export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_HABITS = [
  { id: 'habit-1', emoji: '💧', label: 'Drink Water', done: false },
  { id: 'habit-2', emoji: '🚶', label: 'Take a Walk', done: false },
  { id: 'habit-3', emoji: '📖', label: 'Read 10 Min', done: false },
  { id: 'habit-4', emoji: '🧘', label: 'Breathe / Meditate', done: false },
  { id: 'habit-5', emoji: '📵', label: 'No Phone 1hr', done: false },
  { id: 'habit-6', emoji: '🌙', label: 'Sleep by 11pm', done: false },
];

function getEmptyState() {
  return {
    tasks: [],
    habits: DEFAULT_HABITS,
    focusSlots: { 'focus-1': null, 'focus-2': null, 'focus-3': null },
    moodToday: 0,       // 0 = unset, 1-5 = rated
    history: [],        // [{ date, tasksCompleted, totalTasks, habitsCompleted, totalHabits, quadrantBreakdown, mood, pomodoroSessions }]
    moodLog: {},
    pomodoroSessions: 0,
    completedTaskLog: {},
    streak: 0,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

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
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, completed: !t.completed } : t
        ),
        completedTaskLog: action.completing
          ? { ...state.completedTaskLog, [today]: (state.completedTaskLog[today] ?? 0) + 1 }
          : state.completedTaskLog,
      };
    }

    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, category: action.category } : t
        ),
      };

    case 'SET_TASK_AI_SORTING':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, aiSorting: action.value } : t
        ),
      };

    case 'TOGGLE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h =>
          h.id === action.id ? { ...h, done: !h.done } : h
        ),
      };

    case 'SET_MOOD':
      return { ...state, moodToday: action.mood };

    case 'SET_POMODORO_SESSIONS':
      return { ...state, pomodoroSessions: action.sessions };

    case 'LOG_HISTORY': {
      const todayStr = new Date().toISOString().split('T')[0];
      const existing = (state.history || []).findIndex(h => h.date === todayStr);
      const entry = { ...action.entry, date: todayStr };
      let newHistory;
      if (existing >= 0) {
        newHistory = state.history.map((h, i) => i === existing ? entry : h);
      } else {
        newHistory = [...(state.history || []), entry].slice(-90);
      }
      return { ...state, history: newHistory };
    }

    case 'DAILY_RESET': {
      const completed = state.tasks.filter(t => t.completed).length;
      const qb = { q1: 0, q2: 0, q3: 0, q4: 0 };
      state.tasks.forEach(t => {
        if (t.completed && qb.hasOwnProperty(t.category)) qb[t.category]++;
        if (t.completed && t.category.startsWith('focus-')) qb.q1++;
      });
      const todayStr = new Date().toISOString().split('T')[0];
      const historyEntry = {
        date: todayStr,
        tasksCompleted: completed,
        totalTasks: state.tasks.length,
        habitsCompleted: state.habits.filter(h => h.done).length,
        totalHabits: state.habits.length,
        quadrantBreakdown: qb,
        mood: state.moodToday || 0,
        pomodoroSessions: state.pomodoroSessions || 0,
      };
      const existing = (state.history || []).findIndex(h => h.date === todayStr);
      let newHistory;
      if (existing >= 0) {
        newHistory = state.history.map((h, i) => i === existing ? historyEntry : h);
      } else {
        newHistory = [...(state.history || []), historyEntry].slice(-90);
      }
      const newStreak = completed > 0 ? (state.streak || 0) + 1 : (state.streak || 0);
      return {
        ...state,
        tasks: state.tasks.filter(t => !t.completed),
        habits: state.habits.map(h => ({ ...h, done: false })),
        moodToday: 0,
        history: newHistory,
        streak: newStreak,
        pomodoroSessions: 0,
        focusSlots: Object.fromEntries(
          Object.entries(state.focusSlots).map(([k, v]) => {
            const taskStillExists = state.tasks.filter(t => !t.completed).find(t => t.id === v);
            return [k, taskStillExists ? v : null];
          })
        ),
      };
    }

    case 'CLEAR_COMPLETED_INBOX':
      return { ...state, tasks: state.tasks.filter(t => !(t.category === 'inbox' && t.completed)) };

    case 'LOAD_STATE':
      return { ...getEmptyState(), ...action.payload };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const StateContext    = createContext(null);
const DispatchContext = createContext(null);
const AuthContext     = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, getEmptyState());
  const [auth, dispatchAuth] = useReducer(authReducer, getInitialAuth());
  const saveTimerRef = useRef(null);

  // ── Server sync ────────────────────────────────────────────────────────────
  // Debounced save to server whenever state changes (and we have a token)
  useEffect(() => {
    if (!auth.token) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': auth.token,
          },
          body: JSON.stringify(state),
        });
      } catch (e) {
        console.warn('Could not sync to server:', e);
      }
    }, 800);
  }, [state, auth.token]);

  // Load from server on login
  const loadFromServer = useCallback(async (token) => {
    try {
      const res = await fetch('/api/data', {
        headers: { 'Authorization': token },
      });
      if (res.status === 401) {
        dispatchAuth({ type: 'LOGOUT' });
        return;
      }
      const { data } = await res.json();
      if (data && typeof data === 'object') {
        dispatch({ type: 'LOAD_STATE', payload: data });
      }
    } catch (e) {
      console.warn('Could not load from server:', e);
    }
  }, []);

  const login = useCallback((token, name) => {
    dispatchAuth({ type: 'LOGIN', token, name });
    loadFromServer(token);
  }, [loadFromServer]);

  const logout = useCallback(() => {
    localStorage.removeItem('micromind_token');
    localStorage.removeItem('micromind_user');
    dispatchAuth({ type: 'LOGOUT' });
    dispatch({ type: 'LOAD_STATE', payload: getEmptyState() });
  }, []);

  // Auto-load on first mount if token exists
  useEffect(() => {
    if (auth.token) loadFromServer(auth.token);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    </AuthContext.Provider>
  );
}

// ── Auth sub-reducer ──────────────────────────────────────────────────────────
function getInitialAuth() {
  const token = localStorage.getItem('micromind_token');
  let name = '';
  try { name = JSON.parse(localStorage.getItem('micromind_user') || '{}').name || ''; } catch (_) {}
  return { token: token || null, name };
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { token: action.token, name: action.name };
    case 'LOGOUT':
      return { token: null, name: '' };
    default:
      return state;
  }
}

// ── Custom Hooks ──────────────────────────────────────────────────────────────
export function useAppState()  { return useContext(StateContext); }
export function useDispatch()  { return useContext(DispatchContext); }
export function useAuth()      { return useContext(AuthContext); }

// ── Action Creators ───────────────────────────────────────────────────────────
export function createTask(text, category = 'inbox') {
  return {
    id: generateId(),
    text: text.trim(),
    category,
    completed: false,
    createdAt: Date.now(),
    aiSorting: false,
  };
}
