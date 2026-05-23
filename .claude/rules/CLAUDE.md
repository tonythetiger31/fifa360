# CLAUDE.md — FIFA 360 Matchday Companion
> Active development context file. Keep this open in every session. Update your module's section when you merge.

---

## 🧠 What Is FIFA 360?

FIFA 360 is a **mobile-first AI matchday companion** for the 2026 World Cup. It unifies three broken fan journeys into one:

1. **Find** — Smart venue discovery (where to watch)
2. **Get There** — Route planning + departure timing (how to arrive)
3. **Follow** — Live second-screen match experience (what's happening)
4. **Talk** — Live voice agent that calls the venue and books your spot

Positioned as a **"matchday operating system"** — not a single feature, but the connective tissue across the entire match day.

---

## 🏗️ Architecture Overview

```
[ Mobile Web App — React + Tailwind (PWA) ]
              |
              ▼
     [ Next.js API Routes ]
       (thin passthrough)
              |
    ┌─────────┴──────────┐
    ▼                    ▼
[ RocketRide ]      [ Vapi.ai ]
  Pipeline           Voice Agent
  Orchestration      Orchestration
    |                    |
    ▼                    ▼
[ GMI Cloud — NVIDIA H100/H200 ]
  ALL inference runs here
  ├── google/gemma-4-31b-it       (smart: tactics, narratives, RSVP voice brain, venue ranking)
  └── google/gemma-4-26b-a4b-it   (fast MoE 4B active: concierge chat, key moments, departure briefs)
              |
    ┌─────────┴──────────┐
    ▼                    ▼
[ MapKit JS ]      [ Vapi Telephony ]
  Routes             Twilio + Deepgram STT
  Geocoding          + ElevenLabs TTS
```

**The golden rule: ALL AI inference goes through GMI Cloud. RocketRide orchestrates pipelines. Vapi handles voice calls — powered by Gemma 4 on GMI as its brain.**

---

## 🔑 Environment Variables (.env.local)

```bash
# ─── GMI Cloud (ALL inference) ───────────────────────────────
GMI_API_KEY=                          # from console.gmicloud.ai
GMI_BASE_URL=https://api.gmi-serving.com/v1

# ─── Model names on GMI ──────────────────────────────────────
GMI_SMART_MODEL=google/gemma-4-31b-it
GMI_FAST_MODEL=google/gemma-4-26b-a4b-it
GMI_EMBED_MODEL=google/gemma-4-26b-a4b-it  # no dedicated embed model on GMI; ranking uses chat

# ─── RocketRide ──────────────────────────────────────────────
ROCKETRIDE_SERVER_URL=http://localhost:5565

# ─── Vapi (Voice Agent) ──────────────────────────────────────
VAPI_API_KEY=                         # from dashboard.vapi.ai
VAPI_PHONE_NUMBER_ID=                 # provisioned Twilio number in Vapi
VAPI_ASSISTANT_ID=                    # created once at setup, reused per call

# ─── MapKit JS ───────────────────────────────────────────────
MAPKIT_JS_TOKEN=

# ─── App ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

> ⚠️ **NO Anthropic key. NO OpenAI key. GMI Cloud IS the inference layer for everything.**

---

## 🤖 Model Routing Map

| Feature | Model | Why |
|---|---|---|
| Venue Concierge Chat | `gemma-4-26b-a4b-it` (FAST) via GMI | Conversational — latency matters more than depth; ~3-5s |
| Tactical Explainer | `gemma-4-31b-it` (SMART) via GMI | 3-level depth analysis; 256K context |
| Match Narrative | `gemma-4-31b-it` (SMART) via GMI | Rich storytelling, World Cup context |
| **Voice RSVP Agent** | **`gemma-4-31b-it` (SMART) via GMI** | **Vapi custom LLM → GMI endpoint** |
| Key Moment Descriptions | `gemma-4-26b-a4b-it` (FAST) via GMI | Quick event narration, ~1-2s |
| Departure Timing NL | `gemma-4-26b-a4b-it` (FAST) via GMI | Simple reasoning, ~3s |
| Venue Ranking | `gemma-4-31b-it` (SMART) via GMI | Chat-based scoring — no embedding model on GMI |

---

## 🔌 Shared GMI Client (`src/lib/gmi.ts`)

```typescript
import OpenAI from 'openai';

// GMI Cloud is OpenAI-compatible — one client for everything
export const gmi = new OpenAI({
  apiKey: process.env.GMI_API_KEY!,
  baseURL: process.env.GMI_BASE_URL!, // https://api.gmi-serving.com/v1
});

export const SMART_MODEL  = process.env.GMI_SMART_MODEL!; // gemma-4-31b-it
export const FAST_MODEL   = process.env.GMI_FAST_MODEL!;  // gemma-4-26b-a4b-it (MoE, 4B active)
export const EMBED_MODEL  = process.env.GMI_EMBED_MODEL!; // gemma-4-26b-a4b-it (no dedicated embed on GMI)

// Generic chat helper
export async function chat(
  model: string,
  system: string,
  user: string,
  opts?: { temperature?: number; max_tokens?: number }
) {
  const res = await gmi.chat.completions.create({
    model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    temperature: opts?.temperature ?? 0.7,
    max_tokens:  opts?.max_tokens  ?? 512,
  });
  return res.choices[0].message.content ?? '';
}

// Streaming helper (for concierge + voice passthrough)
export async function chatStream(model: string, messages: OpenAI.ChatCompletionMessageParam[]) {
  return gmi.chat.completions.create({ model, messages, stream: true });
}

// Embedding helper (for venue ranking)
export async function embed(text: string) {
  const res = await gmi.embeddings.create({ model: EMBED_MODEL, input: text });
  return res.data[0].embedding;
}
```

---

## 📁 Project Structure

```
fifa360/
├── CLAUDE.md                        ← YOU ARE HERE
├── PRD.md
├── .env.local
├── public/
│   ├── sw.js                        ← Service worker (Person B)
│   └── icon-192.png
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 ← Home screen
│   │   ├── venue/                   ← PERSON A
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── components/
│   │   ├── route/                   ← PERSON B
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   ├── live/                    ← PERSON C
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   └── profile/                 ← PERSON D
│   ├── api/
│   │   ├── venue/route.ts           ← Person A
│   │   ├── route-plan/route.ts      ← Person B
│   │   ├── route-plan/notify/route.ts ← Person B
│   │   ├── live/route.ts            ← Person C
│   │   ├── live/explain/route.ts    ← Person C
│   │   ├── concierge/route.ts       ← Person D
│   │   ├── voice/
│   │   │   ├── call/route.ts        ← Person D (Vapi outbound trigger)
│   │   │   ├── llm/route.ts         ← Person D (Vapi custom LLM webhook)
│   │   │   └── rsvp/route.ts        ← Person D (RSVP confirmation write)
│   │   └── profile/route.ts         ← Person D
│   ├── lib/
│   │   ├── gmi.ts                   ← shared GMI client (above)
│   │   ├── rocketride.ts            ← shared RR client
│   │   ├── mock-data.ts             ← ALL mock data
│   │   └── types.ts                 ← ALL shared types
│   ├── components/
│   │   ├── NavBar.tsx
│   │   ├── VenueCard.tsx
│   │   ├── MatchCard.tsx
│   │   └── VoiceCallModal.tsx       ← Person D
│   └── hooks/
│       ├── useNotifications.ts      ← Person B
│       ├── useLiveMatch.ts          ← Person C
│       └── useVoiceCall.ts          ← Person D
├── pipelines/
│   ├── venue-ranking.pipe           ← Person D
│   ├── departure-timing.pipe        ← Person D
│   ├── live-explain.pipe            ← Person D
│   └── rsvp-confirm.pipe            ← Person D
└── scripts/
    └── setup-vapi-assistant.ts      ← Person D (run once at event start)
```

---

## 📦 Shared Types (`src/lib/types.ts`)

> **Everyone imports from here. Never define types locally.**

```typescript
export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoffUTC: string;
  venue: string;
  city: string;
  stage: 'group' | 'r16' | 'qf' | 'sf' | 'final';
  status: 'upcoming' | 'live' | 'finished';
  score?: { home: number; away: number };
}

