/**
 * aiNotificationEngine.js — Smart AI Notifications & Reminders Engine
 *
 * Context-aware background reminder engine for MicroMind 2.0.
 * Analyzes Q1 urgent tasks, due dates, mood energy state, and focus history
 * to dispatch empathetic browser push notifications & in-app toasts.
 */

let lastReminderTime = 0;
const REMINDER_COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes between auto-reminders

/**
 * Request Web Notifications API permission from user.
 * @returns {Promise<boolean>} True if granted
 */
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Dispatch notification via Browser Web Notification API + App Toast.
 *
 * @param {string} title
 * @param {string} body
 * @param {string} emoji
 * @param {function} showToast
 */
export function sendSmartNotification(
  title,
  body,
  emoji = '🔔',
  showToast = null,
) {
  // In-app toast feedback
  if (showToast) {
    showToast(`${title}: ${body}`, emoji);
  }

  // Native Web Browser Push Notification
  if (
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted'
  ) {
    try {
      new Notification(`${emoji} ${title}`, {
        body,
        icon: '/favicon.ico',
        tag: 'micromind-reminder',
      });
    } catch {
      // Fallback
    }
  }
}

/**
 * Periodically evaluate app state to trigger smart reminders.
 *
 * @param {object} appState - Current Reducer State
 * @param {function} showToast - Toast notification trigger function
 */
export function checkSmartReminders(appState, showToast = null) {
  const now = Date.now();
  if (now - lastReminderTime < REMINDER_COOLDOWN_MS) return;

  const tasks = appState?.tasks || [];
  const activeQ1 = tasks.filter((t) => t.category === 'q1' && !t.completed);
  const hour = new Date().getHours();

  // 1. Morning Urgent Q1 Task Nudge (8 AM - 12 PM)
  if (hour >= 8 && hour < 12 && activeQ1.length > 0) {
    lastReminderTime = now;
    const topTask = activeQ1[0];
    sendSmartNotification(
      'Morning Focus Opportunity',
      `You have ${activeQ1.length} Q1 Do-First task${activeQ1.length > 1 ? 's' : ''}. High priority: "${topTask.text.slice(0, 30)}"`,
      '🔥',
      showToast,
    );
    return;
  }

  // 2. Low Energy Mood Suggestion
  if (appState?.moodToday === 1 || appState?.moodToday === 2) {
    const quickInbox = tasks.filter(
      (t) => t.category === 'inbox' && !t.completed,
    );
    if (quickInbox.length > 0) {
      lastReminderTime = now;
      sendSmartNotification(
        'Gentle Mood Care',
        `Feeling low energy? Try clearing a quick inbox thought instead of heavy Q1 tasks.`,
        '🌱',
        showToast,
      );
      return;
    }
  }

  // 3. Evening Momentum Wrap-Up (5 PM - 8 PM)
  if (hour >= 17 && hour <= 20) {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount > 0) {
      lastReminderTime = now;
      sendSmartNotification(
        'Daily Progress Wrap-Up',
        `You've completed ${completedCount} task${completedCount > 1 ? 's' : ''} today! Review your evening briefing on the dashboard.`,
        '🌅',
        showToast,
      );
      return;
    }
  }
}
