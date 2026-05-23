import { NextRequest, NextResponse } from 'next/server';
import { explainLiveEvent } from '@/lib/rocketride';
import { chat, SMART_MODEL, FAST_MODEL } from '@/lib/gmi';
import type { MatchEvent, LiveMatchState } from '@/lib/types';

const TACTICAL_PROMPTS: Record<string, string> = {
  casual: `You are a casual football commentator. Explain what is happening in simple terms a new fan can understand. 1-2 sentences max. Use basic language, no jargon.`,
  enthusiast: `You are a football analyst. Explain the tactical situation with some detail. Mention formations, player roles, and match dynamics. 2-3 sentences.`,
  analyst: `You are a professional football analyst. Give a deep tactical breakdown mentioning formations, pressing schemes, positional play, and how this affects the match dynamics. 3-4 sentences, include tactical terminology.`,
};

export async function POST(req: NextRequest) {
  const { event, context, level = 'casual' }: {
    event?: MatchEvent;
    context?: LiveMatchState;
    level?: 'casual' | 'enthusiast' | 'analyst';
  } = await req.json();

  if (event && !context) {
    const eventData = {
      type: event.type,
      player: event.player,
      team: event.team,
      minute: event.minute,
      description: event.description,
    };

    let explanation = '';
    try {
      explanation = await explainLiveEvent(eventData);
    } catch {
      const system = `You are a live football commentator for FIFA 2026. Describe this event in 1-2 vivid sentences for a casual fan. Return ONLY the description.`;
      const user = `Event: ${event.type} by ${event.player ?? event.team} at minute ${event.minute}. Current description: ${event.description}`;
      explanation = await chat(FAST_MODEL, system, user, { max_tokens: 100 });
    }

    return NextResponse.json({ explanation });
  }

  const system = TACTICAL_PROMPTS[level] ?? TACTICAL_PROMPTS.casual;
  const user = context
    ? `Match: ${context.matchId}, Minute: ${context.minute}, Score: ${context.score.home}-${context.score.away}, Possession: ${context.possession.home}% vs ${context.possession.away}%.${event ? ` Latest event: ${event.type} at ${event.minute}'.` : ''}`
    : `Match event at ${event?.minute ?? 0}'.`;

  const explanation = await chat(SMART_MODEL, system, user, { max_tokens: 200 });
  return NextResponse.json({ explanation });
}
