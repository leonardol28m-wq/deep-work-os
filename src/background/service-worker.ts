// ============================================================
// Deep Work OS — Background Service Worker (MV3)
// ============================================================

import type { AppState, Message, MessageResponse, BlockerMode, SessionType } from '../types';
import { DEFAULT_APP_STATE } from '../types';
import { today, extractDomain, isBlockedDomain, msToMinutes, getRemainingSeconds } from '../shared/utils/time';
import { buildDailyScore } from '../shared/utils/scoring';
import { updateBlockingRules, clearBlockingRules } from './blocker';
import {
  SessionsRepo, VisitsRepo, ScoresRepo,
  DistractionsRepo, TasksRepo, GoalsRepo
} from '../db';

// ── Constants ────────────────────────────────────────────────
const ALARM_DAILY_RESET = 'daily-reset';
const ALARM_SESSION_TICK = 'session-tick';
const ALARM_WEEKLY_REPORT = 'weekly-report';

let tabSwitchTimestamps: number[] = [];
let currentVisitId: number | null = null;

// ── State ────────────────────────────────────────────────────

async function getState(): Promise<AppState> {
  const stored = await chrome.storage.local.get('appState');
  return stored.appState ?? DEFAULT_APP_STATE;
}

async function setState(updater: (state: AppState) => AppState): Promise<AppState> {
  const state = await getState();
  const newState = updater(state);
  newState.lastUpdated = Date.now();
  await chrome.storage.local.set({ appState: newState });
  return newState;
}

// ── Initialization ────────────────────────────────────────────

async function initialize(): Promise<void> {
  const stored = await chrome.storage.local.get('appState');
  if (!stored.appState) {
    await chrome.storage.local.set({ appState: DEFAULT_APP_STATE });
  }
  await checkDayReset();
  await chrome.alarms.create(ALARM_DAILY_RESET, { when: getNextMidnight(), periodInMinutes: 24 * 60 });
  await chrome.alarms.create(ALARM_WEEKLY_REPORT, { when: getNextSunday(), periodInMinutes: 7 * 24 * 60 });
  
  const state = await getState();
  if (state.activeSession && !state.activeSession.isPaused) {
    const remaining = getRemainingSeconds(state.activeSession.endsAt, state.activeSession.pausedDuration);
    if (remaining > 0) {
      await chrome.alarms.create(ALARM_SESSION_TICK, { periodInMinutes: 1 / 60 });
    } else {
      await completeSession(state);
    }
  }
  if (state.blockerMode !== 'off') {
    await updateBlockingRules(state.blockerMode, state.settings.blockedDomains, state.settings.extremeModeExtra);
  }
}

// ── Day Reset ────────────────────────────────────────────────

async function checkDayReset(): Promise<void> {
  const state = await getState();
  const currentDate = today();
  if (state.lastDate !== currentDate) {
    if (state.lastDate) {
      const score = buildDailyScore(state, state.lastDate);
      await ScoresRepo.save(score);
    }
    await setState(s => ({
      ...s,
      todayFocusMinutes: 0, todayDistractionMinutes: 0,
      todayTabSwitches: 0, todaySessionsCompleted: 0,
      todayDistractionEvents: 0, lastDate: currentDate,
    }));
  }
}

// ── Sessions ─────────────────────────────────────────────────

async function startSession(duration: number, type: SessionType): Promise<{ success: boolean; error?: string }> {
  const state = await getState();
  if (state.activeSession) return { success: false, error: 'Session already active' };
  const now = Date.now();
  const sessionId = await SessionsRepo.create({ startTime: now, plannedDuration: duration, type, completed: false, interruptions: 0 });
  const endsAt = now + duration * 60 * 1000;
  await setState(s => ({
    ...s,
    activeSession: { id: sessionId, startTime: now, plannedDuration: duration, type, isPaused: false, pausedDuration: 0, interruptions: 0, endsAt },
  }));
  await chrome.alarms.create(ALARM_SESSION_TICK, { periodInMinutes: 1 / 60 });
  await showNotification('🎯 Deep Work Session Started', `${duration}min focus session. Lock in.`);
  await updateBadge(duration * 60);
  return { success: true };
}

async function pauseSession(): Promise<void> {
  const state = await getState();
  if (!state.activeSession || state.activeSession.isPaused) return;
  await setState(s => ({ ...s, activeSession: s.activeSession ? { ...s.activeSession, isPaused: true, pausedAt: Date.now() } : null }));
  await chrome.alarms.clear(ALARM_SESSION_TICK);
  chrome.action.setBadgeText({ text: '⏸' });
}

