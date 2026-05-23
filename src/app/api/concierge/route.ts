import { NextRequest, NextResponse } from 'next/server';
import { MOCK_VENUES, MOCK_MATCHES } from '@/lib/mock-data';
import { gmi, FAST_MODEL } from '@/lib/gmi';
import type { ConciergeMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { messages, venueId, matchId }: {
    messages: ConciergeMessage[];
    venueId?: string;
    matchId?: string;
  } = await req.json();

  const venue = venueId ? MOCK_VENUES.find(v => v.id === venueId) : null;
  const match = matchId ? MOCK_MATCHES.find(m => m.id === matchId) : null;

  let system = `You are a helpful FIFA 2026 World Cup matchday concierge. You help fans find the perfect venue, plan their route, and enjoy the match day experience. Be friendly, concise, and specific.`;

  if (venue) {
    system += `\n\nVenue context:\nName: ${venue.name}\nAddress: ${venue.address}\nType: ${venue.type}\nAtmosphere: ${venue.atmosphere}\nAmenities: ${venue.amenities.join(', ')}\nRating: ${venue.rating}/5\nPrice range: ${'$'.repeat(venue.priceRange)}\nRSVP available: ${venue.rsvpAvailable}`;
  }

  if (match) {
    system += `\n\nMatch context:\n${match.homeTeam.name} ${match.homeTeam.flag} vs ${match.awayTeam.flag} ${match.awayTeam.name}\nKickoff: ${new Date(match.kickoffUTC).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}\nVenue: ${match.venue}, ${match.city}`;
  }

  const apiMessages = messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const res = await gmi.chat.completions.create({
    model: FAST_MODEL,
    messages: [{ role: 'system', content: system }, ...apiMessages],
    temperature: 0.7,
    max_tokens: 256,
  });

  const reply = res.choices[0].message.content ?? '';
  return NextResponse.json({ reply });
}
