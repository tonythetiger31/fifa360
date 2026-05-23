'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Venue } from '@/lib/types';

interface Props {
  venue: Venue;
  matchId?: string;
  onCallBook?: (venueId: string, matchId: string) => void;
}

const atmosphereColor = {
  casual: 'text-blue-400 bg-blue-900/30',
  lively: 'text-yellow-400 bg-yellow-900/30',
  electric: 'text-red-400 bg-red-900/30',
};

const typeIcon = {
  bar: '🍺',
  restaurant: '🍽️',
  fan_zone: '🏟️',
  stadium_adjacent: '⭐',
};

export default function VenueCard({ venue, matchId, onCallBook }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden fade-in">
      {/* Header */}
      <div
        className="p-4 cursor-pointer active:bg-gray-750"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span>{typeIcon[venue.type]}</span>
              <h3 className="font-bold text-base truncate">{venue.name}</h3>
              {venue.rsvpAvailable && (
                <span className="text-xs bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded-full border border-green-800 shrink-0">
                  RSVP
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">{venue.address}</p>
          </div>

          <div className="text-right shrink-0">
            {venue.aiRankScore !== undefined && (
              <div className="text-lg font-black text-blue-400">
                {Math.round(venue.aiRankScore * 100)}
                <span className="text-xs text-gray-400 font-normal">%</span>
              </div>
            )}
            <div className="text-xs text-yellow-400">{'⭐'.repeat(Math.round(venue.rating))}</div>
          </div>
        </div>

        {venue.aiRankReason && (
          <p className="text-xs text-blue-300 mt-2 italic">{venue.aiRankReason}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${atmosphereColor[venue.atmosphere]}`}>
            {venue.atmosphere}
          </span>
          <span className="text-xs text-gray-400">{'$'.repeat(venue.priceRange)}</span>
          <span className="text-xs text-gray-400">{venue.capacity}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-700 pt-3">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {venue.amenities.map(a => (
              <span key={a} className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>

          <div className="flex gap-2">
            <Link
              href={`/route?venueId=${venue.id}&matchId=${matchId ?? ''}`}
              className="flex-1 text-center text-sm py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition-colors"
            >
              Get Directions
            </Link>

            <Link
              href={`/venue/${venue.id}${matchId ? `?matchId=${matchId}` : ''}`}
              className="flex-1 text-center text-sm py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 font-semibold transition-colors"
            >
              Ask Concierge
            </Link>

            {venue.rsvpAvailable && onCallBook && matchId && (
              <button
                onClick={() => onCallBook(venue.id, matchId)}
                className="flex-1 text-center text-sm py-2.5 rounded-xl bg-green-700 hover:bg-green-600 font-semibold transition-colors"
              >
                📞 Call & Book
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
