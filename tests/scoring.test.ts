import { describe, it, expect } from 'vitest';
import { calcFocusScore, calcConsistencyScore, calcProductivityScore, calcTotalScore, scoreLabel, scoreColor, trendSymbol } from '../src/shared/utils/scoring';

const base = { focusMinutes: 0, distractionMinutes: 0, sessionsCompleted: 0, sessionsStarted: 0, tabSwitches: 0, distractionEvents: 0, longestStreak: 0 };

describe('calcFocusScore', () => {
  it('returns 0 when no activity', () => { expect(calcFocusScore(base)).toBe(0); });
  it('returns high score for pure focus time', () => { expect(calcFocusScore({ ...base, focusMinutes: 240, sessionsCompleted: 4, sessionsStarted: 4 })).toBeGreaterThanOrEqual(95); });
  it('returns low score for high distraction ratio', () => { expect(calcFocusScore({ ...base, focusMinutes: 10, distractionMinutes: 90, tabSwitches: 80, distractionEvents: 20 })).toBeLessThan(20); });
  it('respects 100 max cap', () => { expect(calcFocusScore({ ...base, focusMinutes: 600 })).toBeLessThanOrEqual(100); });
  it('gives partial score for partial focus', () => { const s = calcFocusScore({ ...base, focusMinutes: 120, distractionMinutes: 120 }); expect(s).toBeGreaterThan(0); expect(s).toBeLessThan(100); });
});

describe('calcConsistencyScore', () => {
  it('returns 0 when no sessions started', () => { expect(calcConsistencyScore(base)).toBe(0); });
  it('rewards high completion rate', () => { expect(calcConsistencyScore({ ...base, focusMinutes: 200, sessionsCompleted: 4, sessionsStarted: 4, longestStreak: 90 })).toBeGreaterThan(60); });
  it('penalizes distraction events', () => {
    const no = calcConsistencyScore({ ...base, focusMinutes: 100, sessionsCompleted: 2, sessionsStarted: 2 });
    const yes = calcConsistencyScore({ ...base, focusMinutes: 100, sessionsCompleted: 2, sessionsStarted: 2, distractionEvents: 10 });
    expect(no).toBeGreaterThan(yes);
  });
  it('does not go below 0', () => { expect(calcConsistencyScore({ ...base, sessionsStarted: 5, distractionEvents: 100 })).toBeGreaterThanOrEqual(0); });
});

describe('calcProductivityScore', () => {
  it('returns 0 with no completed sessions', () => { expect(calcProductivityScore(base)).toBe(0); });
  it('maxes near 100 for ideal day', () => { expect(calcProductivityScore({ ...base, focusMinutes: 240, sessionsCompleted: 4, sessionsStarted: 4 })).toBeGreaterThanOrEqual(75); });
  it('penalizes excessive tab switching', () => {
    const low = calcProductivityScore({ ...base, focusMinutes: 120, sessionsCompleted: 2, sessionsStarted: 2, tabSwitches: 200 });
    const high = calcProductivityScore({ ...base, focusMinutes: 120, sessionsCompleted: 2, sessionsStarted: 2, tabSwitches: 5 });
    expect(high).toBeGreaterThan(low);
  });
});

describe('calcTotalScore', () => {
  it('computes weighted average', () => { expect(calcTotalScore(100, 100, 100)).toBe(100); });
  it('weights correctly (40/30/30)', () => { expect(calcTotalScore(100, 0, 0)).toBe(40); });
  it('handles all zeros', () => { expect(calcTotalScore(0, 0, 0)).toBe(0); });
  it('returns integer', () => { expect(Number.isInteger(calcTotalScore(73, 61, 58))).toBe(true); });
});

describe('scoreLabel', () => {
  it('labels elite scores', () => { expect(scoreLabel(92)).toBe('Elite'); });
  it('labels deep work scores', () => { expect(scoreLabel(80)).toBe('Deep Work'); });
  it('labels focused scores', () => { expect(scoreLabel(65)).toBe('Focused'); });
  it('labels distracted scores', () => { expect(scoreLabel(45)).toBe('Distracted'); });
  it('labels scattered scores', () => { expect(scoreLabel(25)).toBe('Scattered'); });
  it('labels lost scores', () => { expect(scoreLabel(5)).toBe('Lost'); });
});

describe('scoreColor', () => {
  it('returns green for high scores', () => { expect(scoreColor(85)).toBe('#10B981'); });
  it('returns purple for medium scores', () => { expect(scoreColor(70)).toBe('#6C63FF'); });
  it('returns yellow for low-medium scores', () => { expect(scoreColor(50)).toBe('#F59E0B'); });
  it('returns red for low scores', () => { expect(scoreColor(20)).toBe('#EF4444'); });
});

describe('trendSymbol', () => {
  it('returns ↑ for improvement', () => { expect(trendSymbol(80, 70)).toBe('↑'); });
  it('returns ↓ for decline', () => { expect(trendSymbol(65, 75)).toBe('↓'); });
  it('returns → for stability', () => { expect(trendSymbol(72, 71)).toBe('→'); });
  it('handles exact same values', () => { expect(trendSymbol(50, 50)).toBe('→'); });
});
