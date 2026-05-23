import { NextRequest, NextResponse } from 'next/server';
import { confirmRsvpMessage } from '@/lib/rocketride';
import { chat, SMART_MODEL } from '@/lib/gmi';
import type { RsvpResult } from '@/lib/types';

const rsvpStore = new Map<string, RsvpResult & { venueId: string; matchId: string; confirmationMessage?: string }>();

export async function POST(req: NextRequest) {
  const body: RsvpResult & { venueId: string; matchId: string } = await req.json();

  const rsvpData = {
    venueName: body.venueId,
    partySize: body.partySize,
    arrivalTime: body.arrivalTime,
    confirmationRef: body.confirmationRef,
    notes: body.notes,
    confirmed: body.confirmed,
  };

  let confirmationMessage = '';
  try {
    confirmationMessage = await confirmRsvpMessage(rsvpData);
  } catch {
    const system = `Write a brief, friendly RSVP confirmation message in 1-2 sentences. Include party size and arrival time.`;
    const user = JSON.stringify(rsvpData, null, 2);
    confirmationMessage = await chat(SMART_MODEL, system, user, { max_tokens: 100 });
  }

  const key = `${body.venueId}:${body.matchId}`;
  rsvpStore.set(key, { ...body, confirmationMessage });

  return NextResponse.json({ success: true, confirmationMessage });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const venueId = searchParams.get('venueId');
  const matchId = searchParams.get('matchId');

  if (!venueId || !matchId) {
    return NextResponse.json({ error: 'Missing venueId or matchId' }, { status: 400 });
  }

  const key = `${venueId}:${matchId}`;
  const rsvp = rsvpStore.get(key);

  if (!rsvp) {
    return NextResponse.json({ rsvp: null });
  }

  return NextResponse.json({ rsvp });
}
