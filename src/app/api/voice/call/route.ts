import { NextRequest, NextResponse } from 'next/server';
import { MOCK_VENUES, MOCK_MATCHES } from '@/lib/mock-data';
import type { FanProfile, CallStatus } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { venueId, matchId, fanProfile }: {
    venueId: string;
    matchId: string;
    fanProfile: FanProfile;
  } = await req.json();

  const venue = MOCK_VENUES.find(v => v.id === venueId);
  const match = MOCK_MATCHES.find(m => m.id === matchId);

  if (!venue || !match) {
    return NextResponse.json({ error: 'Venue or match not found' }, { status: 404 });
  }

  const vapiApiKey = process.env.VAPI_API_KEY;
  const vapiAssistantId = process.env.VAPI_ASSISTANT_ID;
  const vapiPhoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!vapiApiKey || !vapiAssistantId || !vapiPhoneNumberId) {
    const callId = `demo-call-${Date.now()}`;
    return NextResponse.json({
      callId,
      status: 'ringing' as CallStatus,
      demo: true,
      message: 'Demo mode: Vapi not configured. Simulating call.',
    });
  }

  const body = {
    phoneNumberId: vapiPhoneNumberId,
    customer: { number: venue.phone },
    assistantId: vapiAssistantId,
    assistantOverrides: {
      model: {
        provider: 'custom-llm',
        url: `${appUrl}/api/voice/llm`,
        model: 'google/gemma-4-27b-it',
      },
    },
    metadata: { venueId, matchId, fanProfile },
  };

  const vapiRes = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vapiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!vapiRes.ok) {
    const err = await vapiRes.text();
    return NextResponse.json({ error: `Vapi error: ${err}` }, { status: 500 });
  }

  const vapiData = await vapiRes.json();
  return NextResponse.json({ callId: vapiData.id, status: 'ringing' as CallStatus });
}
