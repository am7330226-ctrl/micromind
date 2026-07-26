/**
 * aiCopilotService.js — MicroMind AI Copilot Engine
 *
 * Integrates with Google Gemini API (gemini-1.5-flash) for context-aware chat,
 * function calling (addNewTask, moveTask, startPomodoroTimer, answerHowToQuestion),
 * and intelligent client-side fallback parsing.
 */

const GEMINI_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof window !== 'undefined' && window.__GEMINI_API_KEY__) ||
  '';

const getGeminiUrl = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── Gemini Function Declarations ─────────────────────────────────────────────
const TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'addNewTask',
        description: 'Add a new task to MicroMind with description, category, and estimated duration.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'The task description' },
            priority: {
              type: 'STRING',
              description: 'Target category: q1 (Do First), q2 (Schedule), q3 (Delegate), q4 (Dont Do), or inbox (Unsorted)',
            },
            duration: { type: 'NUMBER', description: 'Estimated focus time in minutes (e.g. 15, 30, 45, 60)' },
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
            taskId: { type: 'STRING', description: 'Task ID or text matching the task to move' },
            newPriority: { type: 'STRING', description: 'Target quadrant: q1, q2, q3, q4, or inbox' },
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
            minutes: { type: 'NUMBER', description: 'Focus duration in minutes (e.g. 25, 50, 15)' },
          },
        },
      },
      {
        name: 'answerHowToQuestion',
        description: 'Provide structured advice or action steps for a learning/how-to question.',
        parameters: {
          type: 'OBJECT',
          properties: {
            topic: { type: 'STRING', description: 'Topic or question asked' },
            advice: { type: 'STRING', description: 'Concise step-by-step actionable advice' },
          },
          required: ['topic', 'advice'],
        },
      },
    ],
  },
];

// ── Build Context-Aware System Instructions ─────────────────────────────────
function buildSystemInstruction(appState, userName) {
  const tasks = appState?.tasks || [];
  const q1 = tasks.filter(t => t.category === 'q1' && !t.completed);
  const inbox = tasks.filter(t => t.category === 'inbox' && !t.completed);
  const habits = appState?.habits || [];

  return `You are MicroMind AI Copilot, a helpful productivity assistant embedded inside the MicroMind web app.
User Name: ${userName || 'Friend'}

App State Context:
- Active Streak: ${appState?.streak || 0} days | Level: ${appState?.level || 1} | XP: ${appState?.xp || 0}
- Q1 (Do First) Tasks: ${q1.map(t => `"${t.text}" [id:${t.id}]`).join(', ') || 'None'}
- Unsorted Inbox Tasks: ${inbox.map(t => `"${t.text}" [id:${t.id}]`).join(', ') || 'None'}
- Total Active Tasks: ${tasks.filter(t => !t.completed).length} | Completed Today: ${tasks.filter(t => t.completed).length}
- Habits Progress: ${habits.filter(h => h.done).length}/${habits.length} checked

Capabilities:
1. Add tasks using 'addNewTask' function.
2. Reorganize/move tasks using 'moveTask' function.
3. Start focus sessions using 'startPomodoroTimer' function.
4. Provide step-by-step actionable advice using 'answerHowToQuestion'.

Always be concise (< 3 sentences unless explaining a topic), friendly, and proactive.`;
}

// ── Client-Side Fallback Intent Parser (Robustness Layer) ────────────────────
function parseClientIntent(messageText, appState) {
  const text = messageText.toLowerCase();

  // Match "add task ..." or "create task ..."
  if (text.includes('add task') || text.includes('create task') || text.startsWith('add ') || text.startsWith('new task')) {
    let clean = messageText.replace(/^(add task|create task|add new task|add|new task)\s*:?/i, '').trim();
    let priority = 'inbox';
    if (text.includes('do first') || text.includes('q1') || text.includes('urgent')) priority = 'q1';
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
  if (text.includes('pomodoro') || text.includes('timer') || text.includes('focus session')) {
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
    const firstTask = tasks.find(t => !t.completed) || { id: 'sample', text: 'Task' };
    let newPriority = 'q1';
    if (text.includes('q2') || text.includes('schedule')) newPriority = 'q2';
    if (text.includes('q3') || text.includes('delegate')) newPriority = 'q3';

    return {
      name: 'moveTask',
      args: { taskId: firstTask.id, newPriority },
      text: `Moved **"${firstTask.text}"** to ${newPriority === 'q1' ? 'Do First' : newPriority.toUpperCase()}.`,
    };
  }

  return null;
}

/**
 * Send user message to Gemini API with tool declarations and return response + executed actions.
 *
 * @param {string} userMessage
 * @param {Array} chatHistory - Previous message objects [{ role: 'user'|'model', parts: [{ text }] }]
 * @param {object} appState
 * @param {string} userName
 * @returns {Promise<{ responseText: string, toolCalls: Array }>}
 */
export async function sendCopilotMessage(userMessage, chatHistory = [], appState = {}, userName = 'Friend') {
  // Check client fallback first if offline/simple intent
  const fallbackIntent = parseClientIntent(userMessage, appState);

  try {
    const systemInstruction = buildSystemInstruction(appState, userName);

    const contents = [
      ...chatHistory.map(m => ({
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
      throw new Error(`Gemini API HTTP ${response.status}`);
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

    // If fallback intent was detected and no API tool calls returned, attach fallback
    if (toolCalls.length === 0 && fallbackIntent) {
      toolCalls.push({ name: fallbackIntent.name, args: fallbackIntent.args });
      if (!responseText) responseText = fallbackIntent.text;
    }

    if (!responseText) {
      responseText = "I'm ready to help you manage your tasks and focus time!";
    }

    return { responseText, toolCalls };
  } catch (err) {
    console.warn('Gemini API call warning/fallback:', err.message);

    // Use graceful fallback when API key/network fails
    if (fallbackIntent) {
      return {
        responseText: fallbackIntent.text,
        toolCalls: [{ name: fallbackIntent.name, args: fallbackIntent.args }],
      };
    }

    // Default intelligent response
    const defaultText = `I'm here to assist! You currently have **${(appState?.tasks || []).filter(t => !t.completed).length} active tasks**. Ask me to add tasks, start focus timers, or break down work!`;
    return { responseText: defaultText, toolCalls: [] };
  }
}
