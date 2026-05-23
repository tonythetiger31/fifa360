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
  phone: string;
  type: 'bar' | 'restaurant' | 'fan_zone' | 'stadium_adjacent';
  capacity: 'intimate' | 'medium' | 'large';
  atmosphere: 'casual' | 'lively' | 'electric';
  amenities: string[];
  rating: number;
  priceRange: 1 | 2 | 3;
  imageUrl?: string;
  aiRankScore?: number;
  aiRankReason?: string;
  rsvpAvailable: boolean;
}

export interface FanProfile {
  userId: string;
  favoriteTeams: string[];
  watchStyle: 'social' | 'focused' | 'family';
  budgetRange: 1 | 2 | 3;
  maxTravelMinutes: number;
  notificationsEnabled: boolean;
  departureAlertMinutes: number;
  name?: string;
  partySize?: number;
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

export type CallStatus =
  | 'idle'
  | 'initiating'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed';

export interface VoiceCallSession {
  callId: string;
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
  arrivalTime: string;
  confirmationRef?: string;
  notes?: string;
}
