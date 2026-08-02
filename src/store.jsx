/**
 * store.jsx — Centralised state management using React Context + useReducer.
 * Integrates with the Express /api/data endpoint for server-side persistence.
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { estimateTaskTime } from './utils/estimateTaskTime.js';
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
    case 'ADD_TASK': {
      const rawTask = action.payload || action.task;
      if (!rawTask || typeof rawTask !== 'object') return state;
      const safeTask = {
        id: rawTask.id || generateId(),
        text: rawTask.text || 'New Task',
        completed: Boolean(rawTask.completed),
        category: rawTask.category || 'inbox',
        createdAt: rawTask.createdAt || Date.now(),
        ...rawTask,
      };
      const safeTasks = (state.tasks || []).filter(t => t && typeof t === 'object');
      return { ...state, tasks: [...safeTasks, safeTask] };
    }

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

    // ── AI Time Estimate: SET or OVERRIDE the task time estimate ────────────
    case 'SET_TASK_TIME_ESTIMATE':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id
            ? { ...t, timeEstimate: action.estimate }
            : t
        ),
      };

    // ── AI Breakdown Loading State (show spinner on task card) ───────────────
    case 'SET_TASK_BREAKDOWN_LOADING':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id
            ? { ...t, breakdownLoading: action.loading }
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

      // Archive today's completed non-recurring tasks before removing them, then keep history
      const tasksBeingArchived = state.tasks
        .filter(t => t.completed && !shouldRegenerate(t.text))
        .map(t => ({
          id: t.id, text: t.text, category: t.category,
          completedAt: new Date().toISOString(), dueDate: t.dueDate || null,
        }));
      const prevArchive = state.completedArchive || [];
      // Keep up to last 200 archived tasks to avoid unbounded growth
      const updatedArchive = [...prevArchive, ...tasksBeingArchived].slice(-200);

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
        completedArchive: updatedArchive,
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

// ── Auth sub-reducer ──────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':       return { session: action.session, name: action.name, user: action.user, isGuest: false };
    case 'LOGIN_GUEST': return { session: action.session, name: action.name, user: action.user, isGuest: true };
    case 'LOGOUT':      return { session: null, name: '', user: null, isGuest: false };
    default:            return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const StateContext    = createContext(null);
const DispatchContext = createContext(null);
const AuthContext     = createContext(null);

const LOCAL_STORAGE_KEY = 'micromind_local_state';
const GUEST_STORAGE_KEY = 'micromind_guest_user';

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, getEmptyState());
  const [auth, dispatchAuth] = useReducer(authReducer, { session: null, name: '', user: null, isGuest: false });
  const saveTimerRef = useRef(null);

  // ── Supabase: load user data from Postgres ─────────────────────────────────
  const loadFromSupabase = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.warn('Could not load data from Supabase:', error.message);
      return;
    }
    if (data?.data && typeof data.data === 'object') {
      dispatch({ type: 'LOAD_STATE', payload: data.data });
    }
  }, []);

  // ── LocalStorage: load local state ──────────────────────────────────────────
  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          dispatch({ type: 'LOAD_STATE', payload: parsed });
        }
      }
    } catch (e) {
      console.warn('Could not load local state:', e);
    }
  }, []);

  // ── Save state to LocalStorage and Supabase ────────────────────────────────
  useEffect(() => {
    // Always save local backup
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    // Save to Supabase if authenticated cloud user
    if (!auth.user?.id || auth.isGuest) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('user_data')
        .upsert({ id: auth.user.id, data: state, updated_at: new Date().toISOString() });
      if (error) console.warn('Could not save data to Supabase:', error.message);
    }, 800);
  }, [state, auth.user?.id, auth.isGuest]);

  // ── Restore Auth session (Supabase or Guest) on mount ─────────────────────
  useEffect(() => {
    // Check for guest session first
    try {
      const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
      if (savedGuest) {
        const guestData = JSON.parse(savedGuest);
        const name = guestData.name || 'Guest';
        dispatchAuth({
          type: 'LOGIN_GUEST',
          session: { access_token: 'guest-session-token' },
          name,
          user: { id: 'guest-local-user' },
        });
        loadFromLocalStorage();
        return;
      }
    } catch (e) {
      console.warn('Error checking guest session:', e);
    }

    // Get current Supabase session
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
        const isGuestActive = localStorage.getItem(GUEST_STORAGE_KEY);
        if (!isGuestActive) {
          dispatchAuth({ type: 'LOGOUT' });
          dispatch({ type: 'LOAD_STATE', payload: getEmptyState() });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [loadFromSupabase, loadFromLocalStorage]);

  // ── Exposed helpers ────────────────────────────────────────────────────────
  const login = useCallback((session, name) => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    dispatchAuth({ type: 'LOGIN', session, name, user: session?.user });
    if (session?.user?.id) loadFromSupabase(session.user.id);
  }, [loadFromSupabase]);

  const loginGuest = useCallback((guestName = 'Guest User') => {
    const guestObj = { name: guestName };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestObj));
    dispatchAuth({
      type: 'LOGIN_GUEST',
      session: { access_token: 'guest-session-token' },
      name: guestName,
      user: { id: 'guest-local-user' },
    });
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  const logout = useCallback(async () => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    await supabase.auth.signOut();
    dispatchAuth({ type: 'LOGOUT' });
    dispatch({ type: 'LOAD_STATE', payload: getEmptyState() });
  }, []);

  const authValue = {
    auth: {
      ...auth,
      token: auth.session?.access_token ?? null,
      name:  auth.name,
    },
    login,
    loginGuest,
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



// ── Custom Hooks ──────────────────────────────────────────────────────────────
export function useAppState()  { return useContext(StateContext); }
export function useDispatch()  { return useContext(DispatchContext); }
export function useAuth()      { return useContext(AuthContext); }

// ── Action Creators ───────────────────────────────────────────────────────────
export function createTask(text, category = 'inbox') {
  // Auto-estimate time from task text complexity
  const timeEstimate = estimateTaskTime(text.trim());
  return {
    id: generateId(),
    text: text.trim(),
    category,
    completed: false,
    createdAt: Date.now(),
    aiSorting: false,
    dueDate: null,      // ISO date string e.g. "2026-07-20"
    aiReason: null,     // Human-readable AI classification reason
    notes: '',
    subtasks: [],
    timeEstimate,       // { minutes: number, label: string }
    breakdownLoading: false,
  };
}
