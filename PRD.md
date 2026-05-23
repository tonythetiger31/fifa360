# FIFA 360 — Product Requirements Document
**Version:** 2.0 — Updated with GMI/Gemma stack + Voice RSVP Agent
**Date:** May 23, 2026 | **Team:** 4 Engineers
**Event:** GDG Newport Beach × RocketRide × GMI Cloud Hackathon
**Stack:** Next.js · RocketRide · GMI Cloud (Gemma 4) · Vapi · MapKit JS

---

## 1. Executive Summary

FIFA 360 is a mobile-first AI matchday companion for the 2026 World Cup. The fan matchday journey is fragmented across venue search, transport apps, live score apps, and phone calls to restaurants. FIFA 360 collapses this into a **matchday operating system** covering four phases:

**Find → Get There → Book Your Spot → Follow**

Every AI feature in FIFA 360 runs on **Google's Gemma 4 open model, served on GMI Cloud's NVIDIA H100/H200 GPUs**, orchestrated by **RocketRide** pipelines. This is the cleanest possible sponsor story: one inference stack, three sponsors, zero redundancy.

---

## 2. The Sponsor Story (Say This in the Demo)

> *"Every AI response you see — venue rankings, tactical explainers, the voice agent calling this restaurant right now — is Gemma 4, Google's latest open model, running live on GMI Cloud's H100s. RocketRide is the pipeline that wires it all together."*

| Sponsor | Role in Product |
|---|---|
| **GMI Cloud** | All inference: Gemma 4 27B (smart), Gemma 4 E2B (fast), BGE embeddings |
| **Google (Gemma 4)** | The model powering every AI feature including the voice agent brain |
| **RocketRide** | Pipeline orchestration: venue ranking, departure timing, live match, RSVP confirm |

---

## 3. Technical Architecture

```
┌──────────────────────────────────────────────────────────────┐
│           FIFA 360 — Mobile Web App (PWA)                    │
│        Next.js 14 · Tailwind · App Router · 390px first      │
└──────────┬───────────────────────────────────────────────────┘
           │  API Routes (/api/*)
     ┌─────┴──────────────────────────┐
     ▼                                ▼
[ RocketRide ]                   [ Vapi.ai ]
  Pipeline Runtime               Voice Orchestration
  venue-ranking.pipe               STT: Deepgram Nova-3
  departure-timing.pipe            TTS: ElevenLabs Rachel
  live-explain.pipe                Telephony: Twilio
  rsvp-confirm.pipe                Custom LLM → /api/voice/llm
     │                                ↓
     └──────────────┬─────────────────┘
                    ▼
        ┌───────────────────────┐
        │     GMI Cloud         │
        │  NVIDIA H100 / H200   │
        │                       │
        │ gemma-4-27b-it  ←─── Smart reasoning, conversation,
        │                       voice agent brain, tactics,
        │                       narratives, RSVP negotiation
        │                       
        │ gemma-4-e2b-it  ←─── Fast: key moments (<500ms),
        │                       departure briefings
        │                       
        │ BAAI/bge-large  ←─── Venue embedding + ranking
        │ -en-v1.5              
        └───────────────────────┘
                    │
         ┌──────────┴─────────┐
         ▼                    ▼
    [ MapKit JS ]      [ Web Push API ]
      Routes +          Push notifications
      Geocoding         via service worker
```

---

## 4. Model Routing — Complete Map

| Feature | Model | Tier | Approx latency |
|---|---|---|---|
| Venue Concierge Chat | `gemma-4-27b-it` | Smart | ~1.5s |
| Tactical Explainer (3 levels) | `gemma-4-27b-it` | Smart | ~1.5s |
| Match Narrative Generator | `gemma-4-27b-it` | Smart | ~2s |
| **Voice RSVP Agent Brain** | **`gemma-4-27b-it`** | **Smart** | **~800ms/turn** |
| Personalized Venue Rank Reason | `gemma-4-27b-it` | Smart | ~1s |
| Key Moment Descriptions | `gemma-4-e2b-it` | Fast | <400ms |
| Departure Timing Briefing | `gemma-4-e2b-it` | Fast | <400ms |
| Venue Semantic Embeddings | `BAAI/bge-large-en-v1.5` | Embed | <200ms |

