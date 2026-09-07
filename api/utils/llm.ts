import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Groq has no embeddings endpoint, so embeddings still go through OpenAI.
// Groq's chat completions API is OpenAI-compatible, so the same SDK works
// for generation by pointing it at Groq's base URL instead.
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });
  return response.data[0].embedding;
}

export async function streamGroqResponse(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AsyncIterable<string>> {
  const stream = (await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    max_tokens: 500,
    reasoning_effort: 'low',
    reasoning_format: 'hidden',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
  } as any)) as unknown as AsyncIterable<{ choices: Array<{ delta: { content?: string } }> }>;

  return (async function* () {
    for await (const event of stream) {
      const text = event.choices[0]?.delta?.content;
      if (text) yield text;
    }
  })();
}

export class LLMError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'LLMError';
    this.statusCode = statusCode;
  }
}
