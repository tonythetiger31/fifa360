# CLAUDE.md — FIFA 360 Matchday Companion
> Active development context file. Keep this open in every session. Update your module's section when you merge.

---

## 🧠 What Is FIFA 360?

FIFA 360 is a **mobile-first AI matchday companion** for the 2026 World Cup. It unifies three broken fan journeys into one:

1. **Find** — Smart venue discovery (where to watch)
2. **Get There** — Route planning + departure timing (how to arrive)
3. **Follow** — Live second-screen match experience (what's happening)

It is positioned as a **"matchday operating system"** — not a single feature, but the connective tissue across the entire match day.

---

## 🏗️ Architecture Overview

```
[ Mobile Web App — React + Tailwind ]
        |
        ▼
[ RocketRide Pipeline Orchestration Layer ]
    /           |            \
[GMI Cloud]  [Anthropic API]  [MapKit JS]
 Embeddings   Claude Sonnet    Routes
 Ranking      Haiku (realtime)
        |
[ Mock Match Data API (internal) ]
[ Venue Data Store (JSON/mock) ]
[ Fan Profile Store (localStorage) ]
```

---

## 🔑 Environment Variables (Shared .env)

```bash
# Anthropic
ANTHROPIC_API_KEY=           # shared team key

# GMI Cloud
GMI_API_KEY=                 # provided at event
GMI_BASE_URL=https://api.gmi-serving.com/v1   # OpenAI-compatible

# Google
GOOGLE_AI_STUDIO_KEY=        # for PRD/testing only — NOT in live demo
MAPKIT_JS_TOKEN=             # MapKit JWT token

# RocketRide
ROCKETRIDE_SERVER_URL=http://localhost:5565

# App
VITE_APP_ENV=development
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

> ⚠️ **LIVE DEMO MODEL RULE**: All user-facing AI inference runs through Anthropic (Claude) or GMI Cloud. Gemini/Google AI Studio is for development reference only and must NOT appear in the demo flow.

---

## 🤖 Model Routing Map

| Feature | Model | Provider | Why |
|---|---|---|---|
| Venue Concierge Agent | `claude-sonnet-4-20250514` | Anthropic | Tool use, structured output, conversation |
| Tactical Explainer | `claude-sonnet-4-20250514` | Anthropic | Multi-level explanation, reasoning |
| Key Moment Summaries | `claude-haiku-4-5-20251001` | Anthropic | Speed — sub-500ms for live feel |
| Departure Timing NL | `claude-haiku-4-5-20251001` | Anthropic | Fast, simple reasoning |
| Venue Embeddings/Ranking | `BAAI/bge-large-en-v1.5` | GMI Cloud | Semantic similarity at scale |
| Fan Profile Personalization | `claude-sonnet-4-20250514` | Anthropic | Nuanced preference modeling |
| Match Narrative Generator | `claude-sonnet-4-20250514` | Anthropic | Story arc, rich language |

---

## 📁 Project Structure

```
fifa360/
├── CLAUDE.md                    ← YOU ARE HERE
├── PRD.md
├── .env
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             ← Home / onboarding
│   │   ├── venue/               ← PERSON A
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── components/
│   │   ├── route/               ← PERSON B
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   ├── live/                ← PERSON C
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   └── profile/             ← PERSON D (partial)
│   ├── api/
│   │   ├── venue/route.ts       ← PERSON A owns
│   │   ├── route-plan/route.ts  ← PERSON B owns
│   │   ├── live/route.ts        ← PERSON C owns
│   │   ├── concierge/route.ts   ← PERSON D owns
│   │   └── profile/route.ts     ← PERSON D owns
│   ├── lib/
│   │   ├── anthropic.ts         ← shared Claude client
│   │   ├── gmi.ts               ← shared GMI client
│   │   ├── rocketride.ts        ← shared RR client
│   │   ├── mock-data.ts         ← ALL mock data lives here
│   │   └── types.ts             ← ALL shared types live here
│   ├── components/
│   │   ├── ui/                  ← shared UI components
│   │   ├── MatchCard.tsx
│   │   ├── VenueCard.tsx
│   │   └── NavBar.tsx
│   └── hooks/
│       ├── useNotifications.ts  ← PERSON B owns
│       └── useLiveMatch.ts      ← PERSON C owns
├── pipelines/                   ← RocketRide .pipe files (PERSON D)
│   ├── venue-ranking.pipe
│   ├── concierge.pipe
│   └── live-match.pipe
└── public/
    └── sw.js                    ← Service worker for push notifs
```

---

## 📦 Shared Types (`src/lib/types.ts`)

> **Everyone imports from here. Do NOT define types locally.**

```typescript
export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoffUTC: string;         // ISO 8601
  venue: string;
  city: string;
  stage: 'group' | 'r16' | 'qf' | 'sf' | 'final';
  status: 'upcoming' | 'live' | 'finished';
  score?: { home: number; away: number };
}

