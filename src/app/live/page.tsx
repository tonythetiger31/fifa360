'use client';

import { useEffect, useState } from 'react';
import { useLiveMatch } from '@/hooks/useLiveMatch';
import { MOCK_MATCHES } from '@/lib/mock-data';
import type { MatchEvent } from '@/lib/types';

type TacticalLevel = 'casual' | 'enthusiast' | 'analyst';

const eventIcon: Record<MatchEvent['type'], string> = {
  goal: '⚽',
  yellow_card: '🟨',
  red_card: '🟥',
  substitution: '🔄',
  var: '📺',
  kickoff: '🎬',
  halftime: '⏸️',
  fulltime: '🏁',
};

export default function LivePage() {
  const match = MOCK_MATCHES.find(m => m.status === 'live');
  const { state, loading } = useLiveMatch(match?.id ?? null);
  const [tacticalLevel, setTacticalLevel] = useState<TacticalLevel>('casual');
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explaining, setExplaining] = useState<string | null>(null);
  const [tacticalText, setTacticalText] = useState('');
  const [loadingTactics, setLoadingTactics] = useState(false);

  const explain = async (event: MatchEvent) => {
    if (explanations[event.id] || explaining === event.id) return;
    setExplaining(event.id);
    try {
      const res = await fetch('/api/live/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      });
      const { explanation } = await res.json();
      setExplanations(prev => ({ ...prev, [event.id]: explanation }));
    } catch {
      setExplanations(prev => ({ ...prev, [event.id]: event.description }));
    } finally {
      setExplaining(null);
    }
  };

  const getTactics = async (level: TacticalLevel) => {
    if (!state) return;
    setLoadingTactics(true);
    try {
      const res = await fetch('/api/live/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: state, level }),
      });
      const { explanation } = await res.json();
      setTacticalText(explanation);
    } catch {
      setTacticalText('Unable to load tactical analysis right now.');
    } finally {
      setLoadingTactics(false);
    }
  };

  const handleLevelChange = (level: TacticalLevel) => {
    setTacticalLevel(level);
    getTactics(level);
  };

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="text-5xl mb-4">⏰</div>
        <h2 className="text-xl font-bold mb-2">No Live Match</h2>
        <p className="text-gray-400 text-sm">Check back when the next match kicks off</p>
        <div className="mt-6 space-y-3 w-full max-w-sm">
          {MOCK_MATCHES.filter(m => m.status === 'upcoming').map(m => (
            <div key={m.id} className="bg-gray-800 rounded-2xl p-3 border border-gray-700 text-sm">
              <div className="flex items-center justify-between">
                <span>{m.homeTeam.flag} {m.homeTeam.name}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(m.kickoffUTC).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}
                </span>
                <span>{m.awayTeam.name} {m.awayTeam.flag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Score header */}
      <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
          <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Live</span>
          <span className="text-gray-500 text-xs">{state?.minute ?? 0}&apos;</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-4xl">{match.homeTeam.flag}</div>
            <div className="text-sm font-bold mt-1">{match.homeTeam.name}</div>
          </div>
          <div className="text-center px-4">
            <div className="text-4xl font-black">
              {state?.score.home ?? match.score?.home ?? 0}
              <span className="text-gray-500 mx-1">–</span>
              {state?.score.away ?? match.score?.away ?? 0}
            </div>
          </div>
          <div className="text-center flex-1">
            <div className="text-4xl">{match.awayTeam.flag}</div>
            <div className="text-sm font-bold mt-1">{match.awayTeam.name}</div>
          </div>
        </div>

        {/* Possession bar */}
        {state && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{state.possession.home}%</span>
              <span className="text-gray-500">Possession</span>
              <span>{state.possession.away}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${state.possession.home}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 space-y-4 mt-4">
        {/* Tactical explainer */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">🧠 Tactical Explainer</h3>
            <div className="flex gap-1">
              {(['casual', 'enthusiast', 'analyst'] as TacticalLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    tacticalLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {loadingTactics ? (
            <div className="h-12 bg-gray-700 rounded animate-pulse" />
          ) : tacticalText ? (
            <p className="text-sm text-gray-200 fade-in">{tacticalText}</p>
          ) : (
            <button
              onClick={() => getTactics(tacticalLevel)}
              className="w-full py-2 text-sm text-blue-400 hover:text-blue-300"
            >
              Get tactical analysis →
            </button>
          )}
        </div>

        {/* Key events */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Key Moments</h3>
          <div className="space-y-2">
            {[...(state?.keyEvents ?? [])].reverse().map(event => (
              <div key={event.id} className="bg-gray-800 rounded-xl p-3 border border-gray-700 fade-in">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{eventIcon[event.type]}</span>
                  <span className="text-xs font-bold text-gray-400">{event.minute}&apos;</span>
                  {event.player && <span className="text-xs text-gray-300">{event.player}</span>}
                  <span className="text-xs text-gray-500 ml-auto">{event.team.toUpperCase()}</span>
                </div>

                <p className="text-xs text-gray-300 mt-1">
                  {explanations[event.id] ?? event.description}
                </p>

                {!explanations[event.id] && explaining !== event.id && (
                  <button
                    onClick={() => explain(event)}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                  >
                    Explain with Gemma 4 →
                  </button>
                )}
                {explaining === event.id && (
                  <span className="text-xs text-gray-500">Generating...</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
