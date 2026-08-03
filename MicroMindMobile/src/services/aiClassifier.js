/**
 * aiClassifier.js — On-Device Hybrid Classifier & Assistant for React Native
 */

const QUADRANT_PATTERNS = {
  q1: /\b(urgent|asap|critical|emergency|due today|today|deadline|overdue|fix bug|break|outage|blocker|hotfix)\b/i,
  q2: /\b(plan|strategy|goals|roadmap|study|learn|exercise|workout|health|meditate|design|refactor|course|chapter|read|career|habits|future)\b/i,
  q3: /\b(email|call|reply|text|message|ping|slack|meeting|sync|1:1|book|schedule|purchase|invoice|buy|order|admin)\b/i,
  q4: /\b(scroll|browse|watch|tv|game|gaming|social media|twitter|instagram|reddit|youtube|random|trivia|gossip)\b/i,
};

/**
 * Classifies a task string into an Eisenhower category
 * @param {string} text
 * @returns {string} 'q1' | 'q2' | 'q3' | 'q4' | 'inbox'
 */
export function classifyTask(text) {
  if (!text || typeof text !== 'string') return 'inbox';

  if (QUADRANT_PATTERNS.q1.test(text)) return 'q1';
  if (QUADRANT_PATTERNS.q2.test(text)) return 'q2';
  if (QUADRANT_PATTERNS.q3.test(text)) return 'q3';
  if (QUADRANT_PATTERNS.q4.test(text)) return 'q4';

  return 'inbox';
}

const KEYWORD_RULES = [
  {
    pattern: /\b(call|phone|text|ping|slack|reply|confirm|quick)\b/i,
    minutes: 5,
  },
  {
    pattern: /\b(check|read|glance|verify|look at|review notification)\b/i,
    minutes: 10,
  },
  {
    pattern:
      /\b(email|respond|schedule|book|reserve|purchase|order|pay|invoice|form|sign)\b/i,
    minutes: 15,
  },
  { pattern: /\b(meeting|standup|sync|1:1|talk with|discuss)\b/i, minutes: 30 },
  {
    pattern: /\b(fix|patch|bug|hotfix|debug|tweak|update|edit|revise)\b/i,
    minutes: 30,
  },
  {
    pattern:
      /\b(write|draft|compose|prepare|outline|summarize|document|report|slides|presentation|proposal)\b/i,
    minutes: 45,
  },
  {
    pattern: /\b(design|mockup|wireframe|prototype|figma|sketch|ui|ux)\b/i,
    minutes: 60,
  },
  {
    pattern:
      /\b(implement|build|develop|create|code|program|refactor|migrate|integrate)\b/i,
    minutes: 60,
  },
  {
    pattern: /\b(research|analyze|investigate|study|explore|audit|evaluate)\b/i,
    minutes: 60,
  },
  {
    pattern:
      /\b(launch|deploy|release|ship|plan|strategy|roadmap|architect|system|feature|project)\b/i,
    minutes: 90,
  },
  {
    pattern:
      /\b(campaign|marketing|onboarding|workshop|training|course|tutorial)\b/i,
    minutes: 120,
  },
];

export function formatMinutes(minutes) {
  if (!minutes || minutes <= 0) return '5m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function estimateTaskTime(text) {
  if (!text || typeof text !== 'string') return { minutes: 15, label: '15m' };

  let minutes = 15;
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(text)) {
      minutes = Math.max(minutes, rule.minutes);
    }
  }

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 12) minutes += 15;
  else if (wordCount > 7) minutes += 5;

  minutes = Math.min(minutes, 120);

  return { minutes, label: formatMinutes(minutes) };
}

const BREAKDOWN_RULES = [
  {
    pattern:
      /\b(solve|practice|questions|problems|leetcode|hackerrank|exercises|dsa|algo|coding questions)\b/i,
    subtasks: [
      'Pick 3 topic problems on LeetCode or HackerRank',
      'Set up local Python IDE or Jupyter environment',
      'Write initial solution and test against edge cases',
      'Analyze time complexity and refactor code efficiency',
    ],
  },
  {
    pattern: /\b(python|django|flask|pandas|numpy|script|fastapi)\b/i,
    subtasks: [
      'Configure Python environment and dependencies',
      'Write script logic using functions and data structures',
      'Run script in terminal and debug edge cases',
      'Refactor code for readability and type hints',
    ],
  },
  {
    pattern:
      /\b(build|develop|implement|code|program|react|node|vue|css|html|frontend|backend|api|app)\b/i,
    subtasks: [
      'Set up component structure and initial file layout',
      'Implement UI layout and core state management',
      'Connect API endpoints and handle loading states',
      'Run test build and fix visual bugs',
    ],
  },
  {
    pattern: /\b(write|draft|compose|blog|article|post|essay|content)\b/i,
    subtasks: [
      'Outline 3 main sections and key takeaways',
      'Write rough draft continuously without self-editing',
      'Revise draft for clarity and active voice',
      'Proofread formatting and publish final piece',
    ],
  },
  {
    pattern:
      /\b(study|learn|read|chapter|course|exam|prep|quiz|test|tutorial)\b/i,
    subtasks: [
      'Review core concepts and highlight key formulas',
      'Solve 5 practice problems without checking answer key',
      'Create flashcards for difficult concepts or terms',
      'Self-quiz on weak areas to test active recall',
    ],
  },
  {
    pattern: /\b(workout|gym|exercise|run|cardio|stretching|fitness)\b/i,
    subtasks: [
      'Perform 5-minute dynamic warmup routine',
      'Execute core workout sets with proper form',
      'Track completed weights and reps in training log',
      'Cool down with static stretching and hydrate',
    ],
  },
];

const FALLBACK_SUBTASKS = [
  'Gather required tools and set up clean workspace',
  'Execute first core task block for 25 minutes',
  'Inspect output and test for edge cases',
  'Finalize completed work and document key learnings',
];

export async function generateSubtasks(taskText) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (!taskText || typeof taskText !== 'string') return FALLBACK_SUBTASKS;

  for (const rule of BREAKDOWN_RULES) {
    if (rule.pattern.test(taskText)) {
      return [...rule.subtasks].slice(0, 4);
    }
  }

  return FALLBACK_SUBTASKS;
}