export interface Team {
  id: string;
  name: string;
  flag: string;
  primaryColor: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;               // required — needed for voice calls
  type: 'bar' | 'restaurant' | 'fan_zone' | 'stadium_adjacent';
  capacity: 'intimate' | 'medium' | 'large';
  atmosphere: 'casual' | 'lively' | 'electric';
  amenities: string[];
  rating: number;
  priceRange: 1 | 2 | 3;
  imageUrl?: string;
  aiRankScore?: number;
  aiRankReason?: string;
  rsvpAvailable: boolean;      // whether venue accepts RSVP via voice agent
}

export interface FanProfile {
  userId: string;
  favoriteTeams: string[];
  watchStyle: 'social' | 'focused' | 'family';
  budgetRange: 1 | 2 | 3;
  maxTravelMinutes: number;
  notificationsEnabled: boolean;
  departureAlertMinutes: number;
  name?: string;               // used by voice agent to introduce the caller
  partySize?: number;          // default party size for RSVP
}

export interface RoutePlan {
  venueId: string;
  matchId: string;
  departureTime: string;
  arrivalTime: string;
  mode: 'walking' | 'transit' | 'driving';
  steps: RouteStep[];
  shareUrl?: string;
  notificationScheduled: boolean;
}

export interface RouteStep {
  instruction: string;
  durationMinutes: number;
  mode: string;
}

