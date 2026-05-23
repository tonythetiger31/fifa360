import { NextRequest, NextResponse } from 'next/server';
import { MOCK_VENUES, MOCK_MATCHES } from '@/lib/mock-data';
import type { Venue } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get('matchId');
  const lat = parseFloat(searchParams.get('lat') ?? '37.7749');
  const lng = parseFloat(searchParams.get('lng') ?? '-122.4194');
  const maxTravel = parseInt(searchParams.get('maxTravel') ?? '30');

  const match = MOCK_MATCHES.find(m => m.id === matchId);

  const venues: Venue[] = MOCK_VENUES.filter(venue => {
    const distKm = Math.sqrt(
      Math.pow((venue.lat - lat) * 111, 2) +
      Math.pow((venue.lng - lng) * 85, 2)
    );
    const estimatedMinutes = distKm * 4;
    return estimatedMinutes <= maxTravel;
  });

  return NextResponse.json({ venues, match });
}
