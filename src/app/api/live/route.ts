import { NextRequest, NextResponse } from 'next/server';
import { MOCK_MATCHES, MOCK_LIVE_STATE } from '@/lib/mock-data';
import type { LiveMatchState } from '@/lib/types';

let liveState: LiveMatchState = { ...MOCK_LIVE_STATE };
let lastAdvanced = Date.now();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId') ?? 'match-live-001';

  const match = MOCK_MATCHES.find(m => m.id === matchId);
  if (!match || match.status === 'finished') {
    return NextResponse.json({ error: 'No live match' }, { status: 404 });
  }

  // Advance simulated match time every 10s
  const now = Date.now();
  if (now - lastAdvanced > 10_000 && liveState.minute < 90) {
    liveState = {
      ...liveState,
      minute: Math.min(90, liveState.minute + 1),
      possession: {
        home: 50 + Math.round((Math.random() - 0.5) * 10),
        away: 50 - Math.round((Math.random() - 0.5) * 10),
      },
    };
    lastAdvanced = now;
  }

  return NextResponse.json({ ...liveState, matchId });
}