All served via `https://api.gmi-serving.com/v1` — OpenAI-compatible, single client.

---

## 5. Feature Specifications

### Feature Group A — Venue Discovery (Person A)

#### A1. Smart Venue Finder
- Scrollable venue list filtered by match, atmosphere, budget, travel time
- Default sort: `aiRankScore` descending
- Filter chips: 🍺 Bar · 🍽️ Restaurant · 🏟️ Fan Zone · 💸 Budget · ⚡ Electric

#### A2. Personalized Venue Ranking
**RocketRide Pipeline: `venue-ranking.pipe`**

```
[webhook_source] → [embed_profile: GMI/BAAI/bge-large-en-v1.5]
                → [embed_venues:  GMI/BAAI/bge-large-en-v1.5]
                → [cosine_rank]
                → [llm_reason: GMI/gemma-4-27b-it]
                → [http_sink: /api/venue/rank/callback]
```

- `aiRankScore` (0–1) from cosine similarity
- `aiRankReason` (1 sentence): *"Best Brazil crowd energy in the Mission, big screen confirmed."*

#### A3. Venue Profile Card
- Full detail: name, address, photo, amenities chips, rank reason, rating, price
- CTAs: **"Get Directions"** → route module | **"Ask Concierge"** → chat | **"📞 Call & Book"** → voice agent
- `rsvpAvailable` badge shown when venue accepts voice booking

---

### Feature Group B — Transportation & Timing (Person B)

#### B1. Matchday Route Planner
- MapKit JS Directions for walk / transit / drive
- Departure time = `kickoffTime - travelDuration - 30min buffer`
- Map view + step-by-step list

#### B2. Departure Timing Assistant
**RocketRide Pipeline: `departure-timing.pipe`**

```
[webhook_source]
  → [llm: GMI/gemma-4-e2b-it, prompt: departure_briefing_template]
  → [http_sink: response]
```

Output example: *"Leave by 6:15 PM. F-Train from Market St, 22 min ride — drops you right there. Big match, expect crowds. Give yourself the buffer."*

#### B3. Push Notifications
- Web Push API + service worker (`public/sw.js`)
- **Departure Alert**: fires at `kickoffTime - travelMin - 30min`
  - `"Time to leave for Murphy's! ⚽ Kick off in 52 min."`
- **Key Moment Alert**: dispatched from Person C via `CustomEvent('key-moment')`
  - `"GOAL! Vinicius Jr scores for Brazil ⚽ 67' — 2-1"`
- **RSVP Confirmed Alert**: dispatched from Person D voice module
  - `"✅ Table booked at Murphy's! Party of 3 confirmed."`

#### B4. Share Plan Link
- Web Share API → `{APP_URL}/route/share?v={venueId}&m={matchId}&mode={mode}`

---

### Feature Group C — Live Match Experience (Person C)

#### C1. Live Dashboard
- Poll `GET /api/live?matchId=` every 10 seconds
- Live score, match minute, possession bar, pulsing LIVE badge

#### C2. Key Moment Timeline
**RocketRide Pipeline: `live-explain.pipe`**

```
[webhook_source: {event, match_context}]
  → [llm: GMI/gemma-4-e2b-it, prompt: event_description_template]
  → [http_sink: description]
```

Prompt template:
```
Describe this football event in 1-2 vivid sentences for a casual fan.
Event: {type} by {player} for {team} at minute {minute}.
Score: {homeTeam} {homeScore} – {awayScore} {awayTeam}.
Be specific, exciting, but brief.
```

#### C3. Plain-English Tactical Explainer
Three levels via toggle chip — all through `gemma-4-27b-it` on GMI:

```
Casual:      "Brazil just dropped into a defensive shell — they're protecting the lead."
Enthusiast:  "4-4-2 low block, Tite packing the midfield to cut passing lanes to Kane."
Analyst:     "Compact mid-block phase, narrow striker pair to deny central progression.
              France forced wide where Brazil's fullbacks hold positional discipline."
```

