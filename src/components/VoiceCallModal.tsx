'use client';

import { useVoiceCall } from '@/hooks/useVoiceCall';
import type { Venue, Match, FanProfile } from '@/lib/types';

interface Props {
  venue: Venue;
  match: Match;
  profile: FanProfile;
  onClose: () => void;
}

export default function VoiceCallModal({ venue, match, profile, onClose }: Props) {
  const { status, transcript, rsvpResult, initiate, reset } = useVoiceCall();

  const handleStart = async () => {
    await initiate(venue.id, match.id, profile);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const statusLabel: Record<typeof status, string> = {
    idle:         `Call ${venue.name} to book your spot for ${match.homeTeam.name} vs ${match.awayTeam.name}?`,
    initiating:   'Connecting...',
    ringing:      `Calling ${venue.name}... ☎️`,
    'in-progress': 'Live call in progress...',
    completed:    'Call completed',
    failed:       "Couldn't reach the venue",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-[430px] bg-gray-900 rounded-t-3xl slide-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="font-bold text-lg">📞 Call & Book</h2>
            <p className="text-sm text-gray-400">{venue.name} · Party of {profile.partySize ?? 2}</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Status bar */}
        <div className="px-4 py-3 bg-gray-800/50">
          <div className="flex items-center gap-2">
            {status === 'initiating' && (
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'ringing' && <span className="text-yellow-400 live-pulse">●</span>}
            {status === 'in-progress' && <span className="text-green-400 live-pulse">●</span>}
            {status === 'completed' && <span className="text-green-400">✓</span>}
            {status === 'failed' && <span className="text-red-400">✗</span>}
            <span className="text-sm text-gray-300">{statusLabel[status]}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Idle state */}
          {status === 'idle' && (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">📞</div>
              <p className="text-gray-400 text-sm mb-2">
                Our AI agent will call {venue.name} and book a table for {match.homeTeam.flag} {match.homeTeam.name} vs {match.awayTeam.flag} {match.awayTeam.name}.
              </p>
              <p className="text-xs text-gray-500">Party of {profile.partySize ?? 2} · Powered by Gemma 4 on GMI Cloud</p>
            </div>
          )}

          {/* Live transcript */}
          {transcript.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider">Live Transcript</h3>
              {transcript.map((line, i) => (
                <div
                  key={i}
                  className={`flex gap-2 text-sm fade-in ${
                    line.role === 'agent' ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <span className="text-lg shrink-0">{line.role === 'agent' ? '🤖' : '👤'}</span>
                  <div
                    className={`rounded-xl px-3 py-2 max-w-[85%] text-sm ${
                      line.role === 'agent'
                        ? 'bg-blue-900/50 text-blue-100'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    {line.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RSVP Confirmed */}
          {rsvpResult?.confirmed && (
            <div className="bg-green-900/40 border border-green-700 rounded-2xl p-4 fade-in">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">✅</span>
                <h3 className="font-bold text-green-400">Table Confirmed!</h3>
              </div>
              <div className="space-y-1 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Party size</span>
                  <span>{rsvpResult.partySize} guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Arrival time</span>
                  <span>{rsvpResult.arrivalTime}</span>
                </div>
                {rsvpResult.confirmationRef && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference</span>
                    <span className="text-green-400 font-mono">#{rsvpResult.confirmationRef}</span>
                  </div>
                )}
                {rsvpResult.notes && (
                  <div className="mt-2 text-xs text-gray-400 italic">{rsvpResult.notes}</div>
                )}
              </div>
            </div>
          )}

          {/* Failed state */}
          {status === 'failed' && !rsvpResult?.confirmed && (
            <div className="bg-red-900/30 border border-red-800 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">📵</div>
              <p className="text-sm text-gray-300 mb-1">Could not reach the venue.</p>
              <p className="text-xs text-gray-400">Try calling directly: {venue.phone}</p>
            </div>
          )}
        </div>

        {/* Footer action */}
        <div className="p-4 border-t border-gray-800">
          {status === 'idle' && (
            <button
              onClick={handleStart}
              className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 font-bold text-lg transition-colors"
            >
              📞 Start Call
            </button>
          )}

          {(status === 'completed' || status === 'failed' || rsvpResult?.confirmed) && (
            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl bg-gray-700 hover:bg-gray-600 font-semibold transition-colors"
            >
              Close
            </button>
          )}

          {(status === 'initiating' || status === 'ringing' || status === 'in-progress') && (
            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl border border-red-700 text-red-400 hover:bg-red-900/30 font-semibold transition-colors"
            >
              Cancel Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