export interface LiveMatchState {
  matchId: string;
  minute: number;
  score: { home: number; away: number };
  possession: { home: number; away: number };
  keyEvents: MatchEvent[];
  tacticalSummary?: string;
  narrativeMoment?: string;
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'var' | 'kickoff' | 'halftime' | 'fulltime';
  team: string;
  player?: string;
  description: string;
}

export interface ConciergeMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ─── Voice / RSVP ────────────────────────────────────────────

export type CallStatus =
  | 'idle'
  | 'initiating'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed';

export interface VoiceCallSession {
  callId: string;              // Vapi call ID
  venueId: string;
  matchId: string;
  fanProfile: FanProfile;
  status: CallStatus;
  transcript: TranscriptLine[];
  rsvpResult?: RsvpResult;
}

export interface TranscriptLine {
  role: 'agent' | 'venue';
  text: string;
  timestamp: string;
}

export interface RsvpResult {
  confirmed: boolean;
  partySize: number;
  arrivalTime: string;         // what the venue agreed to
  confirmationRef?: string;    // if venue gives a ref number
  notes?: string;              // special instructions (cover charge, etc.)
}
```

---

## 🔌 API Contracts

### Existing (unchanged)
- `GET /api/venue?matchId=&lat=&lng=` → `Venue[]`
- `POST /api/venue/rank` → `Venue[]` with scores
- `POST /api/route-plan` → `RoutePlan`
- `POST /api/route-plan/notify` → `{ scheduled: boolean }`
- `GET /api/live?matchId=` → `LiveMatchState`
- `POST /api/live/explain` → `{ explanation: string }`
- `POST /api/concierge` → `{ reply: string }`

### New — Voice Agent
- `POST /api/voice/call` → `{ callId: string, status: CallStatus }`
  - Body: `{ venueId, matchId, fanProfile }`
  - Triggers Vapi outbound call to `venue.phone`
  
- `POST /api/voice/llm` → streaming SSE (OpenAI-compatible)
  - **This is the Vapi custom LLM webhook** — Vapi sends conversation turns here
  - Endpoint proxies to `gemma-4-27b-it` on GMI Cloud with RSVP system prompt
  - Returns streaming chat completions back to Vapi
  - Handles tool calls: `confirm_rsvp`, `get_venue_details`, `get_match_info`

- `POST /api/voice/rsvp` → `{ success: boolean }`
  - Body: `RsvpResult & { venueId, matchId }`
  - Called by voice agent tool when RSVP is confirmed; persists to localStorage via response

---

## 🗣️ Voice Agent Architecture

```
User taps "Call & Book" in venue card
          |
          ▼
POST /api/voice/call
  → Vapi API: create outbound call
      phoneNumberId: VAPI_PHONE_NUMBER_ID
      customer: { number: venue.phone }
      assistant: {
        model: {
          provider: "custom-llm",
          url: "{APP_URL}/api/voice/llm",    ← our GMI proxy
          model: "google/gemma-4-31b-it"
        },
        voice: { provider: "elevenlabs", voiceId: "rachel" },
        transcriber: { provider: "deepgram", model: "nova-3" }
      }
          |
          ▼ Vapi dials venue.phone
          ▼ Venue picks up
          ▼ Deepgram transcribes venue speech → text
          ▼ POST to /api/voice/llm (our endpoint)
          ▼ We proxy to GMI: gemma-4-31b-it with RSVP system prompt
          ▼ Gemma responds (stream)
          ▼ Vapi converts response → speech via ElevenLabs
          ▼ Vapi speaks to venue
          ▼ Loop until RSVP confirmed or call ended
          ▼ On confirm_rsvp tool call → POST /api/voice/rsvp
          ▼ User sees live transcript + confirmation in VoiceCallModal
```

### Voice Agent System Prompt (in `/api/voice/llm`)
```
You are a friendly AI assistant calling on behalf of {fanName} to reserve a table
to watch the {homeTeam} vs {awayTeam} match (kickoff {kickoffTime}) on the big screen.
Party size: {partySize}. Requested arrival: {arrivalTime}.

Your goals:
1. Introduce yourself clearly as an AI assistant calling for {fanName}
2. Ask if they have availability on the big screen for the match
3. Negotiate party size and arrival time if needed
4. Confirm the reservation and ask for any reference number or special instructions
5. When confirmed, call the confirm_rsvp tool with the agreed details
6. Thank them and end the call politely

