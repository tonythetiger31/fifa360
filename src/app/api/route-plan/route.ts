import { NextRequest, NextResponse } from 'next/server';
import { MOCK_VENUES, MOCK_MATCHES } from '@/lib/mock-data';
import { getDepartureBrief } from '@/lib/rocketride';
import { chat, FAST_MODEL } from '@/lib/gmi';
import type { RoutePlan } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { venueId, matchId, mode = 'transit', userLat = 37.7749, userLng = -122.4194 } = await req.json();

  const venue = MOCK_VENUES.find(v => v.id === venueId);
  const match = MOCK_MATCHES.find(m => m.id === matchId);

  if (!venue || !match) {
    return NextResponse.json({ error: 'Venue or match not found' }, { status: 404 });
  }

  const distKm = Math.sqrt(
    Math.pow((venue.lat - userLat) * 111, 2) +
    Math.pow((venue.lng - userLng) * 85, 2)
  );

  const travelMinutes =
    mode === 'walking' ? Math.round(distKm * 12) :
    mode === 'transit' ? Math.round(distKm * 4) :
    Math.round(distKm * 3);

  const kickoff = new Date(match.kickoffUTC);
  const departureMs = kickoff.getTime() - (travelMinutes + 30) * 60 * 1000;
  const departureTime = new Date(departureMs).toISOString();
  const arrivalTime = new Date(departureMs + travelMinutes * 60 * 1000).toISOString();

  const steps = buildSteps(mode, venue.name, travelMinutes);

  const routeData = {
    venueName: venue.name,
    venueAddress: venue.address,
    mode,
    travelMinutes,
    kickoffTime: kickoff.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }),
    departureTime: new Date(departureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }),
    match: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
  };

  let departureBrief = '';
  try {
    departureBrief = await getDepartureBrief(routeData);
  } catch {
    const system = `You are a departure timing assistant for FIFA 2026 fans. Write a 2-3 sentence departure briefing. Be specific and practical. No labels, just the text.`;
    const user = JSON.stringify(routeData, null, 2);
    departureBrief = await chat(FAST_MODEL, system, user, { max_tokens: 150 });
  }

  const plan: RoutePlan = {
    venueId,
    matchId,
    departureTime,
    arrivalTime,
    mode,
    steps,
    shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/route/share?v=${venueId}&m=${matchId}&mode=${mode}`,
    notificationScheduled: false,
  };

  return NextResponse.json({ plan, departureBrief, travelMinutes });
}

function buildSteps(mode: string, venueName: string, totalMin: number) {
  if (mode === 'walking') {
    const leg1 = Math.max(1, Math.round(totalMin * 0.6));
    const leg2 = Math.max(1, totalMin - leg1);
    return [
      { instruction: `Walk toward ${venueName}`, durationMinutes: leg1, mode: 'walking' },
      { instruction: `Continue to ${venueName}`, durationMinutes: leg2, mode: 'walking' },
    ];
  }
  if (mode === 'transit') {
    const walkEach = Math.min(5, Math.max(1, Math.floor(totalMin * 0.2)));
    const transitLeg = Math.max(1, totalMin - walkEach * 2);
    return [
      { instruction: 'Walk to nearest BART/Muni station', durationMinutes: walkEach, mode: 'walking' },
      { instruction: `Take transit toward ${venueName} neighborhood`, durationMinutes: transitLeg, mode: 'transit' },
      { instruction: `Walk to ${venueName}`, durationMinutes: walkEach, mode: 'walking' },
    ];
  }
  // driving
  const parkWalk = Math.max(2, Math.round(totalMin * 0.15));
  const drive = Math.max(1, totalMin - parkWalk);
  return [
    { instruction: `Drive toward ${venueName}`, durationMinutes: drive, mode: 'driving' },
    { instruction: `Park and walk to ${venueName}`, durationMinutes: parkWalk, mode: 'walking' },
  ];
}
