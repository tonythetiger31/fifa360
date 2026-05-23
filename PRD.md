# FIFA 360 — Product Requirements Document
**Version:** 1.0 — Hackathon Build  
**Date:** May 23, 2026  
**Team:** 4 Engineers  
**Event:** GDG Newport Beach × RocketRide × GMI Cloud Hackathon  
**Stack:** Next.js · RocketRide · GMI Cloud · Anthropic (Claude) · MapKit JS

---

## 1. Executive Summary

FIFA 360 is a mobile-first AI matchday companion for the 2026 World Cup. The fan matchday journey is currently fragmented across five or more disconnected tools: Google Maps, Yelp, a sports app, a transit app, and social media. FIFA 360 collapses this into a single **matchday operating system** covering the three phases of every fan's game day: **Find → Get There → Follow**.

The MVP is scoped for a 6-hour hackathon build and a 3-minute live demo. Every feature decision prioritizes demo clarity and technical novelty over completeness.

---

## 2. Problem Statement

| Fan Job | Current Reality | Pain |
|---|---|---|
| Find a venue | Google + Yelp + friend group chat | No context for match atmosphere, team loyalty, real-time crowd |
| Get there on time | Google Maps doesn't know kickoff time | Fans arrive late, miss kickoff, get stuck in crowds |
| Follow the match | Second-screen is 3 separate apps | Context switching kills immersion; tactics are opaque |

**The insight:** All three jobs share the same data (match, location, fan preference) but no product has unified them. FIFA 360 is the connective tissue.

---

## 3. Goals

### Primary (Hackathon)
- Build a working demo that flows naturally through all three phases in under 5 minutes
- Demonstrate meaningful AI output from Claude + GMI Cloud in the live flow
- Show RocketRide as the orchestration backbone, not an afterthought

### Secondary (Post-Hackathon, if continued)
- Venue selection rate > 60% of sessions
- Route plan starts > 40% of venue selections
- Live tab engagement > 3 minutes per session during match windows

---

## 4. Success Metrics (Demo Day)

| Signal | Bar |
|---|---|
| Demo flows without error | Required |
| AI output is visibly personalized | Required |
| All 3 sponsor tools appear in demo | Required |
| Judge can understand value in 30 seconds | Required |
| Judges ask follow-up questions | Target |

---

