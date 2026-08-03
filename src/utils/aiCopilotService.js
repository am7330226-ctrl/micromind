/**
 * aiCopilotService.js — MicroMind AI Copilot Engine
 *
 * Configured for Google Gemini 1.5 Flash API with tool declarations
 * (addNewTask, moveTask, startPomodoroTimer, answerHowToQuestion),
 * explicit error logging, and resilient offline fallback parsing.
 */

// ── API Key Resolution ───────────────────────────────────────────────────────
export function getApiKey() {
  if (
    typeof window !== 'undefined' &&
    localStorage.getItem('micromind_gemini_api_key')
  ) {
    return localStorage.getItem('micromind_gemini_api_key');
  }
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_GEMINI_API_KEY
  ) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) {
    return process.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (typeof window !== 'undefined' && window.__GEMINI_API_KEY__) {
    return window.__GEMINI_API_KEY__;
  }
  return '';
}

export function setApiKey(key) {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('micromind_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('micromind_gemini_api_key');
    }
  }
}

function getGeminiUrl() {
  const apiKey = getApiKey();
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
}

// ── Gemini Function Declarations ─────────────────────────────────────────────
const TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'addNewTask',
        description:
          'Add a new task to MicroMind with title, priority category, and duration estimate.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'The task description' },
            priority: {
              type: 'STRING',
              description:
                'Target category: q1 (Do First), q2 (Schedule), q3 (Delegate), q4 (Dont Do), or inbox (Unsorted)',
            },
            duration: {
              type: 'NUMBER',
              description:
                'Estimated focus time in minutes (e.g. 15, 30, 45, 60)',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'moveTask',
        description: 'Move an existing task to a new priority category.',
        parameters: {
          type: 'OBJECT',
          properties: {
            taskId: {
              type: 'STRING',
              description: 'Task ID or text matching the task to move',
            },
            newPriority: {
              type: 'STRING',
              description: 'Target quadrant: q1, q2, q3, q4, or inbox',
            },
          },
          required: ['taskId', 'newPriority'],
        },
      },
      {
        name: 'startPomodoroTimer',
        description: 'Start a Pomodoro focus timer session.',
        parameters: {
          type: 'OBJECT',
          properties: {
            minutes: {
              type: 'NUMBER',
              description: 'Focus duration in minutes (e.g. 25, 50, 15)',
            },
          },
        },
      },
      {
        name: 'answerHowToQuestion',
        description:
          'Provide structured advice or action steps for a learning/how-to question.',
        parameters: {
          type: 'OBJECT',
          properties: {
            topic: { type: 'STRING', description: 'Topic or question asked' },
            advice: {
              type: 'STRING',
              description: 'Concise step-by-step actionable advice',
            },
          },
          required: ['topic', 'advice'],
        },
      },
    ],
  },
];

// ── Context-Aware System Instructions ──────────────────────────────────────
function buildSystemInstruction(appState, userName) {
  const tasks = (appState?.tasks || []).filter(
    (t) => t && typeof t === 'object',
  );
  const q1 = tasks.filter((t) => t.category === 'q1' && !t.completed);
  const inbox = tasks.filter((t) => t.category === 'inbox' && !t.completed);
  const habits = (appState?.habits || []).filter(Boolean);

  return `You are MicroMind AI Copilot, an intelligent productivity assistant embedded inside the MicroMind web app.
User Name: ${userName || 'Friend'}

Current App Context:
- Active Streak: ${appState?.streak || 0} days | Level: ${appState?.level || 1} | XP: ${appState?.xp || 0}
- Q1 (Do First) Tasks: ${q1.map((t) => `"${t.text || 'Task'}" [id:${t.id}]`).join(', ') || 'None'}
- Unsorted Inbox Tasks: ${inbox.map((t) => `"${t.text || 'Task'}" [id:${t.id}]`).join(', ') || 'None'}
- Total Active Tasks: ${tasks.filter((t) => !t.completed).length} | Completed Today: ${tasks.filter((t) => t.completed).length}
- Habits Progress: ${habits.filter((h) => h.done).length}/${habits.length} checked

Capabilities & Tools:
1. Add tasks using 'addNewTask' function.
2. Reorganize/move tasks using 'moveTask' function.
3. Start focus sessions using 'startPomodoroTimer' function.
4. Provide step-by-step actionable advice using 'answerHowToQuestion'.

Guidelines: Always be concise (< 3 sentences unless explaining a topic), warm, and encouraging.`;
}