`POST /api/live/explain` body: `{ event, context: LiveMatchState, level: 'casual'|'enthusiast'|'analyst' }`

#### C4. Match Summary (Between Matches)
- Completed match: score, event log with timestamps, Gemma-generated 3–4 sentence narrative
- Next match: countdown timer + team context card

---

### Feature Group D — Orchestration, Profile, Concierge & Voice (Person D)

#### D1. Fan Profile (Onboarding)
- Step 1: team selection (flag grid, multi-select, tap to pick up to 3)
- Step 2: watch style, budget slider (1–3), max travel time, notification toggle, departure alert timing, **name + default party size** (for voice RSVP)
- Stored in localStorage as `FanProfile`
- `useProfile()` hook — import everywhere

#### D2. Venue Concierge Chat
- Multi-turn chat, `gemma-4-27b-it` on GMI, full message history passed each call
- Pre-loaded with venue context on open
- Example: *"Can I get there by BART?"* → Gemma reasons from venue address + route data

#### D3. 📞 Voice RSVP Agent — NEW FEATURE

**User Flow:**
1. User taps **"📞 Call & Book"** on venue card
2. `VoiceCallModal` opens — shows venue name, match, party size (from profile)
3. User confirms → `POST /api/voice/call` fires
4. Vapi initiates outbound call to `venue.phone`
5. Modal shows live transcript as call progresses
6. On RSVP confirmed: confirmation card slides in with details

**Vapi Configuration (run `scripts/setup-vapi-assistant.ts` once at event start):**
```typescript
const assistant = await vapi.assistants.create({
  name: 'FIFA360 Venue Booker',
  model: {
    provider: 'custom-llm',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/llm`,
    model: 'google/gemma-4-27b-it',
  },
  voice: {
    provider: 'elevenlabs',
    voiceId: 'rachel',          // warm, professional female voice
  },
  transcriber: {
    provider: 'deepgram',
    model: 'nova-3',
    language: 'en-US',
  },
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 180,      // 3-min call max
  endCallFunctionEnabled: true,
});
```

**`/api/voice/llm` — Vapi Custom LLM Webhook:**
```typescript
// POST handler — Vapi sends conversation turns here
// We proxy to GMI, stream back to Vapi
export async function POST(req: Request) {
  const body = await req.json();
  // body.messages contains conversation so far
  // body.call.metadata contains { venueId, matchId, fanProfile }

  const { venueId, matchId, fanProfile } = body.call.metadata;
  const venue   = MOCK_VENUES.find(v => v.id === venueId)!;
  const match   = MOCK_MATCHES.find(m => m.id === matchId)!;

  const system = buildRsvpSystemPrompt(venue, match, fanProfile);

  const stream = await gmi.chat.completions.create({
    model: SMART_MODEL,
    messages: [{ role: 'system', content: system }, ...body.messages],
    stream: true,
    tools: [confirmRsvpTool, endCallTool],   // Gemma function calling
  });

  // Stream back as SSE — Vapi reads this and speaks it
  return streamToResponse(stream);
}
```

**Tool: `confirm_rsvp`**
```typescript
const confirmRsvpTool = {
  type: 'function',
  function: {
    name: 'confirm_rsvp',
    description: 'Call when the venue verbally confirms the reservation',
    parameters: {
      type: 'object',
      properties: {
        confirmed:        { type: 'boolean' },
        partySize:        { type: 'number' },
        arrivalTime:      { type: 'string' },
        confirmationRef:  { type: 'string' },
        notes:            { type: 'string' },
      },
      required: ['confirmed', 'partySize', 'arrivalTime'],
    },
  },
};
```

When `confirm_rsvp` fires:
- `POST /api/voice/rsvp` saves `RsvpResult` 
- Dispatches `CustomEvent('rsvp-confirmed')` → picked up by `VoiceCallModal` + Person B (notification)

**`VoiceCallModal` UI states:**
```
idle        → "Call Murphy's Bar to book your spot for Brazil vs USA?"
initiating  → [spinner] "Connecting..."
ringing     → "Calling Murphy's Bar... ☎️"
in-progress → [live transcript scrolling, two-column: Agent | Venue]
completed   → [green card] "✅ Table confirmed! Party of 3 · 6:30 PM arrival · Ref: #4821"
failed      → [red card] "Couldn't reach the venue. Try calling directly: 415-555-0142"
```

#### D4. RocketRide Pipelines (all 4)
- `venue-ranking.pipe` — (see A2)
- `departure-timing.pipe` — (see B2)  
- `live-explain.pipe` — (see C2)
- `rsvp-confirm.pipe` — triggered on tool call, writes confirmation, triggers push notification

#### D5. Shared Infrastructure (Build Hour 1 — BLOCKS EVERYONE)
1. `src/lib/types.ts` — all types
2. `src/lib/mock-data.ts` — 3 matches (1 live, 1 upcoming, 1 finished), 6–8 venues with `phone` + `rsvpAvailable`, 1 demo profile
3. `src/lib/gmi.ts` — GMI client (see CLAUDE.md)
4. `src/lib/rocketride.ts` — RocketRide HTTP client
5. `src/components/NavBar.tsx` — bottom nav (Home · Venues · Live · Profile)
6. `src/app/layout.tsx` — root layout
7. `.env.local` — all env vars seeded
8. `scripts/setup-vapi-assistant.ts` — run once to create the Vapi assistant, log the ID

**Post to team chat immediately when done. Everyone else mocks until this lands.**

---

## 6. Team Task Assignments

### 👤 Person A — Venue Discovery
**Owns:** `src/app/venue/` · `src/api/venue/`

**One-Shot Prompt:**
```
Build the FIFA 360 Venue Discovery module. Read CLAUDE.md fully first.
Module: /src/app/venue/ and /src/api/venue/route.ts
Implement:
  A1 — Venue list with filter chips (atmosphere, price, capacity)
  A2 — Venue ranking: POST /api/venue/rank calls RocketRide venue-ranking.pipe,
       which uses GMI BAAI/bge-large-en-v1.5 for embeddings and
       gemma-4-27b-it for the aiRankReason one-liner.
       Fallback: call gmi.ts embed() + gmi.ts chat() directly if RR isn't ready.
  A3 — Venue card with full details + 3 CTAs:
       "Get Directions" → /route?venueId=&matchId=
       "Ask Concierge" → /venue/[id]/concierge (text chat)
       "📞 Call & Book" → dispatch CustomEvent('open-voice-modal', {venueId, matchId})
         (VoiceCallModal is a global modal Person D owns — just fire the event)
