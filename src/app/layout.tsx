'use client';

import './globals.css';
import NavBar from '@/components/NavBar';
import VoiceCallModal from '@/components/VoiceCallModal';
import { useEffect, useState } from 'react';
import { MOCK_VENUES, MOCK_MATCHES, DEMO_PROFILE } from '@/lib/mock-data';
import type { Venue, Match, FanProfile } from '@/lib/types';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [voiceModal, setVoiceModal] = useState<{
    venue: Venue;
    match: Match;
    profile: FanProfile;
  } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { venueId, matchId } = (e as CustomEvent<{ venueId: string; matchId: string }>).detail;
      const venue = MOCK_VENUES.find(v => v.id === venueId);
      const match = MOCK_MATCHES.find(m => m.id === matchId);

      const stored = localStorage.getItem('fanProfile');
      const profile: FanProfile = stored ? JSON.parse(stored) : DEMO_PROFILE;

      if (venue && match) {
        setVoiceModal({ venue, match, profile });
      }
    };

    window.addEventListener('open-voice-modal', handler);
    return () => window.removeEventListener('open-voice-modal', handler);
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#030712" />
        <title>FIFA 360 — Matchday Companion</title>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <main className="pb-20 min-h-screen">
          {children}
        </main>
        <NavBar />

        {voiceModal && (
          <VoiceCallModal
            venue={voiceModal.venue}
            match={voiceModal.match}
            profile={voiceModal.profile}
            onClose={() => setVoiceModal(null)}
          />
        )}
      </body>
    </html>
  );
}
