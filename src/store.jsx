/**
 * store.jsx — Centralised state management using React Context + useReducer.
 * Integrates with the Express /api/data endpoint for server-side persistence.
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────
export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getEmptyState() {
  return {
    tasks: [],
    habits: [],
    focusSlots: { 'focus-1': null, 'focus-2': null, 'focus-3': null },
    moodLog: {},
    pomodoroSessions: {},
    completedTaskLog: {},
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
