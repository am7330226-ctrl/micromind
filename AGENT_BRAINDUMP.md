# MicroMind Project Context (Agent Brain Dump)

This file serves as a high-level summary of the `micromind-2` project. **New agents should read this file first** to quickly understand the project structure, tech stack, and state without needing to analyze the entire codebase from scratch.

## 🚀 Project Overview

**Name:** MicroMind — Daily Mental Declutter
**Version:** 2.0.0
**Purpose:** A productivity, focus, and mental decluttering app featuring AI daily briefings, an Eisenhower matrix, task timelines, and digital sanctuary/pomodoro tools.

## 🛠 Tech Stack

- **Web App:** React 19, Vite, Tailwind CSS v4, Framer Motion for animations.
- **Mobile App:** React Native (located in the `MicroMindMobile` directory).
- **Backend:** Express.js (`server.js`) with Supabase (`@supabase/supabase-js`) for database/auth.
- **Code Quality:** ESLint (flat config enabled) + Prettier, enforced via Husky pre-commit hooks (`lint-staged`).

## 📂 Architecture & Directory Structure

- `/src/` - Main React web application.
  - `/src/components/` - UI components (e.g., `AiDailyBriefing`, `DigitalSanctuary`, `EisenhowerMatrix`, `VoiceBriefing`, `TimelineCard`).
  - `/src/store.jsx` - Core React Context state management (using a central reducer pattern).
  - `/src/utils/` - Helpers like `soundEngine.js` for audio playback and `voiceBriefing.js` for Web Speech API integration.
- `/MicroMindMobile/` - The React Native mobile client.
  - Uses its own component structure, integrating mobile-specific APIs (haptics, sound).
- `/server.js` - Express backend entry point.
- `/ai-worker.js` / `/sw.js` - Web workers / Service workers for offline capabilities and background AI tasks.

## 🧠 Key Features & Mechanics

1. **AI Daily Briefing & Voice:** Generates morning focus roadmaps and evening decompression banners. Has Web Speech API integration for audio readouts.
2. **Eisenhower Matrix:** A 2x2 priority matrix with drag-and-drop support for tasks (`Do First`, `Schedule`, `Delegate`, `Don't Do`).
3. **Digital Sanctuary:** Ambient soundscapes and a Pomodoro timer for deep work.
4. **Task Timeline:** Visual representation of today's completed and upcoming tasks.

## 📝 Recent Context & Fixes

- **ESLint Integration:** The project was recently updated to use a modern ESLint flat config (`eslint.config.js`). Overly strict React Hook rules (`react-hooks/purity` and `react-hooks/set-state-in-effect`) were disabled to fit the project's architecture. Unused variables and empty blocks are set to warnings so they don't break the build.
- **Git Hooks:** Husky is active. A pre-commit hook runs `prettier --write` on staged files. Do not commit broken files (like invalid JSON), as the pre-commit hook will crash and block the commit.

## 🤖 Agent Instructions

- When making modifications, ensure you abide by the ESLint rules and maintain the existing `store.jsx` context pattern.
- Always use `npm run build` to verify React web changes.
- The project relies heavily on inline Tailwind classes and CSS variables in standard CSS files.
