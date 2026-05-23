import { NextRequest, NextResponse } from 'next/server';
import { MOCK_VENUES, MOCK_MATCHES } from '@/lib/mock-data';
import { gmi, SMART_MODEL } from '@/lib/gmi';
import type { FanProfile } from '@/lib/types';

const confirmRsvpTool = {
  type: 'function' as const,
  function: {
    name: 'confirm_rsvp',
    description: 'Call when the venue verbally confirms the reservation',
    parameters: {
      type: 'object',
      properties: {
        confirmed:       { type: 'boolean' },
        partySize:       { type: 'number' },
        arrivalTime:     { type: 'string' },
        confirmationRef: { type: 'string' },
        notes:           { type: 'string' },
      },
      required: ['confirmed', 'partySize', 'arrivalTime'],
    },
  },
};

const endCallTool = {
  type: 'function' as const,
  function: {
    name: 'end_call',
    description: 'End the call after the RSVP is confirmed or the venue cannot accommodate',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
      },
      required: ['reason'],
    },
  },
};

function buildRsvpSystemPrompt(
  venueName: string,
  homeTeam: string,
  awayTeam: string,
  kickoffTime: string,
  fanName: string,
  partySize: number,
  arrivalTime: string
) {
  return `You are a friendly AI assistant calling ${venueName} on behalf of ${fanName} to reserve a table to watch the ${homeTeam} vs ${awayTeam} match (kickoff ${kickoffTime}) on the big screen.
Party size: ${partySize}. Requested arrival: ${arrivalTime}.

Your goals:
1. Introduce yourself clearly as an AI assistant calling for ${fanName}
2. Ask if they have availability on the big screen for the match
3. Negotiate party size and arrival time if needed
4. Confirm the reservation and ask for any reference number or special instructions
5. When confirmed, call the confirm_rsvp tool with the agreed details
6. Thank them and end the call politely using the end_call tool

Be concise — you are on a live phone call. Keep turns short (1-3 sentences).
If they can't accommodate, thank them and end the call gracefully using end_call.`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const messages = body.messages ?? [];
  const metadata: { venueId?: string; matchId?: string; fanProfile?: FanProfile } =
    body.call?.metadata ?? body.metadata ?? {};

  const venue  = metadata.venueId  ? MOCK_VENUES.find(v => v.id === metadata.venueId)  : null;
  const match  = metadata.matchId  ? MOCK_MATCHES.find(m => m.id === metadata.matchId) : null;
  const fan    = metadata.fanProfile;

  const kickoffTime = match
    ? new Date(match.kickoffUTC).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })
    : '7:00 PM';

  const arrivalTime = match
    ? new Date(new Date(match.kickoffUTC).getTime() - 30 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })
    : '6:30 PM';

  const systemPrompt = buildRsvpSystemPrompt(
    venue?.name ?? 'the venue',
    match?.homeTeam.name ?? 'Team A',
    match?.awayTeam.name ?? 'Team B',
    kickoffTime,
    fan?.name ?? 'a fan',
    fan?.partySize ?? 2,
    arrivalTime
  );

  const stream = await gmi.chat.completions.create({
    model: SMART_MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
    tools: [confirmRsvpTool, endCallTool],
    temperature: 0.6,
    max_tokens: 256,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const data = JSON.stringify(chunk);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