## 5. Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│              FIFA 360 — Mobile Web App                  │
│         Next.js 14 · App Router · Tailwind CSS          │
│         Mobile-first (390px) · PWA-enabled              │
└──────────────────┬──────────────────────────────────────┘
                   │  API Routes (/api/*)
        ┌──────────┼──────────────┐
        ▼          ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐
│Anthropic │ │GMI Cloud │ │  MapKit JS   │
│  Claude  │ │  NVIDIA  │ │  (Apple)     │
│          │ │  H100s   │ │              │
│ Sonnet   │ │ Embed +  │ │ Routes +     │
│ (agents) │ │ Ranking  │ │ Geocoding    │
│ Haiku    │ │ models   │ │              │
│ (live)   │ │          │ │              │
└──────────┘ └──────────┘ └──────────────┘
        │          │
        └────┬─────┘
             ▼
    ┌─────────────────┐
    │   RocketRide    │
    │  Pipeline Layer │
    │                 │
    │ venue-ranking   │
    │ concierge       │
    │ live-match      │
    └─────────────────┘
```

### Model Routing (Live Demo — Enforced)

| Feature | Model | Provider | Rationale |
|---|---|---|---|
| Venue Concierge | `claude-sonnet-4-20250514` | Anthropic | Tool use, multi-turn conversation |
| Tactical Explainer | `claude-sonnet-4-20250514` | Anthropic | Nuanced reasoning, multi-level output |
| Key Moment Descriptions | `claude-haiku-4-5-20251001` | Anthropic | <500ms latency for live feel |
| Departure Timing NL | `claude-haiku-4-5-20251001` | Anthropic | Simple reasoning, fast |
| Venue Semantic Ranking | `BAAI/bge-large-en-v1.5` | GMI Cloud | Embedding similarity, GPU-accelerated |
| Fan Preference Summary | `claude-sonnet-4-20250514` | Anthropic | Personalization quality |
| Match Narrative | `claude-sonnet-4-20250514` | Anthropic | Rich storytelling |

> ⛔ Gemini / Google AI Studio must NOT appear in the live demo API flow. It is used for development reference only.

---

## 6. Feature Specifications

### Feature Group A — Venue Discovery (Person A)

#### A1. Smart Venue Finder
- Displays a scrollable list of venues for a selected upcoming match
- Filters: atmosphere (casual → electric), capacity, price range, max travel time
- Each venue shows: name, type badge, distance, price range, AI rank score
- Default sort: AI rank score descending
- **Model:** GMI Cloud embeddings rank venues by semantic similarity to fan profile → Claude Haiku generates one-line rank reason

#### A2. Personalized Venue Ranking
- On page load, `POST /api/venue/rank` is called with fan profile + venue list
- RocketRide pipeline: `[fan_profile_node] → [embed_node(GMI)] → [rank_node] → [reason_node(Claude Haiku)]`
- Returns `aiRankScore` (0–1) and `aiRankReason` (1 sentence max)
- Ranking factors: atmosphere match, budget fit, travel time, team loyalty alignment

**RocketRide Pipeline: `venue-ranking.pipe`**
```json
{
  "nodes": [
    { "id": "input", "type": "source", "schema": "VenueRankRequest" },
    { "id": "embed_profile", "type": "llm_embed", "provider": "gmi", "model": "BAAI/bge-large-en-v1.5" },
    { "id": "embed_venues", "type": "llm_embed", "provider": "gmi", "model": "BAAI/bge-large-en-v1.5" },
    { "id": "score", "type": "cosine_similarity", "inputs": ["embed_profile", "embed_venues"] },
    { "id": "reason", "type": "llm", "provider": "anthropic", "model": "claude-haiku-4-5-20251001",
      "prompt": "In one sentence, explain why this venue matches this fan's profile: {profile} → {venue}" },
    { "id": "output", "type": "sink", "schema": "RankedVenueList" }
  ]
}
```

#### A3. Venue Profile Card
- Full card view on tap: name, address, photo, amenities chips, AI rank reason
- "Get Directions" CTA → hands off `venueId` to Route module (Person B)
- "Ask Concierge" CTA → opens concierge chat with venue context pre-loaded (Person D)
- Rating, price range, atmosphere badge, capacity indicator

---

### Feature Group B — Transportation & Timing (Person B)

#### B1. Matchday Route Planner
- Accepts: user current location (browser geolocation), selected venue, selected match
- Calls MapKit JS Directions API for walking, transit, and driving options
- Displays: step-by-step route, total duration, departure time recommendation
- Departure time = `kickoffTime - travelDuration - 30min buffer`
- Three mode tabs: 🚶 Walk · 🚌 Transit · 🚗 Drive
- Map view embedded via MapKit JS

#### B2. Departure Timing Assistant
- Claude Haiku generates a natural language departure briefing:
  > *"Leave by 6:15 PM. It's a 22-minute transit ride — the F-Train from Market St drops you right at the venue. Big match, expect crowds near the stadium. Give yourself the extra buffer."*
- Prompt template (do not alter without updating CLAUDE.md):
  ```
  You are a helpful matchday assistant. Generate a friendly 2-3 sentence departure briefing.
  Match: {homeTeam} vs {awayTeam} at {kickoffTime}
  Venue: {venueName} ({venueAddress})
  Route: {mode}, {durationMinutes} minutes
  Buffer: 30 minutes recommended
  Keep it conversational, specific, and action-oriented.
  ```
- Model: `claude-haiku-4-5-20251001`

#### B3. Key Moments Push Notifications
- User grants notification permission during route plan confirmation
- Service worker (`public/sw.js`) handles push events
- Two notification types:
  - **Departure Alert**: fires at `kickoffTime - travelMinutes - 30min`
    - Title: `"Time to leave for {venueName}! ⚽"`
    - Body: `"Kick off in {N} min. Tap for your route."`
    - Action URL: `/route/{routePlanId}`
  - **Key Moment Alert**: fires when a goal/red card event is added to LiveMatchState (Person C triggers this)
    - Title: `"GOAL! {player} scores for {team} ⚽"`
    - Body: `"{minute}' — {description}"`
    - Action URL: `/live/{matchId}`

**Notification Scheduling:**
```typescript
// POST /api/route-plan/notify
// Calculates delay in ms, uses setTimeout for hackathon simplicity
// Production: use a job queue (BullMQ, etc.)
const delayMs = new Date(departureAlertTime).getTime() - Date.now();
setTimeout(() => sendPushNotification(subscription, payload), delayMs);
```

#### B4. Share Plan Link
- Generates a shareable URL: `/route/share?venue={id}&match={id}&mode={mode}`
- Contains full route plan encoded as base64 query param
- Share sheet via native Web Share API (`navigator.share`)

---

### Feature Group C — Live Match Experience (Person C)

#### C1. Live Match Dashboard
- Polling: `GET /api/live?matchId=` every 10 seconds
- Displays: live score, match minute, possession bar, match status indicator
- Pulsing "LIVE" badge when `status === 'live'`
- Next match countdown when no live match: `"Brazil vs Germany kicks off in 2h 34m"`

#### C2. Key Moment Timeline
- Vertical event timeline, newest events at top
- Event types with icons:
  - ⚽ Goal · 🟨 Yellow · 🟥 Red · 🔄 Sub · 🎬 VAR · 🏁 KO · ⏱ HT · ✅ FT
- Each event has a Claude-generated `description` (plain English, 1–2 sentences)
- Events generated by mocking then fed through Claude Haiku for natural language
- **Generation prompt:**
  ```
  Describe this football match event in 1-2 plain English sentences for a casual fan.
  Be vivid but concise. Event: {type} by {player} for {team} at minute {minute}.
  Current score: {homeTeam} {homeScore} - {awayScore} {awayTeam}.
  ```

#### C3. Plain-English Tactical Explainer
- Triggered by tapping any key moment, or a "Tactics" floating button
- Three explanation levels (togglable chip):
  - **Casual**: "Brazil just switched to defending deep — they're trying to protect the lead."
  - **Enthusiast**: "Tite shifted to a 4-4-2 low block. The midfield is now sitting in front of the defensive line."
  - **Analyst**: "Compactness in mid-block phase, forcing France wide. Note the narrow striker positioning to cut passing lanes."
- Model: `claude-sonnet-4-20250514`
- **Prompt:**
  ```
  You are a football tactical analyst. Explain the following match situation for a {level} audience.
  Keep it to 2-3 sentences max. Do not use jargon for 'casual'. Use precise terms for 'analyst'.
  Situation: {tacticalContext}
  Recent events: {last3Events}
  ```

#### C4. Match Summary (Between Matches)
- When no live match: show summary of most recent completed match
- Sections: Final score · Key moments log with timestamps · Claude-generated match narrative (3–4 sentences)
- Narrative prompt targets emotional storytelling: lead, turning point, hero moment, final result

---

### Feature Group D — Orchestration, Profile & Concierge (Person D)

#### D1. Basic Fan Profile
- Onboarding screen (step 1 of 2 on first launch)
- Fields: favorite team(s) (multi-select flag grid), watch style, budget, max travel time, notification preference, departure alert timing (default: 60 min before kickoff)
- Stored in localStorage as `FanProfile` object
- Exposes `useProfile()` hook — all modules import from here

#### D2. Venue Concierge Agent
- Chat interface accessible from Venue Profile Card (CTA button)
- Pre-loads venue context: `"You're asking about {venueName}"`
- Multi-turn conversation using full message history
- Claude Sonnet with tool use — available tools:
  - `get_venue_details(venueId)` → returns full Venue object
  - `get_route_to_venue(venueId)` → returns RoutePlan
  - `get_match_info(matchId)` → returns Match object
- Example interactions:
  - *"Is it loud there?"* → "Murphy's is known for an electric atmosphere — packed for big matches, standing room only."
  - *"Can I get there from Caltrain?"* → invokes `get_route_to_venue`, returns transit directions
  - *"What time should I leave?"* → calculates and responds conversationally
- Agent system prompt (in `src/api/concierge/route.ts`):
  ```
  You are FIFA 360's matchday concierge. You help fans plan their World Cup match day.
  You have access to venue details, routes, and match information via tools.
  Be friendly, specific, and helpful. Keep responses under 3 sentences unless the user asks for more.
  Current fan profile: {fanProfile}
  Current venue context: {venueId}
  ```

#### D3. RocketRide Pipeline Configuration
- Responsible for all `.pipe` files in `/pipelines/`
- Three pipelines to build and test:
  1. `venue-ranking.pipe` — (spec in Feature A2)
  2. `concierge.pipe` — routes messages through Claude Sonnet with tool use
  3. `live-match.pipe` — ingests mock event stream, fans out to Haiku for descriptions
- Exposes RocketRide pipeline execution via `src/lib/rocketride.ts`
- Validates all three pipelines execute before demo

#### D4. Team-Based Watch Destination Recommendations
- On home screen: "Watching {team}? Try these spots"
- Uses fan profile `favoriteTeams` → filters venues by `atmosphere` and pre-tags venues with supported teams
- AI-generated one-liner: "The best Brazil crowd in the city."
- Simple rule-based filter + Claude Haiku one-liner per venue

---

## 7. Team Task Assignments

> Each person can build their module completely independently. Integration happens via the shared API contracts in CLAUDE.md. Mock any dependency that isn't yours.

---

### 👤 Person A — Venue Discovery

**Owns:** `src/app/venue/`, `src/api/venue/`

**One-Shot Prompt:**
```
Build the FIFA 360 Venue Discovery module as described in the PRD.
Read CLAUDE.md fully before writing any code.
Your module: /src/app/venue/ and /src/api/venue/route.ts
Use mock data from src/lib/mock-data.ts.
Implement A1 (venue list + filters), A2 (ranking via GMI Cloud embed + Claude Haiku reason), A3 (venue card).
The ranking pipeline calls GMI Cloud at GMI_BASE_URL with BAAI/bge-large-en-v1.5 for embeddings.
Claude Haiku generates the aiRankReason.
All types from src/lib/types.ts. Mobile-first. Tailwind only.
Expose "Get Directions" button that routes to /route?venueId={id}&matchId={id}.
Expose "Ask Concierge" button that routes to /venue/{id}/concierge.
```

**Completion criteria:**
- [ ] Venue list renders from mock data
- [ ] Filter chips update results
- [ ] Ranking API populates `aiRankScore` and `aiRankReason`
- [ ] Venue card opens with full details
- [ ] Both CTAs route correctly

---

### 👤 Person B — Transportation & Notifications

**Owns:** `src/app/route/`, `src/api/route-plan/`, `public/sw.js`, `src/hooks/useNotifications.ts`

**One-Shot Prompt:**
```
Build the FIFA 360 Route Planning and Notification module as described in the PRD.
Read CLAUDE.md fully before writing any code.
Your module: /src/app/route/ and /src/api/route-plan/route.ts
Implement B1 (MapKit JS route planner), B2 (Claude Haiku departure briefing), B3 (Web Push notifications), B4 (share link).
MapKit JS token is in MAPKIT_JS_TOKEN env var.
Departure briefing calls claude-haiku-4-5-20251001 via Anthropic API.
Service worker lives at public/sw.js — skeleton is in CLAUDE.md, do not change the event listener structure.
Notification scheduling uses setTimeout for hackathon (calculate delayMs from kickoffTime).
All types from src/lib/types.ts. Accept venueId and matchId as URL params.
Expose a "Save Plan + Notify Me" button that schedules the push notification.
```

**Completion criteria:**
- [ ] Route renders on map with step list
- [ ] Mode tabs switch correctly
- [ ] Departure briefing generates from Claude Haiku
- [ ] Notification permission requested and subscription stored
- [ ] Departure alert notification fires at correct time (test with short delta)
- [ ] Share URL generates and opens native share sheet

---

### 👤 Person C — Live Match Experience

**Owns:** `src/app/live/`, `src/api/live/`, `src/hooks/useLiveMatch.ts`

**One-Shot Prompt:**
```
Build the FIFA 360 Live Match Experience module as described in the PRD.
Read CLAUDE.md fully before writing any code.
Your module: /src/app/live/ and /src/api/live/route.ts
Implement C1 (live dashboard with polling), C2 (key moment timeline), C3 (tactical explainer with 3 levels), C4 (match summary for between matches).
GET /api/live?matchId= polls every 10 seconds and returns LiveMatchState.
Use mock data to simulate a live match — pre-populate 5-6 events that animate in over time using setInterval.
Key moment descriptions generated by claude-haiku-4-5-20251001.
Tactical explainer uses claude-sonnet-4-20250514 with level param.
POST /api/live/explain takes {event, context, level} and returns {explanation}.
When a goal event is added, dispatch a CustomEvent('key-moment', {detail: event}) so Person B's notification hook can listen.
All types from src/lib/types.ts. Mobile-first. Animate event additions.
```

**Completion criteria:**
- [ ] Live score + minute updates every 10 seconds
- [ ] Event timeline populates with icons and Claude descriptions
- [ ] Tactical explainer returns different text for each level
- [ ] Next match countdown shows when no live match
- [ ] Match summary shows for completed match
- [ ] CustomEvent fires on goal (Person B integration)

---

### 👤 Person D — Orchestration, Profile & Concierge

**Owns:** `src/api/concierge/`, `src/api/profile/`, `src/app/profile/`, `pipelines/`, `src/lib/rocketride.ts`, `src/lib/mock-data.ts`, `src/lib/types.ts`

**One-Shot Prompt:**
```
Build the FIFA 360 core infrastructure, fan profile, and venue concierge as described in the PRD.
Read CLAUDE.md fully before writing any code.
You own: types.ts, mock-data.ts, rocketride.ts, and three RocketRide pipeline files.
Also own: /src/api/concierge/route.ts, /src/app/profile/ onboarding flow.
Types.ts: define ALL types from the CLAUDE.md spec — do not add or remove fields.
mock-data.ts: create 3-4 MOCK_MATCHES (1 live, 1 upcoming, 1 finished), 6-8 MOCK_VENUES in SF, 1 DEMO_PROFILE.
rocketride.ts: RocketRide client that executes .pipe files via HTTP to localhost:5565.
Concierge: POST /api/concierge, claude-sonnet-4-20250514 with tool use (3 tools: get_venue_details, get_route_to_venue, get_match_info). Full message history passed each request.
Profile onboarding: step 1 = team selection (flag grid, multi-select), step 2 = preferences (watch style, budget slider, travel time, notification toggle, alert timing). Store in localStorage.
Team-based recommendations on home page using profile.favoriteTeams.
Three RocketRide .pipe files per spec.
```

**Completion criteria:**
- [ ] `types.ts` exports all types cleanly — no TypeScript errors
- [ ] `mock-data.ts` exports all three constants with realistic data
- [ ] Concierge chat sends/receives messages, tool use works
- [ ] Profile onboarding saves to localStorage
- [ ] `useProfile()` hook returns profile from localStorage
- [ ] All three RocketRide pipelines execute without error
- [ ] Home screen shows team-based venue recommendations

---

## 8. Home Screen & Navigation (Shared — Person D scaffolds, all contribute)

```
┌─────────────────────────┐
│ ⚽ FIFA 360             │
│ ─────────────────────── │
│ NEXT MATCH              │
│ 🇧🇷 Brazil vs 🇩🇪 Germany│
│ Today · 7:00 PM         │
│                         │
│ YOUR PICKS (team filter)│
│ [Venue Card Preview]    │
│ [Venue Card Preview]    │
│                         │
│ [Find Venue] [Go Live]  │
│ ─────────────────────── │
│ 🏠  🗺️  📺  👤         │
└─────────────────────────┘
```

Bottom nav: Home · Venues · Live · Profile  
Each tab maps to one module. NavBar component lives in `src/components/NavBar.tsx` — Person D scaffolds it.

---

## 9. Non-Goals (Explicit Scope Cuts)

- Real-time match data API (use mock with simulated progression)
- User accounts / backend auth (localStorage only)
- Actual venue booking or reservation
- Multiple simultaneous live matches
- Historical match data beyond one completed example
- Gemini / Google AI Studio in live demo flow

---

## 10. Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| RocketRide pipeline fails in demo | Medium | Have direct API fallback for all pipeline calls |
| MapKit JS token expires | Low | Pre-test, have static route fallback |
| GMI Cloud rate limit | Low | Cache embedding results, have fallback scores |
| Notification doesn't fire | Medium | Demo with short delta (2 min), show permission grant as proof |
| AI responses too slow for demo | Medium | Pre-cache 2-3 key Claude responses for demo path |
| Team integration breaks | Medium | API contract in CLAUDE.md is law — mock everything first |

---

## 11. Demo Day Runbook

```
T-30min  Seed mock data, verify all 4 modules load
T-15min  Run full demo flow once end-to-end
T-10min  Set notification delta to 2 minutes for live demo
T-5min   Open app on phone + screen share ready
T-0      Start at Home screen, follow Demo Script in CLAUDE.md

Demo beats that MUST land:
  1. Personalized venue ranking (say "AI ranked these for you as a Brazil fan")
  2. Departure time notification scheduling (show the permission + confirm toast)
  3. Live tactical explainer (switch between Casual and Analyst levels)
  4. Concierge tool use (ask "Can I get there by train?" — watch it invoke the route tool)
```

---

## 12. Shared Utilities to Build First (Person D, Hour 1)

These must exist before anyone else can run their module:

1. `src/lib/types.ts` — all types
2. `src/lib/mock-data.ts` — all mock data
3. `src/lib/anthropic.ts` — Claude client wrapper
4. `src/lib/gmi.ts` — GMI Cloud client (OpenAI-compatible)
5. `src/lib/rocketride.ts` — RocketRide client
6. `src/components/NavBar.tsx` — bottom nav
7. `src/app/layout.tsx` — root layout with nav
8. `.env.local` — all env vars seeded (even if empty)

Person D announces in team chat when these are pushed. Everyone else waits or mocks locally until this lands.

---

*PRD Version 1.0 — treat as living document. Update feature notes as you build. All questions → team chat.*