Be concise — you are on a live phone call. Keep turns short (1-3 sentences).
If they can't accommodate, thank them and end the call gracefully.
```

---

## 🔔 Notification System

Push notifications via Web Push API + service worker (`public/sw.js`).

```javascript
// public/sw.js — do not alter event listener structure
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    data: { url: data.url }
  });
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

Two notification types:
- **Departure Alert** at `kickoffTime - travelMin - 30min`
- **Key Moment** on goal/red card events (dispatched from Person C via CustomEvent)

---

## 🚦 Integration Checkpoints

| Person | Test | Pass criteria |
|---|---|---|
| A | Venue list + GMI ranking | `aiRankScore` populated, `aiRankReason` is one sentence |
| B | Route plan + notification fires | Push arrives within 10s of scheduled time (test with 30s delta) |
| C | Live state polls + explain returns | 3 explanation levels return different text |
| D | Concierge chat + voice call initiates + transcript appears | Vapi call starts, transcript streams to UI |

---

## 🎬 Demo Script (5 min)

```
00:00  Home screen — Brazil fan profile loaded
00:30  Tap "USA vs Brazil" → Venue Finder → "AI ranked these for you on GMI Cloud"
01:00  Tap top venue → Venue Card → show aiRankReason
01:20  Tap "Get There" → MapKit route, Claude departure brief
01:40  Enable notification → "You'll be alerted 60 min before kickoff"
02:00  Tap "📞 Call & Book" → VoiceCallModal opens, call initiates
02:15  Live transcript streams — agent introduces itself to venue
02:45  RSVP confirmed — show confirmation card with party size + ref
03:00  Switch to LIVE tab → mock match in progress
03:30  Goal event fires → key moment alert + tactical explainer
04:00  Toggle Casual → Analyst level — show depth difference
04:20  "All powered by Gemma 4 running on GMI Cloud H100s"
04:30  Wrap: Find. Get there. Book your spot. Follow it live.
```

---

## ⚠️ Rules of Engagement

- **ALL AI calls go to GMI Cloud.** No exceptions. No other inference providers.
- **Vapi custom LLM webhook proxies to GMI** — never call a different model in `/api/voice/llm`.
- **Never put API keys in frontend code.** All AI + Vapi calls go server-side.
- **All types from `src/lib/types.ts`.** No local type definitions.
- **Mobile-first.** Design for 390px width first.
- **Mock before you integrate.** Keep your module shippable at all times.
- **Commit prefix:** `[venue]`, `[route]`, `[live]`, `[voice]`, `[infra]`

---

## 🐛 Known Issues & Fixes (Session 2 — 2026-05-23)

### GMI model names
The original PRD used model names that don't exist on GMI Cloud. **Do not use the old names.**

| Old (wrong) | Correct |
|---|---|
| `google/gemma-4-27b-it` | `google/gemma-4-31b-it` |
| `google/gemma-4-e2b-it` | `google/gemma-4-26b-a4b-it` |
| `BAAI/bge-large-en-v1.5` | N/A — no embedding model on GMI; use chat-based ranking |

To check what models are available: `GET https://api.gmi-serving.com/v1/models` with your `GMI_API_KEY`.

### Concierge uses FAST model (not SMART)
`/api/concierge/route.ts` uses `FAST_MODEL` (`gemma-4-26b-a4b-it`). This is intentional — the full 31B model was 74s for a conversational UI; the MoE model is ~3-5s. Only tactical/narrative routes use `SMART_MODEL`.

### Route plan transit steps bug (fixed)
`buildSteps()` in `/api/route-plan/route.ts` used to compute the transit leg as `totalMin - 10`, which produced `durationMinutes: 0` for nearby venues (≤10 min total). Fixed: walk legs are now capped at `min(5, 20% of total)` each, and all legs have `Math.max(1, ...)` guards. Step durations always sum to `travelMinutes`.

### RocketRide fallback latency
When RocketRide isn't running, the SDK's TCP connection attempt blocks for ~20s before failing. `src/lib/rocketride.ts` wraps every call in a 3-second `Promise.race` timeout so the GMI fallback kicks in immediately. RocketRide pipelines in `pipelines/` are still correct and will be used automatically when the RocketRide server is running.

### next.config format
`next.config.ts` is not supported by Next.js 14.2.5. The file is `next.config.mjs` (ESM, `export default`).

### useSearchParams requires Suspense
Any page using `useSearchParams()` must be wrapped in `<Suspense>`. The three affected pages (`/venue`, `/route`, `/venue/[id]`) each export a `<Suspense>`-wrapped shell and extract the real component into an inner `*Content` function.
