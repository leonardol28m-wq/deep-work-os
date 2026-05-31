// ============================================================
// Deep Work OS — Blocked Page
// ============================================================

import React, { useState, useEffect } from 'react';
import { sendMessage } from '../shared/utils/messaging';
import type { AppState } from '../types';
import { formatTime } from '../shared/utils/time';

const QUOTES = [
  { text: "The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable.", author: "Cal Newport" },
  { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
];

export default function BlockedPage() {
  const [state, setState_] = useState<AppState | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const params = new URLSearchParams(window.location.search);
  const blockedDomain = params.get('domain') ?? params.get('url') ?? 'this site';

  useEffect(() => {
    sendMessage<AppState>({ type: 'GET_STATE' }).then(res => {
      if (res.success && res.data) setState_(res.data);
    });
  }, []);

  useEffect(() => {
    if (!state?.activeSession) return;
    const tick = () => {
      const rem = Math.max(0, state.activeSession!.endsAt - Date.now() + state.activeSession!.pausedDuration);
      setRemaining(Math.floor(rem / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state?.activeSession]);

  return (
    <div className="min-h-screen bg-dw-bg text-dw-text flex flex-col items-center justify-center px-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/6 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-900/40 to-purple-900/40 border border-red-500/15 flex items-center justify-center text-4xl shadow-2xl">
            🛡️
          </div>
        </div>
        <div>
          <div className="text-xs text-red-400 uppercase tracking-widest mb-2 font-semibold">Focus Lock Active</div>
          <h1 className="text-3xl font-bold text-dw-text mb-2">{blockedDomain} is blocked</h1>
          <p className="text-dw-text-3 text-sm">This site is blocked to protect your deep work session.</p>
        </div>
        {state?.activeSession && (
          <div className="card p-4 text-center">
            <div className="text-xs text-dw-text-3 mb-1">Session Remaining</div>
            <div className="text-3xl font-mono font-bold text-purple-400">{formatTime(remaining)}</div>
            <div className="text-xs text-dw-text-3 mt-1">Stay the course — you're in deep work</div>
          </div>
        )}
        <div className="card p-5">
          <blockquote className="text-base text-dw-text-2 italic leading-relaxed mb-2">"{quote.text}"</blockquote>
          <cite className="text-xs text-dw-text-3 not-italic">— {quote.author}</cite>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.history.back()}
            className="px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg shadow-purple-900/30 hover:scale-[1.02]">
            ↩ Back to Work
          </button>
          <button onClick={() => chrome.tabs.update({ url: chrome.runtime.getURL('newtab/index.html') })}
            className="px-6 py-3 rounded-2xl text-sm font-semibold bg-white/5 hover:bg-white/8 border border-white/8 text-dw-text-2 transition-all hover:scale-[1.02]">
            📊 Dashboard
          </button>
        </div>
        <div className="text-xs text-dw-text-3">
          Mode: <span className="font-semibold" style={{ color: state?.blockerMode === 'extreme' ? '#EF4444' : '#A78BFA' }}>
            {state?.blockerMode === 'extreme' ? 'Extreme' : 'Normal'}
          </span>
        </div>
      </div>
    </div>
  );
}
