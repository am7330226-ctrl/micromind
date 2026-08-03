/**
 * voiceBriefing.js — Voice AI Briefing Script Generator
 *
 * Compiles a natural, personalized daily briefing script
 * based on app state, then reads it using the Web Speech API.
 *
 * Exports:
 *   generateBriefingScript(state, userName) → string
 *   isVoiceSupported() → boolean
 */

/**
 * Check if Web Speech API is available in this browser.
 * @returns {boolean}
 */
export function isVoiceSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

/**
 * Get the current time-of-day greeting.
 * @returns {string}
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Generate a natural, personalized daily briefing script.
 *
 * @param {object} state - Full app state from useAppState()
 * @param {string} userName - User's display name
 * @returns {string} Full briefing script ready for text-to-speech
 */
export function generateBriefingScript(state, userName) {
  const greeting = getGreeting();
  const name =
    userName && userName !== 'Guest' ? `, ${userName.split(' ')[0]}` : '';

  const tasks = state.tasks || [];
  const q1Tasks = tasks.filter((t) => t.category === 'q1' && !t.completed);
  const totalIncomplete = tasks.filter((t) => !t.completed).length;
  const totalComplete = tasks.filter((t) => t.completed).length;
  const streak = state.streak || 0;
  const level = state.level || 1;
  const habits = state.habits || [];
  const habitsDone = habits.filter((h) => h.done).length;

  const lines = [];

  // ── Opening ────────────────────────────────────────────────────────────────
  lines.push(`${greeting}${name}! Welcome to your MicroMind daily briefing.`);

  // ── Task Overview ──────────────────────────────────────────────────────────
  if (q1Tasks.length > 0) {
    lines.push(
      `You have ${q1Tasks.length} urgent ${q1Tasks.length === 1 ? 'task' : 'tasks'} in your Do First list that need immediate attention.`,
    );
    const topTask = q1Tasks[0];
    lines.push(`Your top priority right now is: "${topTask.text}".`);
  } else if (totalIncomplete > 0) {
    lines.push(
      `You have ${totalIncomplete} ${totalIncomplete === 1 ? 'task' : 'tasks'} remaining across your priority matrix.`,
    );
  } else {
    lines.push(
      `Your task board is completely clear! Great job staying on top of things.`,
    );
  }

  // ── Completed Work ─────────────────────────────────────────────────────────
  if (totalComplete > 0) {
    lines.push(
      `You've already completed ${totalComplete} ${totalComplete === 1 ? 'task' : 'tasks'} today. Keep up the momentum!`,
    );
  }

  // ── Habits ─────────────────────────────────────────────────────────────────
  if (habits.length > 0) {
    if (habitsDone === habits.length) {
      lines.push(`Amazing! All ${habits.length} daily habits are checked off.`);
    } else if (habitsDone > 0) {
      lines.push(
        `You've completed ${habitsDone} out of ${habits.length} daily habits so far.`,
      );
    } else {
      lines.push(
        `Your daily habits are waiting for you — don't forget to check them off!`,
      );
    }
  }

  // ── Streak & Level ─────────────────────────────────────────────────────────
  if (streak > 0) {
    lines.push(
      streak >= 7
        ? `Impressive! You're on a ${streak}-day productivity streak. You're on fire!`
        : `You're on a ${streak}-day streak. Keep it going!`,
    );
  }

  if (level > 1) {
    lines.push(
      `You're at Level ${level}. Every task completed earns you more experience points.`,
    );
  }

  // ── Motivational Close ─────────────────────────────────────────────────────
  const closings = [
    `Let's make today count. You've got this!`,
    `One task at a time. You're doing great.`,
    `Focus on what matters most. Let's get started!`,
    `Small steps lead to big wins. Let's go!`,
    `You have everything you need to succeed today.`,
  ];
  const closing = closings[Math.floor(Math.random() * closings.length)];
  lines.push(closing);

  return lines.join(' ');
}
