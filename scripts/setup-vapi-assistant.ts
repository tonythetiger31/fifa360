import * as fs from 'fs';
import * as path from 'path';

const VAPI_API_KEY = process.env.VAPI_API_KEY ?? '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

if (!VAPI_API_KEY) {
  console.error('ERROR: VAPI_API_KEY not set in environment. Add it to .env.local first.');
  process.exit(1);
}

async function setupVapiAssistant() {
  console.log('Creating Vapi assistant for FIFA 360 Voice RSVP Agent...');

  const body = {
    name: 'FIFA360 Venue Booker',
    model: {
      provider: 'custom-llm',
      url: `${APP_URL}/api/voice/llm`,
      model: 'google/gemma-4-27b-it',
    },
    voice: {
      provider: 'elevenlabs',
      voiceId: 'rachel',
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-3',
      language: 'en-US',
    },
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 180,
    endCallFunctionEnabled: true,
    firstMessage: "Hello! I'm an AI assistant calling to make a reservation. Could I speak with someone about booking a table?",
  };

  const res = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to create assistant:', err);
    process.exit(1);
  }

  const assistant = await res.json();
  console.log('\n✅ Vapi assistant created!');
  console.log(`   ID:   ${assistant.id}`);
  console.log(`   Name: ${assistant.name}`);
  console.log('\nAdd this to your .env.local:');
  console.log(`VAPI_ASSISTANT_ID=${assistant.id}`);

  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

  if (envContent.includes('VAPI_ASSISTANT_ID=')) {
    envContent = envContent.replace(/VAPI_ASSISTANT_ID=.*/, `VAPI_ASSISTANT_ID=${assistant.id}`);
  } else {
    envContent += `\nVAPI_ASSISTANT_ID=${assistant.id}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ VAPI_ASSISTANT_ID written to .env.local');
}

setupVapiAssistant().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