// ── Client-Side Intent Parser (Smart Local Engine) ─────────────────────────
function parseClientIntent(messageText, appState) {
  const text = messageText.toLowerCase();
  const activeTasksCount = (appState?.tasks || []).filter(
    (t) => !t.completed,
  ).length;

  // Match "add task ..."
  if (
    text.includes('add task') ||
    text.includes('create task') ||
    text.startsWith('add ') ||
    text.startsWith('new task')
  ) {
    let clean = messageText
      .replace(/^(add task|create task|add new task|add|new task)\s*:?/i, '')
      .trim();
    let priority = 'inbox';
    if (
      text.includes('do first') ||
      text.includes('q1') ||
      text.includes('urgent')
    )
      priority = 'q1';
    else if (text.includes('schedule') || text.includes('q2')) priority = 'q2';
    else if (text.includes('delegate') || text.includes('q3')) priority = 'q3';

    let duration = 30;
    const durMatch = clean.match(/(\d+)\s*(m|min|minutes)/i);
    if (durMatch) {
      duration = parseInt(durMatch[1], 10);
      clean = clean.replace(/(\d+)\s*(m|min|minutes)/i, '').trim();
    }

    return {
      name: 'addNewTask',
      args: { title: clean || 'New Task', priority, duration },
      text: `Added **"${clean || 'New Task'}"** to your ${priority === 'q1' ? 'Do First' : 'Inbox'} list (${duration}m).`,
    };
  }

  // Match "start pomodoro" or "timer"
  if (
    text.includes('pomodoro') ||
    text.includes('timer') ||
    text.includes('focus session')
  ) {
    const minMatch = text.match(/(\d+)\s*(m|min|minutes)/i);
    const minutes = minMatch ? parseInt(minMatch[1], 10) : 25;
    return {
      name: 'startPomodoroTimer',
      args: { minutes },
      text: `Started a **${minutes}-minute Pomodoro focus session**! Stay focused. 🍓`,
    };
  }

  // Match "move ..."
  if (text.includes('move') || text.includes('assign')) {
    const tasks = appState?.tasks || [];
    const firstTask = tasks.find((t) => !t.completed) || {
      id: 'sample',
      text: 'Task',
    };
    let newPriority = 'q1';
    if (text.includes('q2') || text.includes('schedule')) newPriority = 'q2';
    if (text.includes('q3') || text.includes('delegate')) newPriority = 'q3';

    return {
      name: 'moveTask',
      args: { taskId: firstTask.id, newPriority },
      text: `Moved **"${firstTask.text}"** to ${newPriority === 'q1' ? 'Do First' : newPriority.toUpperCase()}.`,
    };
  }

  // Match "break down" / "subtasks"
  if (
    text.includes('break down') ||
    text.includes('breakdown') ||
    text.includes('subtask') ||
    text.includes('steps')
  ) {
    return {
      name: 'breakdownTasks',
      args: {},
      text: `Analyzed your **Do First** quadrant and generated actionable sub-task checklists! ⚡`,
    };
  }

  // General query response in Local Engine mode
  return {
    name: 'generalOfflineResponse',
    args: {},
    text: `⚡ **Smart Local Engine Active**: You currently have **${activeTasksCount} active task${activeTasksCount !== 1 ? 's' : ''}**. Ask me to *"Add task..."*, *"Start timer"*, or *"Break down Q1"*!`,
  };
}

/**
 * Send user message to Gemini API with function calling, logging, and resilient local engine fallback.
 *
 * @param {string} userMessage
 * @param {Array} chatHistory
 * @param {object} appState
 * @param {string} userName
 * @returns {Promise<{ responseText: string, toolCalls: Array, engine: string, error: string|null }>}
 */
