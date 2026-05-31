// ============================================================
// Deep Work OS — Type System
// ============================================================

export type SessionType = 25 | 50 | 90 | 'custom';
export type BlockerMode = 'off' | 'normal' | 'extreme';
export type Priority = 'low' | 'medium' | 'high';
export type DistractionType = 'tab-switch' | 'multitask' | 'blocked-attempt';

// ── Session ─────────────────────────────────────────────────
export interface FocusSession {
  id?: number;
  startTime: number;
  endTime?: number;
  plannedDuration: number; // minutes
  actualDuration?: number; // minutes
  type: SessionType;
  completed: boolean;
  interruptions: number;
  notes?: string;
}

// ── Site Visit ──────────────────────────────────────────────
export interface SiteVisit {
  id?: number;
  url: string;
  domain: string;
  title: string;
  startTime: number;
  endTime?: number;
  duration?: number; // seconds
  isProductive: boolean;
  isDistraction: boolean;
  category: SiteCategory;
}

export type SiteCategory =
  | 'productive'
  | 'social'
  | 'entertainment'
  | 'news'
  | 'shopping'
  | 'communication'
  | 'development'
  | 'other';

// ── Task & Goal ─────────────────────────────────────────────
export interface Task {
  id?: number;
  text: string;
  completed: boolean;
  priority: Priority;
  date: string; // YYYY-MM-DD
  completedAt?: number;
  order: number;
}

export interface Goal {
  id?: number;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  completedAt?: number;
}

// ── Scores ──────────────────────────────────────────────────
export interface DailyScore {
  date: string; // YYYY-MM-DD
  focusScore: number;        // 0-100
  consistencyScore: number;  // 0-100
  productivityScore: number; // 0-100
  totalScore: number;        // 0-100
  focusMinutes: number;
  distractionMinutes: number;
  sessionsCompleted: number;
  sessionsStarted: number;
  tabSwitches: number;
  distractionEvents: number;
  deepWorkHours: number;
  longestStreak: number; // minutes
}

// ── Distraction Event ────────────────────────────────────────
export interface DistractionEvent {
  id?: number;
  timestamp: number;
  type: DistractionType;
  url?: string;
  tabSwitchCount?: number;
  sessionId?: number;
  date: string;
}

// ── App State (chrome.storage) ───────────────────────────────
export interface AppState {
  activeSession: ActiveSession | null;
  blockerMode: BlockerMode;
  todayFocusMinutes: number;
  todayDistractionMinutes: number;
  todayTabSwitches: number;
  todaySessionsCompleted: number;
  todayDistractionEvents: number;
  currentTabId?: number;
  currentUrl?: string;
  currentDomain?: string;
  currentVisitStart?: number;
  settings: Settings;
  lastUpdated: number;
  lastDate: string;
}

export interface ActiveSession {
  id: number;
  startTime: number;
  plannedDuration: number;
  type: SessionType;
  isPaused: boolean;
  pausedAt?: number;
  pausedDuration: number;
  interruptions: number;
  endsAt: number;
}

// ── Settings ────────────────────────────────────────────────
export interface Settings {
  blockedDomains: string[];
  extremeModeExtra: string[];
  allowedDuringSession: string[];
  defaultSessionType: SessionType;
  autoStartBreak: boolean;
  breakDuration: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  distractionThreshold: number;
  multitaskThreshold: number;
  theme: 'dark';
  showProductiveTime: boolean;
  dataRetentionDays: number;
}

export const DEFAULT_SETTINGS: Settings = {
  blockedDomains: [
    'youtube.com', 'instagram.com', 'facebook.com', 'tiktok.com',
    'twitch.tv', 'reddit.com', 'twitter.com', 'x.com',
  ],
  extremeModeExtra: [
    'netflix.com', 'twitch.tv', 'discord.com', 'whatsapp.com',
    'telegram.org', 'linkedin.com', 'pinterest.com', 'tumblr.com',
  ],
  allowedDuringSession: [],
  defaultSessionType: 25,
  autoStartBreak: false,
  breakDuration: 5,
  notificationsEnabled: true,
  soundEnabled: true,
  distractionThreshold: 6,
  multitaskThreshold: 5,
  theme: 'dark',
  showProductiveTime: true,
  dataRetentionDays: 90,
};

export const DEFAULT_APP_STATE: AppState = {
  activeSession: null,
  blockerMode: 'off',
  todayFocusMinutes: 0,
  todayDistractionMinutes: 0,
  todayTabSwitches: 0,
  todaySessionsCompleted: 0,
  todayDistractionEvents: 0,
  settings: DEFAULT_SETTINGS,
  lastUpdated: Date.now(),
  lastDate: new Date().toISOString().split('T')[0],
};

// ── Messages (Background <=> UI) ─────────────────────────────
export type Message =
  | { type: 'GET_STATE' }
  | { type: 'START_SESSION'; payload: { duration: number; type: SessionType } }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'STOP_SESSION' }
  | { type: 'SET_BLOCKER_MODE'; payload: { mode: BlockerMode } }
  | { type: 'GET_TODAY_STATS' }
  | { type: 'GET_WEEKLY_REPORT' }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id'> }
  | { type: 'UPDATE_TASK'; payload: Partial<Task> & { id: number } }
  | { type: 'DELETE_TASK'; payload: { id: number } }
  | { type: 'ADD_GOAL'; payload: Omit<Goal, 'id'> }
  | { type: 'UPDATE_GOAL'; payload: Partial<Goal> & { id: number } }
  | { type: 'DELETE_GOAL'; payload: { id: number } }
  | { type: 'GET_TASKS'; payload: { date: string } }
  | { type: 'GET_GOALS'; payload: { date: string } }
  | { type: 'GET_SCORES'; payload: { days: number } }
  | { type: 'RESET_TODAY' };

export type MessageResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  days: DailyScore[];
  totalFocusHours: number;
  totalSessions: number;
  avgDailyScore: number;
  bestDay: string;
  worstDay: string;
  topProductiveSites: { domain: string; minutes: number }[];
  topDistractionSites: { domain: string; minutes: number }[];
  trend: 'improving' | 'declining' | 'stable';
}

export const PRODUCTIVE_DOMAINS = new Set([
  'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
  'developer.mozilla.org', 'docs.google.com', 'notion.so', 'figma.com',
  'linear.app', 'jira.atlassian.com', 'trello.com', 'vercel.com',
  'netlify.com', 'aws.amazon.com', 'localhost', '127.0.0.1',
]);

export const DISTRACTION_DOMAINS = new Set([
  'youtube.com', 'instagram.com', 'facebook.com', 'tiktok.com',
  'twitch.tv', 'reddit.com', 'twitter.com', 'x.com', 'netflix.com',
  'pinterest.com', 'tumblr.com', 'buzzfeed.com',
]);
