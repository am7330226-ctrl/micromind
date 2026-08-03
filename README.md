# 🧠 MicroMind — Daily Mental Declutter

A **premium, dark-themed productivity dashboard** that solves daily mental overload by giving you a beautiful place to capture, sort, and act on tasks and micro-habits — powered by **React 19, Vite, local on-device AI**, and **Supabase**.

---

## ✨ Features

- ⚡ **Brain Dump Inbox** — Instantly capture any task, thought, or distraction with zero friction (press `/` to focus).
- 🤖 **On-Device AI Auto-Sorting** — Local Web Worker (`ai-worker.js`) classifies tasks into Eisenhower quadrants via `@xenova/transformers` zero-shot NLI (`Xenova/nli-deberta-v3-small`) with zero main-thread lag.
- 🗂️ **Eisenhower Priority Matrix** — Visual 4-quadrant organization (_Do First / Schedule / Delegate / Eliminate_).
- 🎯 **Today's Focus Three** — Commit to 3 high-impact priorities with WIP limit enforcement.
- 🎮 **Gamification & XP** — Earn XP, level up, maintain streaks, and unlock badges (_Task Crusher_, _7-Day Warrior_, _Focus Master_).
- 🌿 **Daily Micro-Habits** — 6 toggleable habit trackers with smart daily resets.
- ⏱️ **Pomodoro Focus Timer** — Integrated focus timer tracking sessions for productivity analytics.
- 📊 **Analytics Dashboard** — Visual breakdown of quadrant distribution, habit history, and completion rates.
- 🔐 **Supabase Cloud Sync & Local Fallback** — Real-time Postgres data persistence and auth via Supabase, with an Express (`server.js` + `db.json`) fallback option.
- 🌙 **Smart Daily Reset** — Archives completed tasks while preserving recurring tags (`#daily`, `@weekly`, `@monday`).

---

## 🛠️ Tech Stack

| Technology            | Usage                                                         |
| --------------------- | ------------------------------------------------------------- |
| **React 19 & Vite 6** | Modern frontend framework & ultra-fast build engine           |
| **Transformers.js**   | On-device zero-shot AI classification running in a Web Worker |
| **Supabase JS**       | User authentication & Postgres state synchronization          |
| **Express & Node.js** | Alternative local server fallback with JSON database          |
| **Vanilla CSS**       | Glassmorphism dark theme, custom design tokens, & animations  |
| **Canvas Confetti**   | Dynamic particle animations on task completion                |

---

## 📁 Project Structure

```
micromind/
├── index.html               # App entry point HTML
├── vite.config.js           # Vite configuration
├── ai-worker.js             # Web Worker for off-thread AI classification
├── server.js                # Optional Express fallback server
├── .env.example             # Environment variable template
├── public/                  # Static assets & PWA manifest
└── src/
    ├── App.jsx              # Root component & page layout
    ├── store.jsx            # State context, reducers & Supabase data sync
    ├── supabase.js          # Supabase client setup
    ├── index.css            # Design tokens & glassmorphism theme styles
    ├── hooks/               # Custom React hooks (useToast)
    └── components/          # App UI components
        ├── AnalyticsDashboard.jsx
        ├── AuthModal.jsx
        ├── BrainDump.jsx
        ├── EisenhowerMatrix.jsx
        ├── HabitTracker.jsx
        ├── Header.jsx
        ├── MoodWidget.jsx
        ├── PomodoroTimer.jsx
        ├── TaskDetailPanel.jsx
        ├── TaskItem.jsx
        └── ToastContainer.jsx
```

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)

### 2. Installation & Setup

```bash
# Clone the repository
git clone https://github.com/your-username/micromind.git
cd micromind

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Set your Supabase credentials in `.env` (optional — defaults to built-in fallbacks):

```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Running Locally

**Development Server (Frontend only):**

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

**Local Express Server (Optional fallback):**

```bash
npm run server
```

**Production Build:**

```bash
npm run build
npm run preview
```

---

## 📄 License

MIT — free to use, modify, and distribute.