export async function sendCopilotMessage(
  userMessage,
  chatHistory = [],
  appState = {},
  userName = 'Friend',
) {
  const fallbackIntent = parseClientIntent(userMessage, appState);
  const apiKey = getApiKey();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // ── Offline / No-Key Routing → Smart Local Engine ──────────────────────────
  if (!isOnline || !apiKey) {
    return {
      responseText: fallbackIntent.text,
      toolCalls:
        fallbackIntent.name !== 'generalOfflineResponse'
          ? [{ name: fallbackIntent.name, args: fallbackIntent.args }]
          : [],
      engine: isOnline ? 'local_no_key' : 'local_offline',
      error: null,
    };
  }

  // ── Online Routing → Gemini 2.5 Flash Cloud LLM ───────────────────────────
  try {
    const systemInstruction = buildSystemInstruction(appState, userName);
    const contents = [
      ...chatHistory.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    const body = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
      tools: TOOL_DECLARATIONS,
    };

    const response = await fetch(getGeminiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(
        `Gemini API HTTP ${response.status}: ${errText || response.statusText}`,
      );
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0];

    const toolCalls = [];
    let responseText = '';

    if (candidate?.functionCall) {
      const call = candidate.functionCall;
      toolCalls.push({ name: call.name, args: call.args });
      responseText = `I've executed that action for you!`;
    } else if (candidate?.text) {
      responseText = candidate.text;
    }

    // Attach fallback intent if API gave plain text without tool calls for action commands
    if (
      toolCalls.length === 0 &&
      fallbackIntent &&
      fallbackIntent.name !== 'generalOfflineResponse'
    ) {
      toolCalls.push({ name: fallbackIntent.name, args: fallbackIntent.args });
      if (!responseText) responseText = fallbackIntent.text;
    }

    if (!responseText) {
      responseText = "I'm ready to help you manage your tasks and focus time!";
    }

    return { responseText, toolCalls, engine: 'online', error: null };
  } catch (error) {
    console.warn(
      'AI Copilot Gemini Error (Falling back to Smart Local Engine):',
      error.message,
    );

    // Seamless auto-fallback to Smart Local Engine on API/Network failure
    return {
      responseText: fallbackIntent.text,
      toolCalls:
        fallbackIntent.name !== 'generalOfflineResponse'
          ? [{ name: fallbackIntent.name, args: fallbackIntent.args }]
          : [],
      engine: 'local_fallback',
      error: null,
    };
  }
}

/**
 * Parse a multi-sentence voice recording into multiple structured task items.
 * Uses Gemini JSON Mode when online, or local delimiter splitting offline.
 *
 * @param {string} transcript - The spoken text recording
 * @returns {Promise<Array<{ title: string, priority: string, duration: number }>>}
 */
export async function parseMultiTaskVoiceDump(transcript) {
  if (!transcript || typeof transcript !== 'string') return [];
  const apiKey = getApiKey();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (isOnline && apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const prompt = `Extract all individual task items from this spoken transcript into JSON format. Assign each task a title, priority (q1, q2, q3, q4, or inbox), and duration in minutes.\nTranscript: "${transcript}"`;
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          response_schema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                priority: { type: 'STRING' },
                duration: { type: 'NUMBER' },
              },
              required: ['title'],
            },
          },
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {
      // Fallback
    }
  }

  // Local fallback: split by punctuation and conjunctions ("and", "then", ",", ".")
  const parts = transcript
    .split(/\b(?:and|then|also|plus)\b|[,.;\n]/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  return parts.map((part) => {
    let priority = 'inbox';
    const lower = part.toLowerCase();
    if (/\b(urgent|asap|today|critical|important)\b/.test(lower))
      priority = 'q1';
    else if (/\b(schedule|plan|study|read)\b/.test(lower)) priority = 'q2';

    let duration = 25;
    const durMatch = part.match(/(\d+)\s*(m|min|minutes)/i);
    if (durMatch) duration = parseInt(durMatch[1], 10);

    return { title: part, priority, duration };
  });
}

/**
 * 1-Click Overwhelm Buster: Decompose a big intimidating goal into micro-tasks (< 15m each).
 *
 * @param {string} goalTitle - Intimidating task title
 * @returns {Promise<string[]>} List of 3-4 micro sub-task strings
 */
export async function decomposeGoal(goalTitle) {
  if (!goalTitle) return [];
  const apiKey = getApiKey();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (isOnline && apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const prompt = `Decompose this big goal into 3-4 micro actionable sub-tasks (< 15 mins each) to eliminate procrastination and overwhelm. Output JSON array of strings.\nGoal: "${goalTitle}"`;
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          response_schema: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {
      // Fallback
    }
  }

  // Local fallback
  return [
    `Set timer for 10 mins & open workspace for "${goalTitle.slice(0, 20)}"`,
    'Outline initial structure and 3 core action points',
    'Execute first 15-minute core block without self-editing',
    'Review progress and log completed micro-step',
  ];
}
