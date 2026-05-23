'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MOCK_VENUES, MOCK_MATCHES } from '@/lib/mock-data';
import type { RoutePlan, RouteStep } from '@/lib/types';

type Mode = 'walking' | 'transit' | 'driving';

const modeEmoji: Record<Mode, string> = { walking: '🚶', transit: '🚇', driving: '🚗' };

export default function RoutePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-gray-400">Loading...</div></div>}>
      <RouteContent />
    </Suspense>
  );
}

function RouteContent() {
  const searchParams = useSearchParams();
  const venueId = searchParams.get('venueId') ?? MOCK_VENUES[0]?.id;
  const matchId = searchParams.get('matchId') ?? MOCK_MATCHES[0]?.id;

  const venue = MOCK_VENUES.find(v => v.id === venueId);
  const match = MOCK_MATCHES.find(m => m.id === matchId);

  const [mode, setMode] = useState<Mode>('transit');
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [departureBrief, setDepartureBrief] = useState('');
  const [travelMinutes, setTravelMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notifScheduled, setNotifScheduled] = useState(false);

  const fetchPlan = async (m: Mode) => {
    setLoading(true);
    try {
      const res = await fetch('/api/route-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId, matchId, mode: m }),
      });
      const data = await res.json();
      setPlan(data.plan);
      setDepartureBrief(data.departureBrief ?? '');
      setTravelMinutes(data.travelMinutes ?? 0);
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan(mode);
  }, [venueId, matchId]);

  const handleModeChange = (m: Mode) => {
    setMode(m);
    fetchPlan(m);
  };

  const scheduleNotification = async () => {
    if (!plan) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      await fetch('/api/route-plan/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departureTime: plan.departureTime,
          venueName: venue?.name,
          matchName: match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : 'Match',
        }),
      });
      setNotifScheduled(true);
    } catch {
      // fallback: browser notification after delay
      const depart = new Date(plan.departureTime).getTime();
      const delay = Math.max(0, depart - Date.now());
      setTimeout(() => {
        new Notification(`Time to leave for ${venue?.name}!`, {
          body: `${match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : 'Match'} kicks off soon!`,
          icon: '/icon-192.png',
        });
      }, delay);
      setNotifScheduled(true);
    }
  };

  const share = async () => {
    if (plan?.shareUrl && navigator.share) {
      await navigator.share({ title: `Route to ${venue?.name}`, url: plan.shareUrl });
    } else if (plan?.shareUrl) {
      await navigator.clipboard.writeText(plan.shareUrl);
    }
  };

  if (!venue || !match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-400">
          <p className="mb-2">No venue or match selected.</p>
          <a href="/venue" className="text-blue-400 underline">Browse venues →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-12 pb-4 bg-gray-900 border-b border-gray-800">
        <h1 className="text-xl font-black mb-0.5">🗺️ Route Planner</h1>
        <p className="text-sm text-gray-400">{venue.name} · {match.homeTeam.name} vs {match.awayTeam.name}</p>
      </div>

      {/* Mode tabs */}
      <div className="px-4 pt-4 pb-2 flex gap-2">
        {(['walking', 'transit', 'driving'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              mode === m
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400'
            }`}
          >
            {modeEmoji[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4 mt-2">
        {/* Fake map placeholder */}
        <div className="h-44 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          <div className="text-center z-10">
            <div className="text-3xl mb-1">📍</div>
            <p className="text-sm text-gray-400">{venue.name}</p>
            <p className="text-xs text-gray-600">{travelMinutes} min {mode}</p>
          </div>
        </div>

        {/* Departure brief from RocketRide/GMI */}
        {departureBrief && (
          <div className="bg-blue-950/50 border border-blue-800 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-lg shrink-0">🤖</span>
              <div>
                <p className="text-xs text-blue-400 font-semibold mb-1">Gemma 4 Departure Brief · GMI Cloud</p>
                <p className="text-sm text-blue-100">{departureBrief}</p>
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        {plan && !loading && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
            <h3 className="text-sm font-bold mb-3">Route Steps</h3>
            <div className="space-y-2">
              {plan.steps.map((step: RouteStep, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">{modeEmoji[step.mode as Mode] ?? '🚶'}</span>
                  <div className="flex-1">
                    <span className="text-gray-200">{step.instruction}</span>
                  </div>
                  <span className="text-gray-400 shrink-0">{step.durationMinutes}m</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-400">
              <span>Leave by <strong className="text-white">{new Date(plan.departureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}</strong></span>
              <span>Arrive by <strong className="text-white">{new Date(plan.arrivalTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })}</strong></span>
            </div>
          </div>
        )}

        {loading && (
          <div className="h-32 bg-gray-800 rounded-2xl animate-pulse" />
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={scheduleNotification}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors ${
              notifScheduled
                ? 'bg-green-900/40 border-green-700 text-green-400'
                : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500'
            }`}
          >
            {notifScheduled ? '✅ Notif set' : '🔔 Alert me'}
          </button>
          <button
            onClick={share}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-500 transition-colors"
          >
            🔗 Share Plan
          </button>
        </div>
      </div>
    </div>
  );
}
