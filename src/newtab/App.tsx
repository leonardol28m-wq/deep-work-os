// ============================================================
// Deep Work OS — New Tab Dashboard
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sendMessage, onStateChange } from '../shared/utils/messaging';
import type { AppState, Task, Goal, DailyScore, BlockerMode, SessionType } from '../types';
import {
  formatTime, formatMinutes, formatHours, getGreeting, today, getDayName, getWeekDates
} from '../shared/utils/time';
import { scoreLabel, scoreColor } from '../shared/utils/scoring';

const Icon = {
  Focus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
      <line x1="12" y1="3" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="21" />
      <line x1="3" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="21" y2="12" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Pause: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  Stop: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  TrendUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Award: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  Flag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
};

function CircularProgress({ value, size = 120, strokeWidth = 6, color = '#7C3AED', children }: {
  value: number; size?: number; strokeWidth?: number; color?: string; children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(value, 100) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function WeekBarChart({ scores }: { scores: DailyScore[] }) {
  const maxVal = Math.max(...scores.map(s => s.totalScore), 1);
  const dates = getWeekDates();
  return (
    <div className="flex items-end gap-1.5 h-16">
      {dates.map(date => {
        const score = scores.find(s => s.date === date);
        const val = score?.totalScore ?? 0;
        const height = `${Math.max(4, (val / maxVal) * 100)}%`;
        const isToday = date === today();
        return (
          <div key={date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-sm transition-all duration-500 relative group" style={{
              height,
              background: isToday ? 'linear-gradient(to top, #7C3AED, #A78BFA)' : val > 0 ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.04)',
            }}>
              {val > 0 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-dw-text-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {val}
                </div>
              )}
            </div>
            <span className={`text-[9px] font-medium ${isToday ? 'text-purple-400' : 'text-dw-text-3'}`}>
              {getDayName(date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const h = time.getHours().toString().padStart(2, '0');
  const m = time.getMinutes().toString().padStart(2, '0');
  const s = time.getSeconds().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className="text-center">
      <div className="font-mono font-bold text-dw-text tracking-tight" style={{ fontSize: 72, lineHeight: 1 }}>
        {h}<span className="opacity-40 animate-pulse">:</span>{m}
        <span className="text-3xl text-dw-text-3 ml-2">{s}</span>
      </div>
      <div className="text-dw-text-2 text-sm mt-2 tracking-wide">{dateStr}</div>
    </div>
  );
}

function SessionTimer({ state, onRefresh }: { state: AppState; onRefresh: () => void }) {
  const [remaining, setRemaining] = useState(0);
  const [starting, setStarting] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const session = state.activeSession;

  useEffect(() => {
    if (!session || session.isPaused) return;
    const tick = () => {
      const rem = Math.max(0, session.endsAt - Date.now() + session.pausedDuration);
      setRemaining(Math.floor(rem / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session]);

  const handleStart = useCallback(async (mins: number) => {
    setStarting(true);
    const type: SessionType = ([25, 50, 90] as number[]).includes(mins) ? (mins as SessionType) : 'custom';
    await sendMessage({ type: 'START_SESSION', payload: { duration: mins, type } });
    setTimeout(() => { setStarting(false); onRefresh(); }, 300);
  }, [onRefresh]);

  const handlePause = useCallback(async () => {
    if (session?.isPaused) { await sendMessage({ type: 'RESUME_SESSION' }); }
    else { await sendMessage({ type: 'PAUSE_SESSION' }); }
    setTimeout(onRefresh, 200);
  }, [session, onRefresh]);

  const handleStop = useCallback(async () => {
    await sendMessage({ type: 'STOP_SESSION' });
    setTimeout(onRefresh, 200);
  }, [onRefresh]);

  const durations = [
    { label: '25m', value: 25, desc: 'Pomodoro' },
    { label: '50m', value: 50, desc: 'Flow' },
    { label: '90m', value: 90, desc: 'Deep' },
  ];

  if (session) {
    const progress = ((session.plannedDuration * 60 - remaining) / (session.plannedDuration * 60)) * 100;
    const color = session.isPaused ? '#475569' : '#7C3AED';
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-xs text-dw-text-3 uppercase tracking-widest mb-1">
          {session.type === 'custom' ? 'Custom' : `${session.plannedDuration}min`} Session
          {session.isPaused && <span className="ml-2 text-yellow-400">PAUSED</span>}
        </div>
        <CircularProgress value={progress} size={160} strokeWidth={6} color={color}>
          <div className="text-center">
            <div className="font-mono font-bold text-3xl text-dw-text">{formatTime(remaining)}</div>
            <div className="text-[10px] text-dw-text-3 mt-0.5">remaining</div>
          </div>
        </CircularProgress>
        <div className="flex gap-2">
          <button onClick={handlePause}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-white/5 hover:bg-white/10 text-dw-text border border-white/5">
            {session.isPaused ? <Icon.Play /> : <Icon.Pause />}
            {session.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10">
            <Icon.Stop />Stop
          </button>
        </div>
        {session.interruptions > 0 && (
          <div className="text-xs text-dw-text-3">⚠️ {session.interruptions} interruption{session.interruptions > 1 ? 's' : ''}</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-xs text-dw-text-3 uppercase tracking-widest">Start Deep Work Session</div>
      <div className="flex gap-2">
        {durations.map(d => (
          <button key={d.value} onClick={() => setSelectedDuration(d.value)}
            className={`flex flex-col items-center px-4 py-2.5 rounded-xl border transition-all ${
              selectedDuration === d.value ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' : 'bg-white/3 border-white/5 text-dw-text-2 hover:bg-white/6'
            }`}>
            <span className="text-base font-bold">{d.label}</span>
            <span className="text-[9px] opacity-60">{d.desc}</span>
          </button>
        ))}
      </div>
      <button onClick={() => handleStart(selectedDuration)} disabled={starting}
        className="group flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-semibold text-white transition-all duration-200 disabled:opacity-50 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98]">
        <Icon.Play />
        {starting ? 'Starting...' : `Start ${selectedDuration}min Focus`}
      </button>
    </div>
  );
}

function FocusLock({ mode, onToggle }: { mode: BlockerMode; onToggle: (m: BlockerMode) => void }) {
  const modes: { key: BlockerMode; label: string; desc: string; color: string }[] = [
    { key: 'off', label: 'OFF', desc: 'No blocking', color: 'text-dw-text-3' },
    { key: 'normal', label: 'Normal', desc: '8 sites blocked', color: 'text-purple-400' },
    { key: 'extreme', label: 'Extreme', desc: '16 sites blocked', color: 'text-red-400' },
  ];
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon.Shield />
        <span className="text-xs font-semibold text-dw-text-2 uppercase tracking-wider">Focus Lock</span>
      </div>
      <div className="flex gap-1.5">
        {modes.map(m => (
          <button key={m.key} onClick={() => onToggle(m.key)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold border transition-all ${
              mode === m.key ? 'bg-white/8 border-white/15 ' + m.color : 'bg-transparent border-white/4 text-dw-text-3 hover:bg-white/4'
            }`}>
            <div>{m.label}</div>
            <div className="font-normal opacity-60 text-[9px] mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }: { task: Task; onToggle: (t: Task) => void; onDelete: (id: number) => void }) {
  return (
    <div className={`group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/3 transition-all ${task.completed ? 'opacity-40' : ''}`}>
      <button onClick={() => onToggle(task)}
        className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
          task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-purple-400'
        }`}>
        {task.completed && <Icon.Check />}
      </button>
      <span className={`flex-1 text-sm text-dw-text ${task.completed ? 'line-through text-dw-text-3' : ''}`}>{task.text}</span>
      <button onClick={() => task.id && onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-dw-text-3 hover:text-red-400 transition-all">
        <Icon.Trash />
      </button>
    </div>
  );
}

function TaskList({ date }: { date: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await sendMessage<Task[]>({ type: 'GET_TASKS', payload: { date } });
    if (res.success && res.data) setTasks(res.data);
    setLoading(false);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const addTask = useCallback(async () => {
    if (!input.trim()) return;
    const res = await sendMessage<{ id: number }>({
      type: 'ADD_TASK',
      payload: { text: input.trim(), completed: false, priority: 'medium', date, order: tasks.length },
    });
    if (res.success && res.data) {
      setTasks(prev => [...prev, { id: res.data!.id, text: input.trim(), completed: false, priority: 'medium', date, order: tasks.length }]);
      setInput('');
    }
  }, [input, date, tasks.length]);

  const toggleTask = useCallback(async (task: Task) => {
    const updated = { ...task, completed: !task.completed, completedAt: !task.completed ? Date.now() : undefined };
    await sendMessage({ type: 'UPDATE_TASK', payload: updated as Task & { id: number } });
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    await sendMessage({ type: 'DELETE_TASK', payload: { id } });
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const pending = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Icon.Flag /><span className="text-xs font-semibold text-dw-text-2 uppercase tracking-wider">Tasks</span></div>
        <span className="text-xs text-dw-text-3">{done.length}/{tasks.length}</span>
      </div>
      <div className="flex gap-1.5 mb-3">
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add task..."
          className="flex-1 bg-white/4 border border-white/5 rounded-lg px-3 py-1.5 text-sm text-dw-text placeholder-dw-text-3 outline-none focus:border-purple-500/40 transition-all" />
        <button onClick={addTask}
          className="w-8 h-8 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 flex items-center justify-center text-purple-400 transition-all hover:scale-105">
          <Icon.Plus />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {loading && <div className="text-center text-dw-text-3 text-sm py-4">Loading...</div>}
        {!loading && tasks.length === 0 && <div className="text-center text-dw-text-3 text-xs py-4 opacity-50">No tasks yet.</div>}
        {pending.map(task => <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />)}
        {done.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/4 space-y-1">
            {done.map(task => <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function GoalList({ date }: { date: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [input, setInput] = useState('');

  const load = useCallback(async () => {
    const res = await sendMessage<Goal[]>({ type: 'GET_GOALS', payload: { date } });
    if (res.success && res.data) setGoals(res.data);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const addGoal = useCallback(async () => {
    if (!input.trim()) return;
    const res = await sendMessage<{ id: number }>({ type: 'ADD_GOAL', payload: { text: input.trim(), completed: false, date } });
    if (res.success && res.data) {
      setGoals(prev => [...prev, { id: res.data!.id, text: input.trim(), completed: false, date }]);
      setInput('');
    }
  }, [input, date]);

  const toggleGoal = useCallback(async (goal: Goal) => {
    const updated = { ...goal, completed: !goal.completed, completedAt: !goal.completed ? Date.now() : undefined };
    await sendMessage({ type: 'UPDATE_GOAL', payload: updated as Goal & { id: number } });
    setGoals(prev => prev.map(g => g.id === goal.id ? updated : g));
  }, []);

  const deleteGoal = useCallback(async (id: number) => {
    await sendMessage({ type: 'DELETE_GOAL', payload: { id } });
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const completed = goals.filter(g => g.completed).length;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Icon.Award /><span className="text-xs font-semibold text-dw-text-2 uppercase tracking-wider">Daily Goals</span></div>
        {goals.length > 0 && <span className="text-xs text-dw-text-3">{completed}/{goals.length}</span>}
      </div>
      <div className="flex gap-1.5 mb-3">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGoal()}
          placeholder="Set a goal for today..."
          className="flex-1 bg-white/4 border border-white/5 rounded-lg px-3 py-1.5 text-sm text-dw-text placeholder-dw-text-3 outline-none focus:border-purple-500/40 transition-all" />
        <button onClick={addGoal}
          className="w-8 h-8 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 flex items-center justify-center text-purple-400 transition-all hover:scale-105">
          <Icon.Plus />
        </button>
      </div>
      <div className="space-y-1">
        {goals.length === 0 && <div className="text-center text-dw-text-3 text-xs py-2 opacity-50">What do you want to achieve today?</div>}
        {goals.map(goal => (
          <div key={goal.id} className={`group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/3 transition-all ${goal.completed ? 'opacity-40' : ''}`}>
            <button onClick={() => toggleGoal(goal)}
              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                goal.completed ? 'bg-purple-500 border-purple-500' : 'border-white/20 hover:border-purple-400'
              }`}>
              {goal.completed && <Icon.Check />}
            </button>
            <span className={`flex-1 text-sm text-dw-text ${goal.completed ? 'line-through text-dw-text-3' : ''}`}>{goal.text}</span>
            <button onClick={() => goal.id && deleteGoal(goal.id)}
              className="opacity-0 group-hover:opacity-100 text-dw-text-3 hover:text-red-400 transition-all">
              <Icon.Trash />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsRow({ state }: { state: AppState }) {
  const stats = [
    { label: 'Focus Time', value: formatMinutes(state.todayFocusMinutes), icon: <Icon.Clock />, color: 'text-purple-400', bg: 'bg-purple-500/8' },
    { label: 'Sessions', value: state.todaySessionsCompleted.toString(), icon: <Icon.Focus />, color: 'text-blue-400', bg: 'bg-blue-500/8' },
    { label: 'Deep Hours', value: formatHours(state.todayFocusMinutes), icon: <Icon.Zap />, color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
    { label: 'Tab Switches', value: state.todayTabSwitches.toString(), icon: <Icon.TrendUp />, color: state.todayTabSwitches > 30 ? 'text-red-400' : 'text-dw-text-2', bg: state.todayTabSwitches > 30 ? 'bg-red-500/8' : 'bg-white/4' },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(s => (
        <div key={s.label} className={`${s.bg} rounded-xl p-3 border border-white/4`}>
          <div className={`${s.color} mb-1`}>{s.icon}</div>
          <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
          <div className="text-[10px] text-dw-text-3 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function DailyScoreWidget({ weekScores }: { state: AppState; weekScores: DailyScore[] }) {
  const todayScore = weekScores.find(s => s.date === today());
  const totalScore = todayScore?.totalScore ?? 0;
  const color = scoreColor(totalScore);
  const label = scoreLabel(totalScore);
  const subscores = [
    { label: 'Focus', value: todayScore?.focusScore ?? 0, color: '#7C3AED' },
    { label: 'Consistency', value: todayScore?.consistencyScore ?? 0, color: '#3B82F6' },
    { label: 'Productivity', value: todayScore?.productivityScore ?? 0, color: '#10B981' },
  ];
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3"><Icon.Award /><span className="text-xs font-semibold text-dw-text-2 uppercase tracking-wider">Daily Score</span></div>
      <div className="flex items-center gap-4">
        <CircularProgress value={totalScore} size={80} strokeWidth={5} color={color}>
          <span className="font-bold font-mono text-lg text-dw-text">{totalScore}</span>
        </CircularProgress>
        <div className="flex-1">
          <div className="text-base font-bold mb-1" style={{ color }}>{label}</div>
          <div className="space-y-1.5">
            {subscores.map(sub => (
              <div key={sub.label} className="flex items-center gap-2">
                <span className="text-[10px] text-dw-text-3 w-16">{sub.label}</span>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${sub.value}%`, background: sub.color }} />
                </div>
                <span className="text-[10px] font-mono text-dw-text-2 w-6 text-right">{sub.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [weekScores, setWeekScores] = useState<DailyScore[]>([]);
  const [tab, setTab] = useState<'focus' | 'tasks' | 'stats'>('focus');
  const currentDate = today();

  const loadState = useCallback(async () => {
    const res = await sendMessage<AppState>({ type: 'GET_STATE' });
    if (res.success && res.data) setState(res.data);
    const scoresRes = await sendMessage<DailyScore[]>({ type: 'GET_SCORES', payload: { days: 7 } });
    if (scoresRes.success && scoresRes.data) setWeekScores(scoresRes.data);
  }, []);

  useEffect(() => {
    loadState();
    const cleanup = onStateChange(loadState);
    const id = setInterval(loadState, 5000);
    return () => { cleanup(); clearInterval(id); };
  }, [loadState]);

  const handleBlockerToggle = useCallback(async (mode: BlockerMode) => {
    await sendMessage({ type: 'SET_BLOCKER_MODE', payload: { mode } });
    setTimeout(loadState, 300);
  }, [loadState]);

  if (!state) {
    return (
      <div className="min-h-screen bg-dw-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dw-bg text-dw-text overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-900/10 rounded-full blur-[120px]" />
        {state.activeSession && !state.activeSession.isPaused && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-purple-600/8 rounded-full blur-[60px] animate-pulse" />
        )}
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center">
              <Icon.Focus />
            </div>
            <div>
              <div className="text-xs text-dw-text-3 uppercase tracking-widest">Deep Work OS</div>
              <div className="text-sm font-medium text-dw-text">{getGreeting()}</div>
            </div>
          </div>
          {state.blockerMode !== 'off' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              state.blockerMode === 'extreme' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {state.blockerMode === 'extreme' ? 'Extreme Mode' : 'Normal Mode'} Active
            </div>
          )}
        </div>
        <div className="mb-8"><LiveClock /></div>
        <div className="flex gap-1 mb-6 bg-white/3 rounded-xl p-1 w-fit mx-auto border border-white/4">
          {(['focus', 'tasks', 'stats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-white/10 text-dw-text shadow-sm' : 'text-dw-text-3 hover:text-dw-text-2'
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {tab === 'focus' && (
          <div className="space-y-4">
            <div className="card p-6 flex flex-col items-center">
              <SessionTimer state={state} onRefresh={loadState} />
            </div>
            <StatsRow state={state} />
            <div className="grid grid-cols-2 gap-4">
              <FocusLock mode={state.blockerMode} onToggle={handleBlockerToggle} />
              <GoalList date={currentDate} />
            </div>
          </div>
        )}
        {tab === 'tasks' && (
          <div className="h-[420px]"><TaskList date={currentDate} /></div>
        )}
        {tab === 'stats' && (
          <div className="space-y-4">
            <StatsRow state={state} />
            <DailyScoreWidget state={state} weekScores={weekScores} />
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4"><Icon.TrendUp /><span className="text-xs font-semibold text-dw-text-2 uppercase tracking-wider">7-Day Score</span></div>
              <WeekBarChart scores={weekScores} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Best Streak', value: `${Math.max(...weekScores.map(s => s.longestStreak), 0)}min`, color: 'text-purple-400' },
                { label: 'Avg Score', value: weekScores.length ? Math.round(weekScores.reduce((s,d) => s+d.totalScore,0)/weekScores.length).toString() : '0', color: 'text-blue-400' },
                { label: 'Weekly Hours', value: formatHours(weekScores.reduce((s,d) => s+d.focusMinutes,0)), color: 'text-emerald-400' },
              ].map(s => (
                <div key={s.label} className="card p-3 text-center">
                  <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-dw-text-3 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
