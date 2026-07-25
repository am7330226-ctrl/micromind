/**
 * store.jsx — Centralised state management using React Context + useReducer.
 * Integrates with the Express /api/data endpoint for server-side persistence.
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase.js';

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
    xp: 0,
    level: 1,
    badges: [],
    lastResetDate: null, // ISO date string of last DAILY_RESET
    completedArchive: [], // [{ id, text, category, completedAt, dueDate }]
    selectedTaskId: null, // ID of task open in the side panel
  };
}

// ── Gamification Constants ──────────────────────────────────────────────────
const XP_MAP = { q1: 50, q2: 40, q3: 20, q4: 10, inbox: 5 };
function getLevel(xp) { return Math.floor(Math.sqrt(xp / 100)) + 1; }


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
      const task = state.tasks.find(t => t.id === action.id);
      if (!task) return state;

      const isCompleting = action.completing;
      let newXp = state.xp || 0;
      let newBadges = [...(state.badges || [])];
      
      // Grant or remove XP based on completion status
      if (isCompleting) {
        let base = XP_MAP[task.category] || 5;
        if (task.category.startsWith('focus-')) base = 50; // Focus slots count as Q1
        newXp += base;
      } else {
        let base = XP_MAP[task.category] || 5;
        if (task.category.startsWith('focus-')) base = 50;
        newXp = Math.max(0, newXp - base);
      }

      const newLevel = getLevel(newXp);

      // Evaluate "Task Crusher" badge (10 tasks done in a day)
      const todayCount = (state.completedTaskLog[today] || 0) + (isCompleting ? 1 : -1);
      if (todayCount >= 10 && !newBadges.includes('task-crusher')) {
        newBadges.push('task-crusher');
      }

      // Build updated archive
      const prevArchive = state.completedArchive || [];
      let newArchive;
      if (isCompleting) {
        newArchive = [...prevArchive, {
          id: task.id, text: task.text, category: task.category,
          completedAt: new Date().toISOString(), dueDate: task.dueDate || null,
        }];
      } else {
        newArchive = prevArchive.filter(a => a.id !== task.id);
      }

      return {
        ...state,
        xp: newXp,
        level: newLevel,
        badges: newBadges,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, completed: isCompleting } : t
        ),
        completedTaskLog: isCompleting
          ? { ...state.completedTaskLog, [today]: todayCount }
          : { ...state.completedTaskLog, [today]: Math.max(0, todayCount) },
        completedArchive: newArchive,
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

    case 'SET_TASK_DUE_DATE':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, dueDate: action.dueDate } : t
        ),
      };

    case 'SET_TASK_AI_REASON':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, aiReason: action.reason } : t
        ),
      };

    case 'SET_SELECTED_TASK':
      return { ...state, selectedTaskId: action.id };

    case 'UPDATE_TASK_NOTES':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, notes: action.notes } : t
        ),
      };

    case 'ADD_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id 
            ? { ...t, subtasks: [...(t.subtasks || []), { id: generateId(), text: action.text, completed: false }] } 
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
                )
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
      
      // Evaluate streak & focus badges
      let newBadges = [...(state.badges || [])];
      if (newStreak >= 7 && !newBadges.includes('7-day-warrior')) newBadges.push('7-day-warrior');
      if ((state.pomodoroSessions || 0) >= 5 && !newBadges.includes('focus-master')) newBadges.push('focus-master');

      // Keep recurring tasks by unchecking them, instead of deleting them.
      const todayDay = new Date().getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
      const daysStr = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayName = daysStr[todayDay];
      const isMonday = todayDay === 1;

      const shouldRegenerate = (text) => {
        const lower = text.toLowerCase();
        if (lower.includes('#daily') || lower.includes('@daily')) return true;
        if (lower.includes('@weekly') && isMonday) return true; // @weekly defaults to Monday reset
        if (lower.includes(`@${todayName}`)) return true;
        return false;
      };

      const newTasks = state.tasks.filter(t => {
        if (!t.completed) return true;
        return shouldRegenerate(t.text);
      }).map(t => {
        if (t.completed && shouldRegenerate(t.text)) return { ...t, completed: false };
        return t;
      });

      return {
        ...state,
        tasks: newTasks,
        habits: state.habits.map(h => ({ ...h, done: false })),
        moodToday: 0,
        history: newHistory,
        streak: newStreak,
        badges: newBadges,
        pomodoroSessions: 0,
        lastResetDate: todayStr,
        completedArchive: [],  // clear archive on daily reset
        focusSlots: Object.fromEntries(
          Object.entries(state.focusSlots).map(([k, v]) => {
            const taskStillExists = newTasks.find(t => t.id === v);
            return [k, taskStillExists ? v : null];
          })
        ),
      };
    }

    case 'CLEAR_COMPLETED_INBOX':
      return { ...state, tasks: state.tasks.filter(t => !(t.category === 'inbox' && t.completed)) };

    case 'CLEAR_ARCHIVE':
      return { ...state, completedArchive: [] };

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
  const [auth, dispatchAuth] = useReducer(authReducer, { session: null, name: '', user: null });
  const saveTimerRef = useRef(null);

  // ── Supabase: load user data from Postgres ─────────────────────────────────
  const loadFromSupabase = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = row not found (first time user), ignore it
      console.warn('Could not load data:', error.message);
      return;
    }
    if (data?.data && typeof data.data === 'object') {
      dispatch({ type: 'LOAD_STATE', payload: data.data });
    }
  }, []);

  // ── Supabase: debounced save to Postgres ───────────────────────────────────
  useEffect(() => {
    if (!auth.user?.id) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('user_data')
        .upsert({ id: auth.user.id, data: state, updated_at: new Date().toISOString() });
      if (error) console.warn('Could not save data:', error.message);
    }, 800);
  }, [state, auth.user?.id]);

  // ── Supabase: listen to auth state changes (login, logout, token refresh) ──
  useEffect(() => {
    // Get the current session immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const name = session.user.user_metadata?.name
          || session.user.user_metadata?.full_name
          || session.user.email?.split('@')[0]
          || 'Friend';
        dispatchAuth({ type: 'LOGIN', session, name, user: session.user });
        loadFromSupabase(session.user.id);
      }
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const name = session.user.user_metadata?.name
          || session.user.user_metadata?.full_name
          || session.user.email?.split('@')[0]
          || 'Friend';
        dispatchAuth({ type: 'LOGIN', session, name, user: session.user });
        if (event === 'SIGNED_IN') loadFromSupabase(session.user.id);
      } else {
        dispatchAuth({ type: 'LOGOUT' });
        dispatch({ type: 'LOAD_STATE', payload: getEmptyState() });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadFromSupabase]);

  // ── Exposed helpers ────────────────────────────────────────────────────────
  // Called by AuthModal after a successful email/password sign-in
  const login = useCallback((session, name) => {
    dispatchAuth({ type: 'LOGIN', session, name, user: session?.user });
    if (session?.user?.id) loadFromSupabase(session.user.id);
  }, [loadFromSupabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will fire SIGNED_OUT and reset the state automatically
  }, []);

  // Expose auth.token for any legacy code still reading it
  const authValue = {
    auth: {
      ...auth,
      // Compatibility: expose the JWT access token as `token`
      token: auth.session?.access_token ?? null,
      name:  auth.name,
    },
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    </AuthContext.Provider>
  );
}

// ── Auth sub-reducer ──────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':  return { session: action.session, name: action.name, user: action.user };
    case 'LOGOUT': return { session: null, name: '', user: null };
    default:       return state;
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
    dueDate: null,   // ISO date string e.g. "2026-07-20"
    aiReason: null,  // Human-readable AI classification reason
    notes: '',
    subtasks: [],
  };
}
