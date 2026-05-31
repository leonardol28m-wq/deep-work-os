// ============================================================
// Deep Work OS — IndexedDB Layer (idb wrapper)
// ============================================================

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import type {
  FocusSession, SiteVisit, DailyScore,
  DistractionEvent, Task, Goal
} from '../types';

interface DeepWorkDB extends DBSchema {
  sessions: {
    key: number;
    value: FocusSession;
    indexes: { 'by-start': number; 'by-date': string };
  };
  visits: {
    key: number;
    value: SiteVisit;
    indexes: { 'by-domain': string; 'by-start': number; 'by-productive': number };
  };
  scores: {
    key: string;
    value: DailyScore;
  };
  distractions: {
    key: number;
    value: DistractionEvent;
    indexes: { 'by-date': string; 'by-type': string };
  };
  tasks: {
    key: number;
    value: Task;
    indexes: { 'by-date': string; 'by-priority': string };
  };
  goals: {
    key: number;
    value: Goal;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'DeepWorkOS';
const DB_VERSION = 1;

let _db: IDBPDatabase<DeepWorkDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<DeepWorkDB>> {
  if (_db) return _db;
  _db = await openDB<DeepWorkDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sessions')) {
        const s = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        s.createIndex('by-start', 'startTime');
        s.createIndex('by-date', 'date');
      }
      if (!db.objectStoreNames.contains('visits')) {
        const v = db.createObjectStore('visits', { keyPath: 'id', autoIncrement: true });
        v.createIndex('by-domain', 'domain');
        v.createIndex('by-start', 'startTime');
        v.createIndex('by-productive', 'isProductive');
      }
      if (!db.objectStoreNames.contains('scores')) {
        db.createObjectStore('scores', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('distractions')) {
        const d = db.createObjectStore('distractions', { keyPath: 'id', autoIncrement: true });
        d.createIndex('by-date', 'date');
        d.createIndex('by-type', 'type');
      }
      if (!db.objectStoreNames.contains('tasks')) {
        const t = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        t.createIndex('by-date', 'date');
        t.createIndex('by-priority', 'priority');
      }
      if (!db.objectStoreNames.contains('goals')) {
        const g = db.createObjectStore('goals', { keyPath: 'id', autoIncrement: true });
        g.createIndex('by-date', 'date');
      }
    },
  });
  return _db;
}

// ── Sessions ─────────────────────────────────────────────────

export const SessionsRepo = {
  async create(session: Omit<FocusSession, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('sessions', session as FocusSession);
  },
  async update(session: FocusSession): Promise<void> {
    const db = await getDB();
    await db.put('sessions', session);
  },
  async get(id: number): Promise<FocusSession | undefined> {
    const db = await getDB();
    return db.get('sessions', id);
  },
  async getByDateRange(start: number, end: number): Promise<FocusSession[]> {
    const db = await getDB();
    const tx = db.transaction('sessions', 'readonly');
    return tx.store.index('by-start').getAll(IDBKeyRange.bound(start, end));
  },
  async getTodayStats(date: string): Promise<{ completed: number; totalMinutes: number }> {
    const startOfDay = new Date(date).getTime();
    const endOfDay = startOfDay + 86400000;
    const sessions = await this.getByDateRange(startOfDay, endOfDay);
    const completed = sessions.filter(s => s.completed);
    const totalMinutes = completed.reduce((sum, s) => sum + (s.actualDuration ?? 0), 0);
    return { completed: completed.length, totalMinutes };
  },
};

// ── Visits ───────────────────────────────────────────────────

export const VisitsRepo = {
  async create(visit: Omit<SiteVisit, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('visits', visit as SiteVisit);
  },
  async update(visit: SiteVisit): Promise<void> {
    const db = await getDB();
    await db.put('visits', visit);
  },
  async get(id: number): Promise<SiteVisit | undefined> {
    const db = await getDB();
    return db.get('visits', id);
  },
  async getByDateRange(start: number, end: number): Promise<SiteVisit[]> {
    const db = await getDB();
    const tx = db.transaction('visits', 'readonly');
    return tx.store.index('by-start').getAll(IDBKeyRange.bound(start, end));
  },
  async getDomainStats(start: number, end: number): Promise<{ domain: string; minutes: number; productive: boolean }[]> {
    const visits = await this.getByDateRange(start, end);
    const map = new Map<string, { minutes: number; productive: boolean }>();
    for (const visit of visits) {
      const mins = (visit.duration ?? 0) / 60;
      const existing = map.get(visit.domain);
      if (existing) { existing.minutes += mins; }
      else { map.set(visit.domain, { minutes: mins, productive: visit.isProductive }); }
    }
    return Array.from(map.entries())
      .map(([domain, stats]) => ({ domain, ...stats }))
      .sort((a, b) => b.minutes - a.minutes);
  },
};

// ── Scores ───────────────────────────────────────────────────

export const ScoresRepo = {
  async save(score: DailyScore): Promise<void> {
    const db = await getDB();
    await db.put('scores', score);
  },
  async get(date: string): Promise<DailyScore | undefined> {
    const db = await getDB();
    return db.get('scores', date);
  },
  async getRange(days: number): Promise<DailyScore[]> {
    const db = await getDB();
    const all = await db.getAll('scores');
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return all.filter(s => new Date(s.date) >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
  },
  async getLast7Days(): Promise<DailyScore[]> { return this.getRange(7); },
  async getLast30Days(): Promise<DailyScore[]> { return this.getRange(30); },
};

// ── Tasks ────────────────────────────────────────────────────

export const TasksRepo = {
  async create(task: Omit<Task, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('tasks', task as Task);
  },
  async update(task: Partial<Task> & { id: number }): Promise<void> {
    const db = await getDB();
    const existing = await db.get('tasks', task.id);
    if (existing) await db.put('tasks', { ...existing, ...task });
  },
  async delete(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('tasks', id);
  },
  async getByDate(date: string): Promise<Task[]> {
    const db = await getDB();
    const tx = db.transaction('tasks', 'readonly');
    const tasks = await tx.store.index('by-date').getAll(date);
    return tasks.sort((a, b) => a.order - b.order);
  },
};

// ── Goals ────────────────────────────────────────────────────

export const GoalsRepo = {
  async create(goal: Omit<Goal, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('goals', goal as Goal);
  },
  async update(goal: Partial<Goal> & { id: number }): Promise<void> {
    const db = await getDB();
    const existing = await db.get('goals', goal.id);
    if (existing) await db.put('goals', { ...existing, ...goal });
  },
  async delete(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('goals', id);
  },
  async getByDate(date: string): Promise<Goal[]> {
    const db = await getDB();
    const tx = db.transaction('goals', 'readonly');
    return tx.store.index('by-date').getAll(date);
  },
};

// ── Distractions ─────────────────────────────────────────────

export const DistractionsRepo = {
  async create(event: Omit<DistractionEvent, 'id'>): Promise<number> {
    const db = await getDB();
    return db.add('distractions', event as DistractionEvent);
  },
  async getByDate(date: string): Promise<DistractionEvent[]> {
    const db = await getDB();
    const tx = db.transaction('distractions', 'readonly');
    return tx.store.index('by-date').getAll(date);
  },
  async getCountByDate(date: string): Promise<number> {
    return (await this.getByDate(date)).length;
  },
};
