# Changelog

All notable changes documented here.

## [1.0.0] — 2025-06-01

### Added

**Focus Lock**
- Normal Mode: blocks YouTube, Instagram, Facebook, TikTok, Twitch, Reddit, X/Twitter
- Extreme Mode: 16+ sites blocked including Netflix, Discord, WhatsApp
- Instant blocking via `declarativeNetRequest` + `tabs.onUpdated` fallback
- Motivational blocked page with session timer + inspirational quotes

**Deep Work Sessions**
- 25/50/90min + custom duration sessions
- Circular animated progress timer
- Pause / Resume / Stop controls
- Interruption counter
- Desktop notification on completion

**Productivity Tracker**
- Real-time site visit tracking with domain classification
- Focus vs distraction time measurement
- Tab switch rate monitoring per minute
- Daily aggregated statistics in IndexedDB

**New Tab Dashboard**
- Dark premium full-screen dashboard (Inter font, custom color system)
- Live clock (hours, minutes, seconds)
- 3-tab navigation: Focus / Tasks / Stats
- Session timer with circular SVG progress
- Focus Lock control panel (OFF / Normal / Extreme)
- Daily Goals (add, complete, delete)
- Task List (add, complete, delete, Enter key support)
- Stats: Focus Time, Sessions, Deep Hours, Tab Switches
- Weekly 7-day bar chart
- Daily Score breakdown with sub-scores

**Distraction Detection**
- Tab-switch burst detection (default: 6/min threshold)
- Multitasking detection (default: 5 tabs threshold)
- Blocked site attempt tracking
- Push notification alerts during sessions

**Daily Score**
- Focus Score (40%): focus ratio + hours bonus
- Consistency Score (30%): completion rate - distractions + streak
- Productivity Score (30%): sessions + deep hours - tab switches
- Auto-save at midnight via Chrome Alarms
- Labels: Elite / Deep Work / Focused / Distracted / Scattered / Lost

**Weekly Reports**
- 7-day score history
- Sunday midnight auto-generation with notification

**Technical**
- Chrome Manifest V3 + Service Worker (module type)
- TypeScript strict throughout
- React 18 + Tailwind CSS 3
- IndexedDB via `idb` (sessions, visits, scores, tasks, goals, distractions)
- Vite 5 multi-entry build
- Vitest test suite: 79 tests passing

### Roadmap
- [ ] Custom blocked sites UI
- [ ] Pomodoro auto-break timer
- [ ] Data export CSV/JSON
- [ ] Chrome Web Store publication
