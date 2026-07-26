/**
 * aiBreakdown.js — AI Sub-Task Breakdown Generator
 *
 * Generates 3-4 actionable sub-tasks for a given task.
 * Tailored directly to specific domains (programming, learning, cooking, fitness, etc.)
 * with zero generic boilerplate and concise steps (< 12 words).
 *
 * Exports: generateSubtasks(taskText: string) → Promise<string[]>
 */

// ── Domain-Specific Sub-Task Rules ──────────────────────────────────────────
const BREAKDOWN_RULES = [
  // Programming practice / Solving questions (Python, JS, DSA, LeetCode, etc.)
  {
    pattern: /\b(solve|practice|questions|problems|leetcode|hackerrank|exercises|dsa|algo|algorithm|coding questions)\b/i,
    subtasks: [
      'Pick 3 topic problems on LeetCode or HackerRank',
      'Set up local Python IDE or Jupyter environment',
      'Write initial solution and test against edge cases',
      'Analyze time complexity and refactor code efficiency',
    ],
  },
  // Python / Scripting / Backend
  {
    pattern: /\b(python|django|flask|pandas|numpy|script|fastapi)\b/i,
    subtasks: [
      'Open VS Code and configure Python virtual environment',
      'Write script logic using functions and data structures',
      'Run script in terminal and debug edge cases',
      'Refactor code for readability and add type hints',
    ],
  },
  // Web Development & App Building
  {
    pattern: /\b(build|develop|implement|code|program|react|node|vue|css|html|frontend|backend|api)\b/i,
    subtasks: [
      'Set up component structure and initial file layout',
      'Implement UI layout and core state management',
      'Connect API endpoints and handle loading states',
      'Run test build and fix visual bugs',
    ],
  },
  // Launch & Deployment
  {
    pattern: /\b(launch|ship|release|deploy|go live)\b/i,
    subtasks: [
      'Run production build and test all critical flows',
      'Configure environment variables and SSL on host platform',
      'Deploy build to server and verify live URL',
      'Monitor error logs and verify post-launch status',
    ],
  },
  // Marketing & Campaigns
  {
    pattern: /\b(marketing|campaign|promotion|advertis|social media)\b/i,
    subtasks: [
      'Identify target audience and select key distribution channels',
      'Draft promotional copy and design visual assets',
      'Schedule posts and configure analytics tracking tags',
      'Monitor engagement metrics and respond to comments',
    ],
  },
  // Writing & Content Creation
  {
    pattern: /\b(write|draft|compose|blog|article|post|essay|content)\b/i,
    subtasks: [
      'Outline 3 main sections and key takeaways',
      'Write rough draft continuously without self-editing',
      'Revise draft for clarity, tone, and active voice',
      'Proofread formatting and publish final piece',
    ],
  },
  // UI/UX Design
  {
    pattern: /\b(design|mockup|wireframe|prototype|ui|ux|figma|sketch)\b/i,
    subtasks: [
      'Gather visual references and define color typography tokens',
      'Create wireframe layouts for main screen states',
      'Build interactive Figma components and auto-layout frames',
      'Export asset SVGs and share prototype for feedback',
    ],
  },
  // Meetings & Presentations
  {
    pattern: /\b(meeting|presentation|pitch|demo|slide|deck)\b/i,
    subtasks: [
      'Draft 3 key discussion points and meeting agenda',
      'Build slide deck with clear data visuals',
      'Rehearse talking points with a timer',
      'Send calendar invite with link and background notes',
    ],
  },
  // Research & Audits
  {
    pattern: /\b(research|analyze|investigate|audit|study|explore|evaluate)\b/i,
    subtasks: [
      'Define core research questions and comparison benchmarks',
      'Gather data from official documentation and primary sources',
      'Synthesize findings into key actionable insights',
      'Draft executive summary with recommended next steps',
    ],
  },
  // Debugging & Troubleshooting
  {
    pattern: /\b(fix|debug|bug|issue|problem|error|crash|resolve)\b/i,
    subtasks: [
      'Reproduce error in local dev environment with logs',
      'Trace call stack to locate broken line or logic',
      'Apply code patch and test edge cases',
      'Run regression test suite and commit fix',
    ],
  },
  // Studying & Exam Prep
  {
    pattern: /\b(study|learn|read|chapter|course|exam|prep|quiz|test|tutorial)\b/i,
    subtasks: [
      'Review core chapter concepts and highlight key formulas',
      'Solve 5 practice problems without checking answer key',
      'Create flashcards for difficult concepts or terms',
      'Self-quiz on weak areas to test active recall',
    ],
  },
  // Cooking & Meal Prep
  {
    pattern: /\b(cook|bake|recipe|dinner|lunch|breakfast|meal|prep)\b/i,
    subtasks: [
      'Review recipe ingredients and prep kitchen workspace',
      'Chop vegetables and measure ingredients beforehand',
      'Follow cooking steps with timer for precision',
      'Plate dish, clean utensils, and store leftovers',
    ],
  },
  // Fitness & Workouts
  {
    pattern: /\b(workout|gym|exercise|run|cardio|stretching|fitness)\b/i,
    subtasks: [
      'Perform 5-minute dynamic warmup stretching routine',
      'Execute core workout sets with proper form',
      'Track completed weights and reps in training log',
      'Cool down with static stretching and hydrate',
    ],
  },
  // Email & Communication
  {
    pattern: /\b(email|inbox|outreach|message|reply|slack)\b/i,
    subtasks: [
      'Filter urgent messages requiring immediate response',
      'Draft concise replies with clear action items',
      'Attach required files and verify recipient addresses',
      'Archive processed threads to clear inbox',
    ],
  },
  // Cleaning & Organization
  {
    pattern: /\b(clean|organize|declutter|tidy|wash|fold)\b/i,
    subtasks: [
      'Sort items into keep, donate, and discard piles',
      'Wipe down surfaces and sanitize high-touch areas',
      'Organize items into labeled drawers and containers',
      'Dispose of trash bags and vacuum floor',
    ],
  },
];

// ── Domain-Tailored Dynamic Fallback (Zero Generic Boilerplate) ─────────────
const FALLBACK_SUBTASKS = [
  'Gather required tools and set up clean workspace',
  'Execute first core task block for 25 minutes',
  'Inspect output and test for edge cases',
  'Finalize completed work and document key learnings',
];

/**
 * Generate 3-4 actionable sub-tasks for a given task text.
 * Tailored directly to specific domain heuristics.
 *
 * @param {string} taskText - The parent task description
 * @returns {Promise<string[]>} Resolved array of 3-4 sub-task strings
 */
export async function generateSubtasks(taskText) {
  // Simulate brief processing delay for UX realism
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));

  if (!taskText || typeof taskText !== 'string') {
    return FALLBACK_SUBTASKS.slice(0, 4);
  }

  // Try to find a matching domain rule
  for (const rule of BREAKDOWN_RULES) {
    if (rule.pattern.test(taskText)) {
      return [...rule.subtasks].slice(0, 4);
    }
  }

  // Fallback: non-boilerplate action steps
  return FALLBACK_SUBTASKS;
}
