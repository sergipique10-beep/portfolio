import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });
  return response.data[0].embedding;
}

export async function streamClaudeResponse(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AsyncIterable<string>> {
  const stream = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 500,
    system: systemPrompt,
    messages: messages as Parameters<typeof anthropic.messages.create>[0]['messages'],
    stream: true,
  });

  return (async function* () {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
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
