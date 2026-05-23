'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import VenueCard from '@/components/VenueCard';
import MatchCard from '@/components/MatchCard';
import { MOCK_MATCHES, DEMO_PROFILE } from '@/lib/mock-data';
import type { Venue, Match, FanProfile } from '@/lib/types';

type FilterAtmosphere = 'all' | 'electric' | 'lively' | 'casual';
type FilterType = 'all' | 'bar' | 'restaurant' | 'fan_zone';

export default function VenuePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-gray-400">Loading...</div></div>}>
      <VenueContent />
    </Suspense>
  );
}

function VenueContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId') ?? MOCK_MATCHES[0]?.id;

  const [venues, setVenues] = useState<Venue[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(false);
  const [atmosphere, setAtmosphere] = useState<FilterAtmosphere>('all');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');

  const rankVenues = useCallback(async (rawVenues: Venue[]) => {
    setRanking(true);
    try {
      const stored = localStorage.getItem('fanProfile');
      const profile: FanProfile = stored ? JSON.parse(stored) : DEMO_PROFILE;

      const res = await fetch('/api/venue/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, venues: rawVenues.map(v => v.id) }),
      });
      const data = await res.json();
      if (data.venues) setVenues(data.venues);
    } catch {
      setVenues(rawVenues);
    } finally {
      setRanking(false);
    }
  }, []);

  useEffect(() => {
    const loadVenues = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/venue?matchId=${matchId}&lat=37.7749&lng=-122.4194`);
        const data = await res.json();
        setMatch(data.match ?? MOCK_MATCHES.find(m => m.id === matchId) ?? null);
        await rankVenues(data.venues ?? []);
      } catch {
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    loadVenues();
  }, [matchId, rankVenues]);

  const filtered = venues.filter(v => {
    if (atmosphere !== 'all' && v.atmosphere !== atmosphere) return false;
    if (typeFilter !== 'all' && v.type !== typeFilter) return false;
    return true;
  });

  const handleCallBook = (venueId: string, mId: string) => {
    window.dispatchEvent(new CustomEvent('open-voice-modal', { detail: { venueId, matchId: mId } }));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-gradient-to-b from-gray-900 to-gray-950 sticky top-0 z-10">
        <h1 className="text-xl font-black mb-1">🏟️ Venue Finder</h1>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          {ranking
            ? <><span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin inline-block" /> AI ranking with Gemma 4 on GMI Cloud...</>
            : `${filtered.length} venues · AI-ranked for you`
          }
        </p>
      </div>

      {/* Match selector */}
      {match && (
        <div className="px-4 mb-3">
          <MatchCard match={match} compact />
        </div>
      )}

      {/* Filter chips */}
      <div className="px-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {(['all', 'electric', 'lively', 'casual'] as FilterAtmosphere[]).map(f => (
          <button
            key={f}
            onClick={() => setAtmosphere(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              atmosphere === f
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            {f === 'all' ? '🌍 All' : f === 'electric' ? '⚡ Electric' : f === 'lively' ? '🔥 Lively' : '😌 Casual'}
          </button>
        ))}
        {(['bar', 'restaurant', 'fan_zone'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(t => t === f ? 'all' : f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              typeFilter === f
                ? 'bg-purple-700 border-purple-600 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            {f === 'bar' ? '🍺 Bar' : f === 'restaurant' ? '🍽️ Restaurant' : '🏟️ Fan Zone'}
          </button>
        ))}
      </div>

      {/* Venue list */}
      <div className="px-4 pb-4 space-y-3 mt-2">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-gray-800 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🏜️</div>
            <p>No venues match your filters</p>
          </div>
        ) : (
          filtered.map(venue => (
            <VenueCard
              key={venue.id}
              venue={venue}
              matchId={matchId ?? undefined}
              onCallBook={handleCallBook}
            />
          ))
        )}
      </div>
    </div>
  );
}
