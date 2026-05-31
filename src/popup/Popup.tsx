// ============================================================
// Deep Work OS — Popup UI
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { sendMessage, onStateChange } from '../shared/utils/messaging';
import type { AppState, DailyScore, BlockerMode, SessionType } from '../types';
import { formatTime, formatMinutes, today } from '../shared/utils/time';
import { scoreLabel, scoreColor } from '../shared/utils/scoring';

const Icon = {
  Focus: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><line x1="12" y1="3" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="21" /><line x1="3" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="21" y2="12" /></svg>),
  Play: () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><polygon points="5 3 19 12 5 21 5 3" /></svg>),
  Pause: () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>),
  Stop: () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>),
  Shield: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
  ExternalLink: () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>),
};

function CircularProgress({ value, size, strokeWidth, color, children }: { value: number; size: number; strokeWidth: number; color: string; children?: React.ReactNode }) {
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

export default function Popup() {
  const [state, setState_] = useState<AppState | null>(null);
  const [weekScores, setWeekScores] = useState<DailyScore[]>([]);
  const [remaining, setRemaining] = useState(0);

  const load = useCallback(async () => {
    const res = await sendMessage<AppState>({ type: 'GET_STATE' });
    if (res.success && res.data) setState_(res.data);
    const scoresRes = await sendMessage<DailyScore[]>({ type: 'GET_SCORES', payload: { days: 7 } });
    if (scoresRes.success && scoresRes.data) setWeekScores(scoresRes.data);
  }, []);

  useEffect(() => { load(); const cleanup = onStateChange(load); return cleanup; }, [load]);

  useEffect(() => {
    if (!state?.activeSession || state.activeSession.isPaused) return;
    const tick = () => {
      const rem = Math.max(0, state.activeSession!.endsAt - Date.now() + state.activeSession!.pausedDuration);
      setRemaining(Math.floor(rem / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state?.activeSession]);

  const openDashboard = () => chrome.tabs.create({ url: chrome.runtime.getURL('newtab/index.html') });

  if (!state) {
    return (<div className="w-72 h-40 bg-dw-bg flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /></div>);
  }

  const session = state.activeSession;
  const todayScore = weekScores.find(s => s.date === today());
  const totalScore = todayScore?.totalScore ?? 0;

  return (
    <div className="w-72 bg-dw-bg text-dw-text font-inter">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center"><Icon.Focus /></div>
          <span className="text-sm font-semibold">Deep Work OS</span>
        </div>
        <button onClick={openDashboard} className="text-dw-text-3 hover:text-dw-text-2 transition-colors" title="Open Dashboard">
          <Icon.ExternalLink />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {session ? (
          <div className="bg-purple-500/8 border border-purple-500/15 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-purple-300 font-medium">{session.isPaused ? '⏸ PAUSED' : '🎯 IN FOCUS'}</div>
                <div className="text-xs text-dw-text-3 mt-0.5">{session.plannedDuration}min session</div>
              </div>
              <CircularProgress value={((session.plannedDuration * 60 - remaining) / (session.plannedDuration * 60)) * 100} size={52} strokeWidth={4} color={session.isPaused ? '#475569' : '#7C3AED'}>
                <span className="text-[9px] font-mono font-bold text-dw-text">{Math.ceil(remaining / 60)}m</span>
              </CircularProgress>
            </div>
            <div className="text-2xl font-mono font-bold text-center text-dw-text mb-3">{formatTime(remaining)}</div>
            <div className="flex gap-2">
              <button onClick={async () => { if (session.isPaused) { await sendMessage({ type: 'RESUME_SESSION' }); } else { await sendMessage({ type: 'PAUSE_SESSION' }); } setTimeout(load, 200); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-dw-text border border-white/5 transition-all">
                {session.isPaused ? <><Icon.Play />Resume</> : <><Icon.Pause />Pause</>}
              </button>
              <button onClick={async () => { await sendMessage({ type: 'STOP_SESSION' }); setTimeout(load, 200); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 transition-all">
                <Icon.Stop />
              </button>
            </div>
          </div>
        ) : (
          <SessionStart onRefresh={load} />
        )}
        <button
          onClick={async () => {
            const next: BlockerMode = state.blockerMode === 'off' ? 'normal' : state.blockerMode === 'normal' ? 'extreme' : 'off';
            await sendMessage({ type: 'SET_BLOCKER_MODE', payload: { mode: next } });
            setTimeout(load, 200);
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
            state.blockerMode === 'off' ? 'text-dw-text-3 border-white/5 bg-white/3' :
            state.blockerMode === 'normal' ? 'text-purple-400 border-purple-500/20 bg-purple-500/8' :
            'text-red-400 border-red-500/20 bg-red-500/8'
          }`}>
          <div className="flex items-center gap-2"><Icon.Shield />
            {state.blockerMode === 'off' ? 'Focus Lock: OFF' : state.blockerMode === 'normal' ? 'Focus Lock: NORMAL' : 'Focus Lock: EXTREME'}
          </div>
          <span className="opacity-50">tap to cycle</span>
        </button>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Focus', value: formatMinutes(state.todayFocusMinutes), color: 'text-purple-400' },
            { label: 'Sessions', value: String(state.todaySessionsCompleted), color: 'text-blue-400' },
            { label: 'Score', value: String(totalScore), color: scoreColor(totalScore) as string },
          ].map(s => (
            <div key={s.label} className="bg-white/3 rounded-xl p-2 text-center border border-white/4">
              <div className={`text-base font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-dw-text-3 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        {totalScore > 0 && (
          <div className="bg-white/3 rounded-xl p-3 border border-white/4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-dw-text-3">Daily Score</span>
              <span className="text-xs font-semibold" style={{ color: scoreColor(totalScore) }}>{scoreLabel(totalScore)}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${totalScore}%`, background: scoreColor(totalScore) }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionStart({ onRefresh }: { onRefresh: () => void }) {
  const [selected, setSelected] = useState(25);
  const [loading, setLoading] = useState(false);
  const start = async () => {
    setLoading(true);
    const type: SessionType = ([25, 50, 90] as number[]).includes(selected) ? selected as SessionType : 'custom';
    await sendMessage({ type: 'START_SESSION', payload: { duration: selected, type } });
    setTimeout(() => { setLoading(false); onRefresh(); }, 300);
  };
  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        {[25, 50, 90].map(d => (
          <button key={d} onClick={() => setSelected(d)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selected === d ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' : 'bg-white/3 border-white/5 text-dw-text-3 hover:bg-white/5'
            }`}>{d}m</button>
        ))}
      </div>
      <button onClick={start} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-900/30">
        {loading ? 'Starting...' : `Start ${selected}min Focus`}
      </button>
    </div>
  );
}
