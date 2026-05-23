'use client';

import { useState, useRef } from 'react';
import type { CallStatus, TranscriptLine, RsvpResult, FanProfile } from '@/lib/types';

export function useVoiceCall() {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [rsvpResult, setRsvpResult] = useState<RsvpResult | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const initiate = async (venueId: string, matchId: string, fanProfile: FanProfile) => {
    setStatus('initiating');
    setTranscript([]);
    setRsvpResult(null);

    try {
      const res = await fetch('/api/voice/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId, matchId, fanProfile }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('failed');
        return;
      }

      const { callId, demo } = data;
      setStatus('ringing');

      if (demo) {
        await simulateDemoCall(venueId, matchId);
        return;
      }

      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/voice/rsvp?venueId=${venueId}&matchId=${matchId}`);
          const statusData = await statusRes.json();
          if (statusData.rsvp?.confirmed) {
            clearInterval(pollRef.current!);
            setRsvpResult(statusData.rsvp);
            setStatus('completed');
            window.dispatchEvent(new CustomEvent('rsvp-confirmed', { detail: statusData.rsvp }));
          }
        } catch {
          // ignore poll errors
        }
      }, 3000);

      setTimeout(() => {
        if (status !== 'completed') {
          clearInterval(pollRef.current!);
          setStatus('completed');
        }
      }, 180_000);

      void callId;
    } catch {
      setStatus('failed');
    }
  };

  const simulateDemoCall = async (venueId: string, matchId: string) => {
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    setStatus('ringing');
    await delay(2000);
    setStatus('in-progress');

    const lines: { role: TranscriptLine['role']; text: string; delay: number }[] = [
      { role: 'agent', text: "Hi there! I'm an AI assistant calling on behalf of Alex to book a table for the Brazil vs USA match tonight. Do you have availability on the big screen for a party of 3?", delay: 1500 },
      { role: 'venue', text: "Yes, we do! We have a few tables open. What time were you thinking?", delay: 3000 },
      { role: 'agent', text: "We'd love to arrive around 6:30 PM, about 30 minutes before kickoff. Does that work?", delay: 2500 },
      { role: 'venue', text: "6:30 works perfectly. I'll put it down for 3 guests. Any name for the reservation?", delay: 2500 },
      { role: 'agent', text: "Please put it under Alex. Could I get a confirmation number?", delay: 2000 },
      { role: 'venue', text: "Absolutely! Your reference number is 4821. Is there anything else you need?", delay: 2500 },
      { role: 'agent', text: "That's everything, thank you so much! Alex is looking forward to it!", delay: 2000 },
    ];

    for (const line of lines) {
      await delay(line.delay);
      setTranscript(prev => [...prev, { role: line.role, text: line.text, timestamp: new Date().toISOString() }]);
    }

    await delay(1000);

    const result: RsvpResult = {
      confirmed: true,
      partySize: 3,
      arrivalTime: '6:30 PM',
      confirmationRef: '4821',
    };

    await fetch('/api/voice/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...result, venueId, matchId }),
    }).catch(() => {});

    setRsvpResult(result);
    setStatus('completed');
    window.dispatchEvent(new CustomEvent('rsvp-confirmed', { detail: result }));
  };

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus('idle');
    setTranscript([]);
    setRsvpResult(null);
  };

  return { status, transcript, rsvpResult, initiate, reset };
}
