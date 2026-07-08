# 🧠 MicroMind — Daily Mental Declutter

A **premium, dark-themed productivity dashboard** that solves daily mental overload by giving you a beautiful place to capture, sort, and act on tasks and micro-habits — every single day.

🌐 **Live Demo**: [View on GitHub Pages](#) *(update with your link after deploy)*

---

## ✨ Features

- ⚡ **Brain Dump Inbox** — Instantly capture any task, thought, or distraction with zero friction
- 🗂️ **Eisenhower Priority Matrix** — Drag tasks into *Do First / Schedule / Delegate / Eliminate* quadrants
- 🎯 **Today's Focus Three** — Commit to just 3 high-impact priorities for the day
- ✅ **Particle Burst Animations** — Satisfying canvas confetti explosion on task completion
- 🌿 **Daily Micro-Habits** — 6 toggleable habit trackers that reset daily
- 📈 **Progress Ring + Streak Counter** — Visual momentum tracking in the header
- 💾 **LocalStorage Persistence** — All data survives page reloads, zero setup needed
- 🌙 **Daily Reset** — Archives completed tasks, rolls over incomplete ones, increments your streak

---

## 🚀 Getting Started

### Option 1: Open directly (no install)
Just open `index.html` in any modern browser. No build tools, no npm install.

### Option 2: Local server
```bash
npx serve .
```
Then visit `http://localhost:3000`

---

## 📁 Project Structure

```
micromind/
├── index.html    # App structure & semantic HTML
├── styles.css    # Dark glassmorphism theme (~650 lines)
└── app.js        # All logic: tasks, drag & drop, habits, animations (~380 lines)
```

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Semantic page structure |
| Vanilla CSS | Glassmorphism dark theme, CSS variables, animations |
| Vanilla JavaScript | State management, drag & drop, Canvas API |
| Google Fonts | Inter + Outfit typefaces |
| Lucide Icons | Consistent icon library |
| localStorage | Client-side data persistence |

---

## 🎨 Design Highlights

- **Dark glassmorphism** with radial gradient nebula backgrounds
- **CSS Custom Properties** token system for full design consistency
- **Micro-animations** everywhere: task slide-in, checkbox pop, shine effect, button hover
- **Fully responsive** — adapts from 2-column desktop to single-column mobile

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Built with ❤️ as a modern solution to daily mental overload.*
