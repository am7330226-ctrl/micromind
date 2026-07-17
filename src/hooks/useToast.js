/**
 * useToast.js — Custom hook for showing toast notifications.
 */

import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, emoji = '✓') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, emoji }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, showToast };
}
