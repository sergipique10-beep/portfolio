import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

// Groq has no embeddings endpoint, so embeddings go through Gemini instead.
// Groq's chat completions API is OpenAI-compatible, so the same SDK works
// for generation by pointing it at Groq's base URL.
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const EMBEDDING_DIMENSIONS = 768;

// Both the Gemini and Groq/OpenAI SDKs throw errors with a numeric `.status`
// (429) when the account is rate-limited or out of quota/credits.
export function isQuotaError(error: any): boolean {
  return error?.status === 429;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await gemini.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) {
      throw new LLMError('Gemini embeddings API returned no embedding', 502);
    }
    return embedding;
  } catch (error: any) {
    if (error instanceof LLMError) throw error;
    if (isQuotaError(error)) {
      throw new LLMError(
        'El asistente no está disponible ahora mismo (cuota de IA agotada). Inténtalo más tarde.',
        503
      );
    }
    throw new LLMError('Error generando el embedding de la consulta.', 502);
  }
}

export async function streamGroqResponse(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AsyncIterable<string>> {
  let stream: AsyncIterable<{ choices: Array<{ delta: { content?: string } }> }>;
  try {
    stream = (await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      max_tokens: 500,
      reasoning_effort: 'low',
      reasoning_format: 'hidden',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    } as any)) as unknown as AsyncIterable<{ choices: Array<{ delta: { content?: string } }> }>;
  } catch (error: any) {
    if (isQuotaError(error)) {
      throw new LLMError(
        'El asistente no está disponible ahora mismo (cuota de IA agotada). Inténtalo más tarde.',
        503
      );
    }
    throw new LLMError('Error generando la respuesta.', 502);
  }

  return (async function* () {
    try {
      for await (const event of stream) {
        const text = event.choices[0]?.delta?.content;
        if (text) yield text;
      }
    } catch (error: any) {
      if (isQuotaError(error)) {
        throw new LLMError(
          'El asistente no está disponible ahora mismo (cuota de IA agotada). Inténtalo más tarde.',
          503
        );
      }
      throw new LLMError('Error generando la respuesta.', 502);
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