async function resumeSession(): Promise<void> {
  const state = await getState();
  if (!state.activeSession || !state.activeSession.isPaused) return;
  const pauseDuration = state.activeSession.pausedAt ? Date.now() - state.activeSession.pausedAt : 0;
  await setState(s => ({ ...s, activeSession: s.activeSession ? { ...s.activeSession, isPaused: false, pausedAt: undefined, pausedDuration: (s.activeSession?.pausedDuration ?? 0) + pauseDuration } : null }));
  await chrome.alarms.create(ALARM_SESSION_TICK, { periodInMinutes: 1 / 60 });
}

async function stopSession(): Promise<void> {
  const state = await getState();
  if (!state.activeSession) return;
  const now = Date.now();
  const actual = msToMinutes(now - state.activeSession.startTime - state.activeSession.pausedDuration);
  await SessionsRepo.update({ id: state.activeSession.id, startTime: state.activeSession.startTime, endTime: now, plannedDuration: state.activeSession.plannedDuration, actualDuration: Math.round(actual), type: state.activeSession.type, completed: false, interruptions: state.activeSession.interruptions });
  await setState(s => ({ ...s, activeSession: null, todayFocusMinutes: s.todayFocusMinutes + Math.round(actual) }));
  await chrome.alarms.clear(ALARM_SESSION_TICK);
  chrome.action.setBadgeText({ text: '' });
}

async function completeSession(state?: AppState): Promise<void> {
  const s = state ?? await getState();
  if (!s.activeSession) return;
  const now = Date.now();
  const actual = s.activeSession.plannedDuration;
  await SessionsRepo.update({ id: s.activeSession.id, startTime: s.activeSession.startTime, endTime: now, plannedDuration: s.activeSession.plannedDuration, actualDuration: actual, type: s.activeSession.type, completed: true, interruptions: s.activeSession.interruptions });
  await setState(cur => ({ ...cur, activeSession: null, todayFocusMinutes: cur.todayFocusMinutes + actual, todaySessionsCompleted: cur.todaySessionsCompleted + 1 }));
  await chrome.alarms.clear(ALARM_SESSION_TICK);
  chrome.action.setBadgeText({ text: '' });
  await showNotification('✅ Session Complete!', `${actual}min deep focus done. Take a short break.`);
}

// ── Session Tick ─────────────────────────────────────────────

async function handleSessionTick(): Promise<void> {
  const state = await getState();
  if (!state.activeSession || state.activeSession.isPaused) return;
  const remaining = getRemainingSeconds(state.activeSession.endsAt, state.activeSession.pausedDuration);
  if (remaining <= 0) { await completeSession(state); return; }
  const mins = Math.ceil(remaining / 60);
  chrome.action.setBadgeText({ text: `${mins}m` });
  chrome.action.setBadgeBackgroundColor({ color: '#7C3AED' });
}

// ── Blocker ──────────────────────────────────────────────────

async function setBlockerMode(mode: BlockerMode): Promise<void> {
  const state = await getState();
  if (mode === 'off') { await clearBlockingRules(); }
  else { await updateBlockingRules(mode, state.settings.blockedDomains, state.settings.extremeModeExtra); }
  await setState(s => ({ ...s, blockerMode: mode }));
  const msgs: Record<BlockerMode, string> = {
    off: 'Focus Lock disabled', normal: 'Normal Mode — social media blocked', extreme: 'Extreme Mode — maximum blocking',
  };
  await showNotification('Deep Work OS', msgs[mode]);
}

// ── Tab Tracking ─────────────────────────────────────────────

async function handleTabActivated(tabId: number): Promise<void> {
  await checkDayReset();
  const state = await getState();
  const now = Date.now();
  tabSwitchTimestamps = tabSwitchTimestamps.filter(t => now - t < 60000);
  tabSwitchTimestamps.push(now);
  const switchRate = tabSwitchTimestamps.length;
  if (switchRate >= (state.settings.distractionThreshold ?? 6)) {
    await handleDistractionDetected('tab-switch', switchRate);
  }
  await setState(s => ({ ...s, currentTabId: tabId, todayTabSwitches: s.todayTabSwitches + 1 }));
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url) await handleUrlChange(tab.url, tab.title ?? '');
  } catch {}
}

