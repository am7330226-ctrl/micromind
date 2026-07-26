/**
 * estimateTaskTime.js — Smart Time Estimator
 *
 * Analyzes task text complexity using keyword heuristics and word count
 * to return a realistic time estimate in minutes.
 *
 * Returns: { minutes: number, label: string }
 *   e.g. { minutes: 45, label: '45m' }
 *        { minutes: 90, label: '1h 30m' }
 */

// ── Keyword Patterns & Their Estimated Minutes ──────────────────────────────
const KEYWORD_RULES = [
  // Very quick (2-5 min)
  { pattern: /\b(call|phone|text|ping|slack|dm|reply|ack|confirm|quick (check|ask|message))\b/i, minutes: 5 },
  { pattern: /\b(check|read|glance|verify|look at|review notification)\b/i, minutes: 10 },

  // Short tasks (15-30 min)
  { pattern: /\b(email|respond|schedule|book|reserve|purchase|order|pay|invoice|fill|form|sign)\b/i, minutes: 15 },
  { pattern: /\b(meeting|standup|sync|1:1|one-on-one|call with|talk with|discuss)\b/i, minutes: 30 },
  { pattern: /\b(fix|patch|bug|hotfix|debug|tweak|update|edit|revise|proofread)\b/i, minutes: 30 },

  // Medium tasks (45-60 min)
  { pattern: /\b(write|draft|compose|prepare|outline|summarize|document|report|slides|presentation|proposal)\b/i, minutes: 45 },
  { pattern: /\b(design|mockup|wireframe|prototype|figma|sketch|ui|ux)\b/i, minutes: 60 },
  { pattern: /\b(implement|build|develop|create|code|program|refactor|migrate|integrate)\b/i, minutes: 60 },
  { pattern: /\b(research|analyze|investigate|study|explore|audit|review|evaluate)\b/i, minutes: 60 },

  // Long tasks (90-120 min)
  { pattern: /\b(launch|deploy|release|ship|plan|strategy|roadmap|architect|system|feature|project)\b/i, minutes: 90 },
  { pattern: /\b(campaign|marketing|onboarding|workshop|training|course|tutorial)\b/i, minutes: 120 },
];

// Complexity boost from word count
function wordCountBoost(text) {
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 12) return 15; // Long task description → complexity bonus
  if (wordCount > 7)  return 5;
  return 0;
}

/**
 * Estimate task time from its text.
 * @param {string} text - The task description
 * @returns {{ minutes: number, label: string }}
 */
export function estimateTaskTime(text) {
  if (!text || typeof text !== 'string') return { minutes: 15, label: '15m' };

  let minutes = 15; // default minimum

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(text)) {
      minutes = Math.max(minutes, rule.minutes);
    }
  }

  minutes += wordCountBoost(text);

  // Cap at 2 hours
  minutes = Math.min(minutes, 120);

  return { minutes, label: formatMinutes(minutes) };
}

/**
 * Format minutes into human-readable label.
 * @param {number} minutes
 * @returns {string} e.g. '45m', '1h 30m', '2h'
 */
export function formatMinutes(minutes) {
  if (!minutes || minutes <= 0) return '5m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Sum total minutes from a list of tasks.
 * @param {Array} tasks - Task objects with timeEstimate: { minutes }
 * @returns {{ minutes: number, label: string }}
 */
export function sumFocusTime(tasks) {
  const total = tasks.reduce((acc, t) => {
    if (t.completed) return acc;
    return acc + (t.timeEstimate?.minutes || 0);
  }, 0);
  return { minutes: total, label: total > 0 ? formatMinutes(total) : null };
}
