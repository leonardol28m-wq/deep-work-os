// ============================================================
// Deep Work OS — Score Calculator
// ============================================================

import type { DailyScore, AppState } from '../../types';
import { today } from './time';

export interface ScoreInput {
  focusMinutes: number;
  distractionMinutes: number;
  sessionsCompleted: number;
  sessionsStarted: number;
  tabSwitches: number;
  distractionEvents: number;
  longestStreak: number;
}

/**
 * Focus Score (0-100)
 * Based on ratio of focus time to total active time.
 */
export function calcFocusScore(input: ScoreInput): number {
  const total = input.focusMinutes + input.distractionMinutes;
  if (total === 0) return 0;
  const ratio = input.focusMinutes / total;
  const hoursBonus = Math.min(input.focusMinutes / 240, 1) * 20;
  const rawScore = ratio * 80;
  return Math.min(100, Math.round(rawScore + hoursBonus));
}

/**
 * Consistency Score (0-100)
 * Based on session completion rate and minimum interruptions.
 */
export function calcConsistencyScore(input: ScoreInput): number {
  if (input.sessionsStarted === 0) return 0;
  const completionRate = input.sessionsCompleted / input.sessionsStarted;
  const completionScore = completionRate * 60;
  const distractionPenalty = Math.min(30, input.distractionEvents * 5);
  const streakBonus = Math.min(40, (input.longestStreak / 90) * 40);
  return Math.max(0, Math.min(100, Math.round(completionScore - distractionPenalty + streakBonus)));
}

/**
 * Productivity Score (0-100)
 * Based on overall output quality.
 */
export function calcProductivityScore(input: ScoreInput): number {
  if (input.sessionsCompleted === 0) return 0;
  const sessionsScore = Math.min(40, (input.sessionsCompleted / 4) * 40);
  const deepWorkScore = Math.min(40, (input.focusMinutes / 240) * 40);
  const switchPenalty = Math.min(20, (input.tabSwitches / 50) * 20);
  return Math.max(0, Math.min(100, Math.round(sessionsScore + deepWorkScore - switchPenalty)));
}

/**
 * Total Score (weighted average)
 */
export function calcTotalScore(
  focusScore: number,
  consistencyScore: number,
  productivityScore: number
): number {
  return Math.round(
    focusScore * 0.4 +
    consistencyScore * 0.3 +
    productivityScore * 0.3
  );
}

export function buildDailyScore(state: AppState, date?: string): DailyScore {
  const d = date ?? today();
  const input: ScoreInput = {
    focusMinutes: state.todayFocusMinutes,
    distractionMinutes: state.todayDistractionMinutes,
    sessionsCompleted: state.todaySessionsCompleted,
    sessionsStarted: state.todaySessionsCompleted,
    tabSwitches: state.todayTabSwitches,
    distractionEvents: state.todayDistractionEvents,
    longestStreak: state.todayFocusMinutes,
  };
  const focusScore = calcFocusScore(input);
  const consistencyScore = calcConsistencyScore(input);
  const productivityScore = calcProductivityScore(input);
  const totalScore = calcTotalScore(focusScore, consistencyScore, productivityScore);
  return {
    date: d, focusScore, consistencyScore, productivityScore, totalScore,
    focusMinutes: state.todayFocusMinutes,
    distractionMinutes: state.todayDistractionMinutes,
    sessionsCompleted: state.todaySessionsCompleted,
    sessionsStarted: state.todaySessionsCompleted,
    tabSwitches: state.todayTabSwitches,
    distractionEvents: state.todayDistractionEvents,
    deepWorkHours: state.todayFocusMinutes / 60,
    longestStreak: state.todayFocusMinutes,
  };
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Deep Work';
  if (score >= 60) return 'Focused';
  if (score >= 40) return 'Distracted';
  if (score >= 20) return 'Scattered';
  return 'Lost';
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#6C63FF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

export function trendSymbol(current: number, previous: number): '↑' | '↓' | '→' {
  const diff = current - previous;
  if (diff > 3) return '↑';
  if (diff < -3) return '↓';
  return '→';
}
