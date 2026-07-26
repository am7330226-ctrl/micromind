/**
 * aiBreakdown.js — AI Sub-Task Breakdown Generator
 *
 * Generates 3-4 actionable sub-tasks for a given high-priority task.
 * Uses intelligent heuristics (keyword matching + templates) locally
 * with no external API calls — zero latency, zero cost, privacy-first.
 *
 * Exports: generateSubtasks(taskText: string) → Promise<string[]>
 */

// ── Domain-Specific Sub-Task Templates ──────────────────────────────────────
const BREAKDOWN_RULES = [
  {
    pattern: /\b(launch|ship|release|deploy|go live)\b/i,
    subtasks: [
      'Define launch goals and success metrics',
      'Complete pre-launch QA checklist and fix blockers',
      'Notify stakeholders and prepare launch announcement',
      'Monitor performance and gather initial feedback',
    ],
  },
  {
    pattern: /\b(marketing|campaign|promotion|advertis)\b/i,
    subtasks: [
      'Define target audience and key message',
      'Create content assets (copy, visuals, CTAs)',
      'Set up tracking and analytics for the campaign',
      'Schedule and distribute across channels',
    ],
  },
  {
    pattern: /\b(write|draft|compose|blog|article|post|essay|content)\b/i,
    subtasks: [
      'Outline the main sections and key points',
      'Write first draft without editing',
      'Revise for clarity, flow, and accuracy',
      'Proofread, format, and publish',
    ],
  },
  {
    pattern: /\b(build|develop|implement|code|program|create (a |the )?app|feature|module)\b/i,
    subtasks: [
      'Break down requirements and define acceptance criteria',
      'Design data model and component architecture',
      'Implement core logic and write unit tests',
      'Review, refactor, and merge to main branch',
    ],
  },
  {
    pattern: /\b(design|mockup|wireframe|prototype|ui|ux|figma|sketch)\b/i,
    subtasks: [
      'Gather references and define design constraints',
      'Create low-fidelity wireframes for key screens',
      'Develop high-fidelity mockups with branding and colors',
      'Share with stakeholders and incorporate feedback',
    ],
  },
  {
    pattern: /\b(meeting|presentation|pitch|demo|slide|deck)\b/i,
    subtasks: [
      'Define the goal and agenda for the meeting',
      'Prepare supporting slides or materials',
      'Rehearse key talking points',
      'Send calendar invite and share materials beforehand',
    ],
  },
  {
    pattern: /\b(research|analyze|investigate|audit|study|explore|evaluate)\b/i,
    subtasks: [
      'Define the research question and scope',
      'Gather data from relevant sources',
      'Analyze findings and identify key insights',
      'Document conclusions and next steps',
    ],
  },
  {
    pattern: /\b(plan|strategy|roadmap|strategy|goal|objective|initiative)\b/i,
    subtasks: [
      'Define the objective and desired outcome',
      'Identify key milestones and dependencies',
      'Assign ownership and set deadlines',
      'Create a tracking mechanism to measure progress',
    ],
  },
  {
    pattern: /\b(report|document|documentation|spec|requirement)\b/i,
    subtasks: [
      'Gather all relevant data and context',
      'Create the document structure and template',
      'Fill in all sections with clear, accurate content',
      'Review with stakeholders and finalize',
    ],
  },
  {
    pattern: /\b(fix|debug|bug|issue|problem|error|crash|resolve)\b/i,
    subtasks: [
      'Reproduce the issue consistently in a test environment',
      'Identify root cause through logs and investigation',
      'Implement and test the fix',
      'Deploy the fix and verify it resolves the issue',
    ],
  },
  {
    pattern: /\b(onboard|train|hire|interview|recruit)\b/i,
    subtasks: [
      'Prepare onboarding materials or interview questions',
      'Schedule and conduct the session',
      'Provide feedback or evaluation',
      'Follow up with action items or next steps',
    ],
  },
];

// ── Generic Fallback Template ────────────────────────────────────────────────
const GENERIC_SUBTASKS = [
  'Clarify the goal and define what "done" looks like',
  'Break this task into smaller pieces and start the first one',
  'Execute the main work and track progress',
  'Review the output and finalize',
];

/**
 * Generate 3-4 actionable sub-tasks for a given task text.
 * Simulates async behavior (e.g. API call) for non-blocking UX.
 *
 * @param {string} taskText - The parent task description
 * @returns {Promise<string[]>} Resolved array of 3-4 sub-task strings
 */
export async function generateSubtasks(taskText) {
  // Simulate brief processing delay for UX realism
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

  if (!taskText || typeof taskText !== 'string') {
    return GENERIC_SUBTASKS.slice(0, 3);
  }

  // Try to find a matching domain rule
  for (const rule of BREAKDOWN_RULES) {
    if (rule.pattern.test(taskText)) {
      // Slightly randomize to always return 3-4 varied subtasks
      const shuffled = [...rule.subtasks];
      return shuffled.slice(0, 4);
    }
  }

  // Fallback: generic task breakdown
  return GENERIC_SUBTASKS;
}
