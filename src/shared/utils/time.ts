// ============================================================
// Deep Work OS — Utility Functions
// ============================================================

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(1) + 'h';
}

export function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function getRemainingSeconds(endsAt: number, pausedDuration = 0): number {
  const remaining = Math.max(0, endsAt - Date.now() + pausedDuration);
  return Math.floor(remaining / 1000);
}

export function getStartOfDay(date?: string): number {
  const d = date ? new Date(date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getWeekDates(): string[] {
  const dates: string[] = [];
  const t = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(t);
    d.setDate(t.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function getDayName(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
}

export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function isBlockedDomain(url: string, blockedDomains: string[]): boolean {
  try {
    const domain = extractDomain(url);
    return blockedDomains.some(
      blocked => domain === blocked || domain.endsWith('.' + blocked)
    );
  } catch {
    return false;
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Late night grind';
}

export function msToMinutes(ms: number): number {
  return ms / 60000;
}

export function minutesToMs(min: number): number {
  return min * 60000;
}