All types from src/lib/types.ts. All mock data from src/lib/mock-data.ts.
Mobile-first, Tailwind only. Show rsvpAvailable badge on eligible venues.
```

**Done when:**
- [ ] Venue list renders, filters work
- [ ] `aiRankScore` + `aiRankReason` populated on load
- [ ] Venue card shows all three CTAs
- [ ] "📞 Call & Book" fires CustomEvent correctly

---

### 👤 Person B — Transportation & Notifications
**Owns:** `src/app/route/` · `src/api/route-plan/` · `public/sw.js` · `src/hooks/useNotifications.ts`

**One-Shot Prompt:**
```
Build the FIFA 360 Route Planning and Notification module. Read CLAUDE.md fully first.
Module: /src/app/route/ and /src/api/route-plan/route.ts
Implement:
  B1 — MapKit JS route (MAPKIT_JS_TOKEN from env), 3 mode tabs (walk/transit/drive),
       map embed + step list. Accept venueId + matchId as URL params.
  B2 — Departure briefing: POST /api/route-plan calls RocketRide departure-timing.pipe
       (GMI gemma-4-e2b-it). Fallback: call gmi.ts chat() with FAST_MODEL directly.
       Show briefing text below the map.
  B3 — Notifications: request permission on "Save Plan", subscribe, store in localStorage.
       Schedule departure alert via setTimeout (delayMs from kickoffTime - travel - 30min).
       Also listen for CustomEvent('key-moment') and CustomEvent('rsvp-confirmed')
       and fire push for both.
  B4 — Share: Web Share API with base64-encoded plan URL.