export interface Team {
  id: string;
  name: string;
  flag: string;               // emoji or URL
  primaryColor: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'bar' | 'restaurant' | 'fan_zone' | 'stadium_adjacent';
  capacity: 'intimate' | 'medium' | 'large';
  atmosphere: 'casual' | 'lively' | 'electric';
  amenities: string[];
  rating: number;
  priceRange: 1 | 2 | 3;
  phone?: string;
  imageUrl?: string;
  aiRankScore?: number;        // set by GMI ranking pipeline
  aiRankReason?: string;       // set by Claude
}

export interface FanProfile {
  userId: string;
  favoriteTeams: string[];     // team IDs
  watchStyle: 'social' | 'focused' | 'family';
  budgetRange: 1 | 2 | 3;
  maxTravelMinutes: number;
  notificationsEnabled: boolean;
  departureAlertMinutes: number; // how early to alert before kickoff
}

export interface RoutePlan {
  venueId: string;
  matchId: string;
  departureTime: string;       // ISO 8601
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
  tacticalSummary?: string;    // Claude-generated
  narrativeMoment?: string;    // Claude-generated
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'var' | 'kickoff' | 'halftime' | 'fulltime';
  team: string;
  player?: string;
  description: string;         // Claude-generated plain English
}

export interface ConciergeMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

---

## 🔌 API Contracts

> These endpoints must exist and return these shapes. Mock them first, replace with real logic.

### `GET /api/venue?matchId=&lat=&lng=&filters=`
Returns: `Venue[]` sorted by `aiRankScore` desc

### `POST /api/venue/rank`
Body: `{ venues: Venue[], profile: FanProfile, matchId: string }`
Returns: `Venue[]` with `aiRankScore` and `aiRankReason` populated

### `POST /api/route-plan`
Body: `{ venueId: string, matchId: string, userLocation: {lat, lng}, mode: string }`
Returns: `RoutePlan`

### `POST /api/route-plan/notify`
Body: `{ routePlan: RoutePlan, pushSubscription: PushSubscription }`
Returns: `{ scheduled: boolean, notifyAt: string }`

### `GET /api/live?matchId=`
Returns: `LiveMatchState` (polling every 10s)

### `POST /api/live/explain`
Body: `{ event: MatchEvent, context: LiveMatchState }`
Returns: `{ explanation: string, level: 'casual'|'enthusiast'|'analyst' }`

### `POST /api/concierge`
Body: `{ messages: ConciergeMessage[], profile: FanProfile, venueId?: string }`
Returns: `{ reply: string, action?: 'call_venue'|'update_route'|'show_venue' }`

### `GET /api/matches`
Returns: `Match[]` — upcoming + live (mock data)

---

## 🎭 Mock Data Location

All mock data lives in `src/lib/mock-data.ts`. Do not hardcode data in components.

```typescript
export const MOCK_MATCHES: Match[] = [ /* 3-4 matches, 1 'live' */ ]
export const MOCK_VENUES: Venue[] = [ /* 6-8 venues in SF/NYC */ ]
export const DEMO_PROFILE: FanProfile = { /* Brazil fan, casual, mid budget */ }
```

---

## 🔔 Notification System

Push notifications use the **Web Push API** via a service worker (`public/sw.js`).

**Flow:**
1. User enables notifications in profile setup
2. Browser subscribes → subscription stored in localStorage
3. When route plan is saved → `POST /api/route-plan/notify` schedules an alert
4. Service worker fires notification at `kickoffTime - departureAlertMinutes`
5. Notification payload: `{ title: "Time to leave for {venue}!", body: "Kick off in {N} min. Your route is ready." }`

**Person B owns this end-to-end.**

```javascript
// public/sw.js skeleton — do not modify without telling Person B
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge.png',
    data: { url: data.url }
  });
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

---

## 🚦 Integration Checkpoints

Each person exposes ONE integration test before merging:

| Person | Test | Command |
|---|---|---|
| A | Venue list loads + rank API returns scores | `pnpm test:venue` |
| B | Route plan returns + notification schedules | `pnpm test:route` |
| C | Live state polls + explain endpoint returns | `pnpm test:live` |
| D | Concierge replies + RR pipeline executes | `pnpm test:concierge` |

---

## 🎬 Demo Script (5 min)

```
00:00 — Open app, show fan profile (Brazil fan, SF, casual)
00:30 — "USA vs Brazil" upcoming match → tap → venue finder loads
01:00 — AI ranks venues, show top pick with reason card
01:30 — Tap "Get There" → MapKit route appears, departure time set
02:00 — Enable notification → confirm alert scheduled
02:30 — Switch to LIVE tab (mock live match in progress)
03:00 — Key moment fires → plain-English tactical explainer appears
03:30 — Tap venue concierge → ask "Is it loud there?" → agent responds
04:00 — Show scoreboard + key moment timeline
04:30 — Wrap: "One app. Find it. Get there. Follow it live."
```

---

## ⚠️ Rules of Engagement

- **Never break `/api/` contracts.** Mock first, replace second.
- **Never put API keys in frontend code.** All AI calls go through `/api/` routes.
- **All types come from `src/lib/types.ts`.** No local type definitions.
- **Mobile-first.** Design for 390px width first.
- **If you're blocked, mock it.** Keep your module shippable.
- **Commit messages**: `[venue] feat: add ranking UI` / `[route] fix: notification timing`
