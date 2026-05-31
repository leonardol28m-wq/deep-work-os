# Deep Work OS 🎯

> **Transform Chrome into a high-performance work environment.** Block distractions, track deep work sessions, and measure real productivity.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-79%20passing-10B981)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

### 🔒 Focus Lock

| Mode | Sites Blocked |
|------|---------------|
| **Normal** | YouTube, Instagram, Facebook, TikTok, Twitch, Reddit, X/Twitter |
| **Extreme** | All Normal + Netflix, Discord, WhatsApp, Telegram, LinkedIn... |

### ⏱ Deep Work Sessions
- **25 min** — Pomodoro Technique
- **50 min** — Extended Flow State  
- **90 min** — Ultradian Rhythm Cycle
- **Custom** — Your optimal duration

### 📊 Productivity Tracker
- Focus time vs distraction time (real-time)
- Sites visited with productivity classification
- Deep work hours accumulated per day
- Tab switch rate monitoring

### 🏠 New Tab Dashboard
- Live clock with focus mode indicator
- Session timer with circular progress
- Daily goals + task list
- Stats: focus time, sessions, deep hours
- Weekly 7-day score chart

### 🧠 Distraction Detection
- Tab-switch burst detection (>6/min)
- Excessive multitasking detection (>5 tabs)
- In-session interruption counting
- Push notification alerts

### 🏆 Daily Score
```
Total = Focus(40%) + Consistency(30%) + Productivity(30%)
```
| Score | Label |
|-------|-------|
| 90+ | 🟣 Elite |
| 75-89 | 📜 Deep Work |
| 60-74 | 🔵 Focused |
| 40-59 | 🟡 Distracted |
| 20-39 | 🔴 Scattered |
| 0-19 | ⚫ Lost |

---

## 🚀 Installation

```bash
# 1. Clone
git clone https://github.com/leonardol28m-wq/deep-work-os.git
cd deep-work-os

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Load in Chrome
# → chrome://extensions/
# → Enable Developer mode
# → Load unpacked → select dist/
```

### Development
```bash
npm run dev   # Watch mode
npm test      # Run 79 tests
```

---

## 🏗 Architecture

```
Background Service Worker
  ├── blocker.ts          declarativeNetRequest rules
  ├── tracker             tabs.onActivated / onUpdated
  ├── session manager     chrome.alarms + storage
  └── score calculator    daily midnight cron

UI (React 18)
  ├── newtab/App.tsx      Full dashboard
  ├── popup/Popup.tsx     Quick controls
  └── blocked/BlockedPage Motivational gate

Data Layer
  ├── IndexedDB (idb)     sessions, visits, scores, tasks, goals
  ├── storage.local       live AppState
  └── storage.sync        settings
```

---

## 🧪 Tests

```bash
npm test
# 79 tests: scoring (30) + time utils (33) + blocker (16)
```

---

## 🧠 Neuroscience Foundation

- **Deep Work** (Cal Newport) — Distraction-free focus produces rare, valuable results
- **Ultradian Rhythms** (Kleitman) — 90-min cognitive cycles for optimal work
- **Attention Residue** (Sophie Leroy) — Tab switching leaves cognitive residue
- **Implementation Intentions** (Gollwitzer) — Goals increase completion 2-3x

---

## 📄 License

MIT — Built for makers who take their focus seriously.