async function handleTabUpdated(tabId: number, url: string, title: string): Promise<void> {
  const state = await getState();
  if (state.currentTabId !== tabId) return;
  if (state.blockerMode !== 'off') {
    const domains = state.blockerMode === 'extreme'
      ? [...state.settings.blockedDomains, ...state.settings.extremeModeExtra]
      : state.settings.blockedDomains;
    if (isBlockedDomain(url, domains)) {
      await DistractionsRepo.create({ timestamp: Date.now(), type: 'blocked-attempt', url, date: today() });
      const blockedUrl = chrome.runtime.getURL('blocked/index.html') + '?domain=' + encodeURIComponent(extractDomain(url));
      await chrome.tabs.update(tabId, { url: blockedUrl });
      return;
    }
  }
  await handleUrlChange(url, title);
}

async function handleUrlChange(url: string, title: string): Promise<void> {
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;
  const state = await getState();
  const now = Date.now();
  const domain = extractDomain(url);
  if (currentVisitId && state.currentVisitStart) {
    const duration = Math.round((now - state.currentVisitStart) / 1000);
    const visit = await VisitsRepo.get(currentVisitId);
    if (visit) await VisitsRepo.update({ ...visit, endTime: now, duration });
    if (visit?.isDistraction) {
      const mins = msToMinutes(now - state.currentVisitStart);
      await setState(s => ({ ...s, todayDistractionMinutes: s.todayDistractionMinutes + mins }));
    }
    currentVisitId = null;
  }
  const { isProductive, isDistraction, category } = classifySite(domain);
  const visitId = await VisitsRepo.create({ url, domain, title, startTime: now, isProductive, isDistraction, category });
  currentVisitId = visitId;
  await setState(s => ({ ...s, currentUrl: url, currentDomain: domain, currentVisitStart: now }));
  if (isDistraction && state.activeSession) {
    await setState(s => ({ ...s, activeSession: s.activeSession ? { ...s.activeSession, interruptions: s.activeSession.interruptions + 1 } : null }));
  }
}

async function handleDistractionDetected(type: 'tab-switch' | 'multitask', count?: number): Promise<void> {
  const state = await getState();
  await DistractionsRepo.create({ timestamp: Date.now(), type, tabSwitchCount: count, sessionId: state.activeSession?.id, date: today() });
  await setState(s => ({ ...s, todayDistractionEvents: s.todayDistractionEvents + 1 }));
  if (state.activeSession && !state.activeSession.isPaused) {
    await showNotification('⚠️ Distraction Detected',
      type === 'tab-switch'
        ? `${count} tab switches/min detected. Stay focused!`
        : 'Excessive multitasking detected. Close unnecessary tabs.',
      'distraction');
  }
}

function classifySite(domain: string) {
  const PRODUCTIVE = ['github.com','gitlab.com','stackoverflow.com','developer.mozilla.org','docs.google.com','notion.so','figma.com','linear.app','vercel.com','localhost'];
  const DISTRACTION = ['youtube.com','instagram.com','facebook.com','tiktok.com','twitch.tv','reddit.com','twitter.com','x.com','netflix.com'];
  const SOCIAL = ['linkedin.com','discord.com','slack.com','whatsapp.com','telegram.org'];
  const NEWS = ['cnn.com','bbc.com','nytimes.com','medium.com'];
  const SHOPPING = ['amazon.com','mercadolibre.com','ebay.com'];
  if (PRODUCTIVE.some(p => domain.includes(p))) return { isProductive: true, isDistraction: false, category: 'productive' as const };
  if (DISTRACTION.some(d => domain.includes(d))) return { isProductive: false, isDistraction: true, category: 'entertainment' as const };
  if (SOCIAL.some(s => domain.includes(s))) return { isProductive: false, isDistraction: false, category: 'social' as const };
  if (NEWS.some(n => domain.includes(n))) return { isProductive: false, isDistraction: false, category: 'news' as const };
  if (SHOPPING.some(s => domain.includes(s))) return { isProductive: false, isDistraction: false, category: 'shopping' as const };
  return { isProductive: false, isDistraction: false, category: 'other' as const };
}

async function showNotification(title: string, message: string, id = 'general'): Promise<void> {
  const state = await getState();
  if (!state.settings.notificationsEnabled) return;
  chrome.notifications.create(id, { type: 'basic', iconUrl: '/icons/icon128.png', title, message, priority: 2 });
}

