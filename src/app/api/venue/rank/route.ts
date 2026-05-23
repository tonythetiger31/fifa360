import { NextRequest, NextResponse } from 'next/server';
import { MOCK_VENUES } from '@/lib/mock-data';
import { rankVenues } from '@/lib/rocketride';
import { chat, SMART_MODEL } from '@/lib/gmi';
import type { FanProfile, Venue } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { profile, venues: venueIds }: { profile: FanProfile; venues?: string[] } = await req.json();

  const venues = venueIds
    ? MOCK_VENUES.filter(v => venueIds.includes(v.id))
    : MOCK_VENUES;

  const venuesSummary = venues.map(v => ({
    id: v.id,
    name: v.name,
    type: v.type,
    atmosphere: v.atmosphere,
    capacity: v.capacity,
    priceRange: v.priceRange,
    amenities: v.amenities,
    rating: v.rating,
  }));

  const profileSummary = {
    favoriteTeams: profile.favoriteTeams,
    watchStyle: profile.watchStyle,
    budgetRange: profile.budgetRange,
    maxTravelMinutes: profile.maxTravelMinutes,
  };

  let rankingJson = '';
  let useRocketRide = true;

  try {
    rankingJson = await rankVenues(
      JSON.stringify(profileSummary, null, 2),
      JSON.stringify(venuesSummary, null, 2)
    );
  } catch {
    useRocketRide = false;
  }

  if (!useRocketRide || !rankingJson) {
    const system = `You are a venue ranking AI for FIFA 2026 World Cup matchday fans. Given a fan profile and venue list, rank ALL venues. Return a JSON array: [{"venueId":string,"aiRankScore":number,"aiRankReason":string}]. One sentence max for reason, max 15 words. Order by score descending. Return ONLY the JSON array.`;
    const user = `Fan Profile:\n${JSON.stringify(profileSummary, null, 2)}\n\nVenues:\n${JSON.stringify(venuesSummary, null, 2)}`;
    rankingJson = await chat(SMART_MODEL, system, user, { max_tokens: 1024 });
  }

  let rankings: { venueId: string; aiRankScore: number; aiRankReason: string }[] = [];
  try {
    const match = rankingJson.match(/\[[\s\S]*\]/);
    if (match) rankings = JSON.parse(match[0]);
  } catch {
    rankings = venues.map((v, i) => ({
      venueId: v.id,
      aiRankScore: Math.max(0.5, 1 - i * 0.1),
      aiRankReason: 'Great spot to watch the match with fellow fans.',
    }));
  }

  const ranked: Venue[] = venues
    .map(v => {
      const r = rankings.find(x => x.venueId === v.id);
      return {
        ...v,
        aiRankScore: r?.aiRankScore ?? 0.5,
        aiRankReason: r?.aiRankReason ?? 'A solid choice for matchday.',
      };
    })
    .sort((a, b) => (b.aiRankScore ?? 0) - (a.aiRankScore ?? 0));

  return NextResponse.json({ venues: ranked, source: useRocketRide ? 'rocketride' : 'gmi-direct' });
}
