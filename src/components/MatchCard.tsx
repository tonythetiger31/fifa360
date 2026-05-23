'use client';

import type { Match } from '@/lib/types';

interface Props {
  match: Match;
  onClick?: () => void;
  compact?: boolean;
}

export default function MatchCard({ match, onClick, compact }: Props) {
  const kickoff = new Date(match.kickoffUTC);
  const timeStr = kickoff.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
  const dateStr = kickoff.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });

  return (
    <div
      onClick={onClick}
      className={`bg-gray-800 rounded-2xl border border-gray-700 transition-all ${onClick ? 'cursor-pointer hover:border-blue-500 active:scale-[0.98]' : ''} ${compact ? 'p-3' : 'p-4'}`}
    >
      {match.status === 'live' && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full bg-red-500 live-pulse" />
          <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Live</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center flex-1">
          <span className="text-3xl">{match.homeTeam.flag}</span>
          <span className="text-sm font-semibold mt-1">{match.homeTeam.name}</span>
        </div>

        <div className="flex flex-col items-center px-4">
          {match.score ? (
            <div className="text-2xl font-black">
              {match.score.home}
              <span className="text-gray-400 mx-1">—</span>
              {match.score.away}
            </div>
          ) : (
            <div className="text-sm text-gray-400 text-center">
              <div className="font-bold text-white">{timeStr}</div>
              <div className="text-xs">{dateStr}</div>
            </div>
          )}
          <span className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{match.stage}</span>
        </div>

        <div className="flex flex-col items-center flex-1">
          <span className="text-3xl">{match.awayTeam.flag}</span>
          <span className="text-sm font-semibold mt-1">{match.awayTeam.name}</span>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
          <span>🏟️ {match.venue}</span>
          <span>{match.city}</span>
        </div>
      )}
    </div>
  );
}
