# 🧠 MicroMind — Daily Mental Declutter

A **premium, dark-themed productivity suite** that solves daily mental overload by giving you a beautiful place to capture, sort, and act on tasks and micro-habits — powered by **React 19, Vite, on-device + cloud AI**, and **Supabase**. Ships as a web app, a React Native mobile app, and a Chrome/Edge browser extension.

---

## ✨ Features

- ⚡ **Brain Dump Inbox** — Instantly capture any task, thought, or distraction with zero friction (press `/` to focus).
- 🤖 **Dual-Engine AI Copilot** — Online Gemini 2.5 Flash for rich task creation, rescheduling, and Q&A, auto-falling back to a local rule-based engine when no API key is set.
- ☀️ **AI Daily Briefing & Voice Readouts** — Morning focus roadmaps and evening decompression banners, with Web Speech API voice playback.
- 🗂️ **Eisenhower Priority Matrix** — Visual 4-quadrant organization (_Do First / Schedule / Delegate / Eliminate_) with drag-and-drop.
- 🎯 **Focus League & Today's Focus Three** — Commit to high-impact priorities with WIP limit enforcement.
- 🎮 **Gamification & XP** — Earn XP, level up, maintain streaks, and unlock badges (_Task Crusher_, _7-Day Warrior_, _Focus Master_).
- 🌿 **Daily Micro-Habits & Heatmap** — Toggleable habit trackers with a GitHub-style history heatmap and smart daily resets.
- ⏱️ **Pomodoro Focus Timer** — Focus/short-break/long-break modes linked to tasks, tracked for analytics.
- 🌙 **Digital Sanctuary** — Ambient soundscapes for deep work sessions.
- 📊 **Analytics Dashboard** — Quadrant distribution, habit history, streaks, and completion rates.
- 🎨 **XP-Gated Theme Selector** — Unlock new color themes as you level up.
- 🔐 **Supabase Cloud Sync & Local Fallback** — Real-time Postgres data persistence and auth via Supabase, with an Express (`server.js` + `db.json`) fallback for local/offline use.
- 📱 **PWA-Ready** — Installable, offline-capable via service worker (`sw.js`).

---

## 🛠️ Tech Stack

| Technology              | Usage                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| **React 19 & Vite 6**   | Modern frontend framework & ultra-fast build engine               |
| **Tailwind CSS v4**     | Utility-first styling alongside custom CSS design tokens          |
| **Framer Motion**       | UI animations and transitions                                     |
| **Google Gemini 2.5**   | Cloud AI Copilot engine for natural-language task actions         |
| **Supabase JS**         | User authentication & Postgres state synchronization              |
| **Express & Node.js**   | Local server fallback with JSON database (`server.js`, `db.json`) |
| **React Native / Expo** | Mobile app (`MicroMindMobile/`)                                   |
| **Manifest V3**         | Chrome/Edge browser extension (`MicroMindExtension/`)             |

---

## 📁 Project Structure

```
micromind-2/
├── index.html               # App entry point HTML
├── vite.config.js           # Vite configuration
├── ai-worker.js             # Web Worker for off-thread local AI classification
├── sw.js                    # Service worker (PWA offline support)
├── server.js                # Optional Express fallback server + JSON "db"
├── .env.example              # Environment variable template
├── public/                  # Static assets & PWA manifest
├── src/                     # Main React web application
│   ├── App.jsx               # Root component & bento-grid layout
│   ├── store.jsx             # State context, reducers & Supabase data sync
│   ├── supabase.js           # Supabase client setup
│   ├── index.css             # Design tokens & glassmorphism theme styles
│   ├── hooks/                # Custom React hooks (useToast)
│   ├── utils/                # AI services, sound engine, voice briefing, themes, helpers
│   └── components/           # UI components (AiCopilot, AiDailyBriefing, BrainDump,
│                              # EisenhowerMatrix, DigitalSanctuary, FocusLeague,
│                              # HabitTracker, PomodoroTimer, AnalyticsDashboard, etc.)
├── MicroMindMobile/          # React Native (Expo) mobile client
└── MicroMindExtension/       # Chrome/Edge Manifest V3 browser extension
```

---

## 🚀 Getting Started (Web App)

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)

### 2. Installation & Setup

```bash
git clone https://github.com/am7330226-ctrl/micromind.git
cd micromind

npm install

cp .env.example .env
```

Set your Supabase credentials in `.env` (optional — defaults to built-in fallbacks). The Gemini API key is optional too — you can instead paste it in-app under Settings, where it's stored in `localStorage`:

```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 3. Running Locally

**Development Server (Frontend only):**

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

**Local Express Server (Optional fallback, serves `dist/` + JSON db):**

```bash
npm run server
```

**Production Build:**

```bash
npm run build
npm run preview
```

---

## 📱 Mobile App (React Native / Expo)

```bash
cd MicroMindMobile
npm install
npm start
```

Then use the Expo CLI to launch on iOS, Android, or web. See [MicroMindMobile](MicroMindMobile) for details.

---

## 🧩 Browser Extension (Chrome / Edge)

1. Navigate to `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `MicroMindExtension/` directory.

See [MicroMindExtension/README.md](MicroMindExtension/README.md) for full usage details.

---

## 📄 License

MIT — free to use, modify, and distribute.