function getNextMidnight(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getNextSunday(): number {
  const d = new Date();
  const days = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

async function updateBadge(seconds: number): Promise<void> {
  await chrome.action.setBadgeText({ text: `${Math.ceil(seconds / 60)}m` });
  await chrome.action.setBadgeBackgroundColor({ color: '#7C3AED' });
}

// ── Message Handler ──────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch(err => sendResponse({ success: false, error: err.message }));
  return true;
});

async function handleMessage(msg: Message): Promise<MessageResponse> {
  switch (msg.type) {
    case 'GET_STATE': return { success: true, data: await getState() };
    case 'START_SESSION': return startSession(msg.payload.duration, msg.payload.type);
    case 'PAUSE_SESSION': await pauseSession(); return { success: true };
    case 'RESUME_SESSION': await resumeSession(); return { success: true };
    case 'STOP_SESSION': await stopSession(); return { success: true };
    case 'SET_BLOCKER_MODE': await setBlockerMode(msg.payload.mode); return { success: true };
    case 'GET_TODAY_STATS': {
      const state = await getState();
      const startOfDay = new Date(today()).getTime();
      const domainStats = await VisitsRepo.getDomainStats(startOfDay, startOfDay + 86400000);
      return { success: true, data: { focusMinutes: state.todayFocusMinutes, distractionMinutes: state.todayDistractionMinutes, tabSwitches: state.todayTabSwitches, sessionsCompleted: state.todaySessionsCompleted, distractionEvents: state.todayDistractionEvents, domainStats } };
    }
    case 'GET_SCORES': return { success: true, data: await ScoresRepo.getRange(msg.payload.days) };
    case 'GET_TASKS': return { success: true, data: await TasksRepo.getByDate(msg.payload.date) };
    case 'ADD_TASK': { const id = await TasksRepo.create(msg.payload); return { success: true, data: { id } }; }
    case 'UPDATE_TASK': await TasksRepo.update(msg.payload); return { success: true };
    case 'DELETE_TASK': await TasksRepo.delete(msg.payload.id); return { success: true };
    case 'GET_GOALS': return { success: true, data: await GoalsRepo.getByDate(msg.payload.date) };
    case 'ADD_GOAL': { const id = await GoalsRepo.create(msg.payload); return { success: true, data: { id } }; }
    case 'UPDATE_GOAL': await GoalsRepo.update(msg.payload); return { success: true };
    case 'DELETE_GOAL': await GoalsRepo.delete(msg.payload.id); return { success: true };
    case 'GET_WEEKLY_REPORT': return { success: true, data: await ScoresRepo.getLast7Days() };
    default: return { success: false, error: 'Unknown message' };
  }
}

// ── Event Listeners ──────────────────────────────────────────

chrome.tabs.onActivated.addListener(async ({ tabId }) => { await handleTabActivated(tabId); });
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) await handleTabUpdated(tabId, changeInfo.url, tab.title ?? '');
});
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const state = await getState();
  if (state.currentTabId === tabId && currentVisitId && state.currentVisitStart) {
    const now = Date.now();
    const visit = await VisitsRepo.get(currentVisitId);
    if (visit) await VisitsRepo.update({ ...visit, endTime: now, duration: Math.round((now - state.currentVisitStart) / 1000) });
    currentVisitId = null;
  }
});
chrome.tabs.onCreated.addListener(async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const state = await getState();
  if (tabs.length >= (state.settings.multitaskThreshold ?? 5)) await handleDistractionDetected('multitask', tabs.length);
});
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_DAILY_RESET) await checkDayReset();
  else if (alarm.name === ALARM_SESSION_TICK) await handleSessionTick();
  else if (alarm.name === ALARM_WEEKLY_REPORT) {
    const scores = await ScoresRepo.getLast7Days();
    if (scores.length > 0) {
      const avg = Math.round(scores.reduce((s, d) => s + d.totalScore, 0) / scores.length);
      const hours = (scores.reduce((s, d) => s + d.focusMinutes, 0) / 60).toFixed(1);
      await showNotification('📊 Weekly Report', `This week: ${hours}h focused, avg score ${avg}/100.`, 'weekly');
    }
  }
});
chrome.runtime.onInstalled.addListener(async (details) => {
  await initialize();
  if (details.reason === 'install') {
    await chrome.tabs.create({ url: chrome.runtime.getURL('newtab/index.html') });
    await showNotification('🚀 Deep Work OS Installed!', 'Your productivity command center is ready.');
  }
});
chrome.runtime.onStartup.addListener(() => { initialize().catch(console.error); });

initialize().catch(console.error);