All types from src/lib/types.ts. Notification payloads per CLAUDE.md spec.
```

**Done when:**
- [ ] Route renders on map with steps
- [ ] Mode tabs switch
- [ ] Departure briefing text shows (Gemma on GMI)
- [ ] Notification fires within 30s of scheduled time (test with small delta)
- [ ] RSVP notification fires on `rsvp-confirmed` event
- [ ] Share URL works

---

### 👤 Person C — Live Match Experience
**Owns:** `src/app/live/` · `src/api/live/` · `src/hooks/useLiveMatch.ts`

**One-Shot Prompt:**
```
Build the FIFA 360 Live Match Experience. Read CLAUDE.md fully first.
Module: /src/app/live/ and /src/api/live/route.ts
Implement:
  C1 — Live dashboard: poll GET /api/live?matchId= every 10s. Show score, minute,
       possession bar, pulsing LIVE badge. Countdown when no live match.
  C2 — Key moment timeline: events with icons (⚽🟨🟥🔄🎬). Each event description
       generated by gemma-4-e2b-it via GMI (FAST_MODEL). Animate new events in from top.
       When a goal event is added, dispatch CustomEvent('key-moment', {detail: event}).
  C3 — Tactical explainer: 3 toggle chips (Casual / Enthusiast / Analyst).
       POST /api/live/explain → gemma-4-27b-it (SMART_MODEL) via GMI.
       Button on each event + floating "Tactics" button.
  C4 — Match summary for finished match: score, event log, Gemma narrative (3-4 sentences).
       Next match countdown card.
