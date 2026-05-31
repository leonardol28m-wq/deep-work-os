import { describe, it, expect, vi } from 'vitest';
import { today, formatTime, formatMinutes, formatHours, pad, extractDomain, isBlockedDomain, getGreeting, msToMinutes, minutesToMs, getWeekDates } from '../src/shared/utils/time';

describe('formatTime', () => {
  it('formats under 1 minute', () => { expect(formatTime(45)).toBe('00:45'); });
  it('formats minutes and seconds', () => { expect(formatTime(90)).toBe('01:30'); expect(formatTime(3599)).toBe('59:59'); });
  it('formats with hours', () => { expect(formatTime(3600)).toBe('1:00:00'); expect(formatTime(5400)).toBe('1:30:00'); });
  it('handles zero', () => { expect(formatTime(0)).toBe('00:00'); });
});

describe('formatMinutes', () => {
  it('shows minutes for short durations', () => { expect(formatMinutes(25)).toBe('25m'); });
  it('shows hours for long durations', () => { expect(formatMinutes(60)).toBe('1h'); expect(formatMinutes(90)).toBe('1h 30m'); });
  it('handles zero', () => { expect(formatMinutes(0)).toBe('0m'); });
});

describe('formatHours', () => {
  it('converts minutes to hours string', () => { expect(formatHours(60)).toBe('1.0h'); expect(formatHours(90)).toBe('1.5h'); });
});

describe('pad', () => {
  it('pads single digit numbers', () => { expect(pad(5)).toBe('05'); expect(pad(0)).toBe('00'); });
  it('leaves double digit unchanged', () => { expect(pad(10)).toBe('10'); });
});

describe('extractDomain', () => {
  it('extracts domain from https URL', () => { expect(extractDomain('https://www.youtube.com/watch?v=abc')).toBe('youtube.com'); });
  it('strips www prefix', () => { expect(extractDomain('https://www.github.com')).toBe('github.com'); });
  it('handles subdomain', () => { expect(extractDomain('https://docs.google.com/spreadsheets')).toBe('docs.google.com'); });
  it('handles invalid URL gracefully', () => { expect(extractDomain('not-a-url')).toBe('not-a-url'); });
});

describe('isBlockedDomain', () => {
  const list = ['youtube.com', 'instagram.com', 'reddit.com'];
  it('blocks exact match', () => { expect(isBlockedDomain('https://youtube.com/watch', list)).toBe(true); });
  it('blocks www subdomain', () => { expect(isBlockedDomain('https://www.youtube.com/watch', list)).toBe(true); });
  it('blocks other subdomains', () => { expect(isBlockedDomain('https://m.youtube.com/', list)).toBe(true); });
  it('allows non-blocked domains', () => { expect(isBlockedDomain('https://github.com', list)).toBe(false); });
  it('handles empty blocklist', () => { expect(isBlockedDomain('https://youtube.com', [])).toBe(false); });
  it('handles invalid URL', () => { expect(isBlockedDomain('', list)).toBe(false); });
});

describe('getGreeting', () => {
  it('returns greeting string', () => { expect(typeof getGreeting()).toBe('string'); });
  it('returns morning greeting', () => { vi.setSystemTime(new Date('2024-01-01T08:00:00')); expect(getGreeting()).toBe('Good morning'); vi.useRealTimers(); });
  it('returns afternoon greeting', () => { vi.setSystemTime(new Date('2024-01-01T14:00:00')); expect(getGreeting()).toBe('Good afternoon'); vi.useRealTimers(); });
  it('returns evening greeting', () => { vi.setSystemTime(new Date('2024-01-01T19:00:00')); expect(getGreeting()).toBe('Good evening'); vi.useRealTimers(); });
});

describe('msToMinutes / minutesToMs', () => {
  it('converts ms to minutes', () => { expect(msToMinutes(60000)).toBe(1); expect(msToMinutes(90000)).toBe(1.5); });
  it('converts minutes to ms', () => { expect(minutesToMs(1)).toBe(60000); });
  it('round trips correctly', () => { expect(msToMinutes(minutesToMs(42.5))).toBe(42.5); });
});

describe('getWeekDates', () => {
  it('returns exactly 7 dates', () => { expect(getWeekDates()).toHaveLength(7); });
  it('returns dates in ascending order', () => { const d = getWeekDates(); for (let i=1;i<d.length;i++) expect(d[i]>d[i-1]).toBe(true); });
  it('last date is today', () => { expect(getWeekDates().at(-1)).toBe(today()); });
  it('returns ISO date strings', () => { for (const d of getWeekDates()) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/); });
});

describe('today', () => {
  it('returns ISO date string', () => { expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/); });
});
