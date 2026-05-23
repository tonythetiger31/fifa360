import OpenAI from 'openai';

export const gmi = new OpenAI({
  apiKey: process.env.GMI_API_KEY!,
  baseURL: process.env.GMI_BASE_URL!,
});

export const SMART_MODEL = process.env.GMI_SMART_MODEL!;
export const FAST_MODEL  = process.env.GMI_FAST_MODEL!;
export const EMBED_MODEL = process.env.GMI_EMBED_MODEL!;

export async function chat(
  model: string,
  system: string,
  user: string,
  opts?: { temperature?: number; max_tokens?: number }
) {
  const res = await gmi.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: opts?.temperature ?? 0.7,
    max_tokens:  opts?.max_tokens  ?? 512,
  });
  return res.choices[0].message.content ?? '';
}

export async function chatStream(
  model: string,
  messages: OpenAI.ChatCompletionMessageParam[]
) {
  return gmi.chat.completions.create({ model, messages, stream: true });
}

export async function embed(text: string) {
  const res = await gmi.embeddings.create({ model: EMBED_MODEL, input: text });
  return res.data[0].embedding;
}