Simulate live match with setInterval — add events over time (pre-script 6 events including 1 goal).
All types from src/lib/types.ts.
```

**Done when:**
- [ ] Score + minute update on poll
- [ ] Events animate in with icons + Gemma descriptions
- [ ] Tactical explainer returns 3 distinct texts for 3 levels
- [ ] Match summary renders for finished match
- [ ] CustomEvent('key-moment') fires on goal

---

### 👤 Person D — Infra, Profile, Concierge & Voice Agent
**Owns:** `src/lib/*` · `src/api/concierge/` · `src/api/voice/*` · `src/app/profile/` · `pipelines/` · `src/components/VoiceCallModal.tsx` · `scripts/`

**One-Shot Prompt:**
```
Build FIFA 360 core infrastructure AND the voice RSVP agent. Read CLAUDE.md fully first.
This is split into two phases:

PHASE 1 — Do this first, announce to team when done:
  - src/lib/types.ts: all types from CLAUDE.md spec, no additions or removals
  - src/lib/mock-data.ts: MOCK_MATCHES (3), MOCK_VENUES (6-8 SF venues with phone numbers
    and rsvpAvailable: true on at least 3), DEMO_PROFILE (Brazil fan, SF, party of 3)
  - src/lib/gmi.ts: GMI client exactly as in CLAUDE.md
  - src/lib/rocketride.ts: HTTP client that POSTs to ROCKETRIDE_SERVER_URL/execute/{pipeline}
  - src/components/NavBar.tsx: bottom nav 4 tabs
  - src/app/layout.tsx: root layout with NavBar, listen for CustomEvent('open-voice-modal')
    and render VoiceCallModal when received
  - .env.local: all vars from CLAUDE.md seeded (empty values OK for now)

PHASE 2 — Voice Agent:
  - scripts/setup-vapi-assistant.ts: creates Vapi assistant with custom LLM URL pointing
    to /api/voice/llm, ElevenLabs TTS, Deepgram STT. Log and save assistant ID to .env.
  - /api/voice/call/route.ts: receives {venueId, matchId, fanProfile}, calls Vapi API
    to create outbound call with assistant ID + customer phone from MOCK_VENUES +
    metadata: {venueId, matchId, fanProfile}. Returns {callId, status}.
  - /api/voice/llm/route.ts: Vapi custom LLM webhook. Receives Vapi messages array,
    builds RSVP system prompt from metadata (venue/match/fan), proxies streaming request
    to GMI gemma-4-27b-it with confirm_rsvp and end_call tools. Streams SSE back to Vapi.
  - /api/voice/rsvp/route.ts: receives RsvpResult, returns success. Client polls
    call status and reads rsvpResult from response.
  - src/components/VoiceCallModal.tsx: modal with 6 states per CLAUDE.md.
    Shows live transcript. On confirmed: green card with RsvpResult details.
    On completed: dispatch CustomEvent('rsvp-confirmed', {detail: rsvpResult}).
  - src/hooks/useVoiceCall.ts: manages call state, polls /api/voice/call?callId=,
    updates transcript, handles rsvpResult.
  - 4 RocketRide .pipe files per PRD specs.
  - Profile onboarding: 2-step form, localStorage persistence, useProfile() hook.
```

**Done when:**
- [ ] Phase 1 announced and pushed — no TypeScript errors
- [ ] Vapi assistant created (`VAPI_ASSISTANT_ID` in .env)
- [ ] "📞 Call & Book" → modal opens → call initiates (Vapi dashboard shows call)
- [ ] Transcript streams into modal in real time
- [ ] RSVP confirmed → confirmation card appears
- [ ] `rsvp-confirmed` CustomEvent fires (Person B picks this up)
- [ ] All 4 RocketRide pipelines execute without error
- [ ] Profile saves and `useProfile()` returns correct data

---

## 7. Non-Goals (Explicit Cuts)

- Real match data API (mock with scripted progression)
- User accounts / backend auth (localStorage only)
- Actual Twilio billing / production phone numbers (Vapi trial number fine for demo)
- Multilingual voice (English only for demo)
- Multiple simultaneous live matches
- Gemini / Google AI Studio in any live call path

---

## 8. Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Vapi call doesn't connect in demo | Medium | Pre-test with venue phone number; have transcript screenshot as backup |
| GMI rate limit on H100s | Low | Free credits provided; cache embedding results |
| Gemma 4 tool calling not working | Medium | Test `confirm_rsvp` tool call early; fallback to regex parse if needed |
| RocketRide pipeline fails | Medium | Direct `gmi.ts` fallback for all pipeline features |
| MapKit JWT expires | Low | Pre-generate token with 24h TTL |
| Notification doesn't fire | Medium | Demo with 2-min delta; show permission screen as proof point |
| Voice latency too high | Medium | Use `gemma-4-e2b-it` as fallback fast model for voice if 27B is slow |

---

## 9. Demo Day Runbook

```
T-60min  Seed mock data, run setup-vapi-assistant.ts, save VAPI_ASSISTANT_ID
T-45min  Test full voice call with a real phone number (team member's phone)
T-30min  Verify all 4 modules load, no console errors
T-20min  Run complete demo flow once end-to-end
T-10min  Set notification delta to 2 min, set live match events to animate every 30s
T-5min   Open app on phone, screen share ready, Vapi dashboard open in background tab

DEMO BEATS — must land in order:
  1. Venue finder loads with AI rank scores and reasons (say "Gemma 4 on GMI ranked these")
  2. Tap venue card — show rsvpAvailable badge
  3. "Get Directions" → MapKit route appears, departure brief renders
  4. Notification scheduled — show permission + toast confirmation
  5. Tap "📞 Call & Book" → modal opens → call ringing
  6. Live transcript streams — agent introduces itself to venue
  7. RSVP confirms — green confirmation card with party size
  8. RSVP push notification fires on Person B's handler
  9. Switch to LIVE → key moment fires → tactical explainer
 10. Toggle Casual → Analyst — show depth difference
 11. Close: "Gemma 4. GMI Cloud. RocketRide. One matchday OS."
```

---

## 10. Shared Utilities — Build Order (Person D, Hour 1)

```
Priority 1 (blocks everyone):
  types.ts · mock-data.ts · gmi.ts · rocketride.ts

Priority 2 (blocks routing):
  NavBar.tsx · layout.tsx · profile onboarding

Priority 3 (D's own features):
  setup-vapi-assistant.ts → run it → save ID
  /api/voice/* routes
  VoiceCallModal.tsx
  4 × .pipe files
```

---

*PRD v2.0 — Gemma 4 on GMI Cloud · Vapi Voice RSVP · RocketRide Pipelines*
*All AI inference through GMI. All orchestration through RocketRide. One clean story.*
