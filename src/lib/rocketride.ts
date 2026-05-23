import { RocketRideClient, Question } from 'rocketride';
import path from 'path';

let _client: RocketRideClient | null = null;
const _tokens: Record<string, string> = {};

function getClient(): RocketRideClient {
  if (!_client) {
    _client = new RocketRideClient({
      auth: process.env.ROCKETRIDE_APIKEY ?? 'local',
      uri: process.env.ROCKETRIDE_SERVER_URL ?? 'http://localhost:5565',
    });
  }
  return _client;
}

async function ensurePipeline(pipeFile: string): Promise<string> {
  const client = getClient();
  if (!client.isConnected()) {
    await client.connect();
  }
  if (_tokens[pipeFile]) return _tokens[pipeFile];

  const filepath = path.join(process.cwd(), 'pipelines', pipeFile);
  const result = await client.use({ filepath, useExisting: true });
  _tokens[pipeFile] = result.token;
  return result.token;
}

async function runChatRaw(pipeFile: string, questionText: string, context?: Record<string, unknown>): Promise<string> {
  const client = getClient();
  const token = await ensurePipeline(pipeFile);

  const q = new Question();
  q.addQuestion(questionText);
  if (context) q.addContext(context);

  const response = await client.chat({ token, question: q });
  const answers = response?.answers ?? [];
  return answers[0] ?? '';
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('RocketRide timeout')), ms));
}

async function runChat(pipeFile: string, questionText: string, context?: Record<string, unknown>): Promise<string> {
  return Promise.race([runChatRaw(pipeFile, questionText, context), timeout(3000)]);
}

export async function rankVenues(fanProfileJson: string, venuesJson: string): Promise<string> {
  return runChat(
    'venue-ranking.pipe',
    `Fan Profile:\n${fanProfileJson}\n\nVenues:\n${venuesJson}\n\nRank these venues for this fan.`,
    { type: 'venue-ranking' }
  );
}

export async function getDepartureBrief(routeData: Record<string, unknown>): Promise<string> {
  return runChat(
    'departure-timing.pipe',
    `Route details:\n${JSON.stringify(routeData, null, 2)}\n\nWrite the departure briefing.`,
    { type: 'departure-timing' }
  );
}

export async function explainLiveEvent(eventData: Record<string, unknown>): Promise<string> {
  return runChat(
    'live-explain.pipe',
    `Match event:\n${JSON.stringify(eventData, null, 2)}\n\nDescribe this event for a casual fan.`,
    { type: 'live-explain' }
  );
}

export async function confirmRsvpMessage(rsvpData: Record<string, unknown>): Promise<string> {
  return runChat(
    'rsvp-confirm.pipe',
    `RSVP confirmation data:\n${JSON.stringify(rsvpData, null, 2)}\n\nWrite the confirmation message.`,
    { type: 'rsvp-confirm' }
  );
}
