import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateMessage, validateChatHistory } from './utils/validation';
import { checkRateLimit, extractClientIp, RateLimitError } from './middleware/rateLimit';
import { generateEmbedding, streamClaudeResponse } from './utils/llm';
import { searchSimilar } from './utils/supabase';

const SYSTEM_PROMPT = `Eres un asistente RAG sobre Sergi Piqué, un profesional especializado en IA, backend, y full-stack development.
Tu objetivo es responder preguntas sobre su experiencia, habilidades, proyectos, y personalidad usando la información del knowledge base.

Instrucciones:
1. Sé amable, profesional, y conciso.
2. Usa solo la información de los chunks proporcionados.
3. Si no encuentras información relevante, dilo claramente.
4. Responde en español a menos que el usuario pregunte en otro idioma.
5. Personaliza las respuestas con detalles del CV, proyectos, y perfil de Sergi.`;

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientIp = extractClientIp(req);
    if (!checkRateLimit(clientIp)) {
      throw new RateLimitError();
    }

    // Validate input
    const { message, chatHistory = [] } = req.body;

    if (!validateMessage(message)) {
      return res.status(400).json({ error: 'Invalid message. Must be 1-500 characters.' });
    }

    if (!validateChatHistory(chatHistory)) {
      return res
        .status(400)
        .json({ error: 'Invalid chat history. Max 20 messages, each 1-2000 characters.' });
    }

    // Generate embedding for the user message
    const embedding = await generateEmbedding(message);

    // Search similar chunks in Supabase
    const similarChunks = await searchSimilar(embedding, 8);

    if (similarChunks.length === 0) {
      return res.status(200).json({
        response: 'Disculpa, no encontré información relevante para tu pregunta. ¿Puedes reformularla?',
        chunksUsed: 0,
      });
    }

    // Build context from chunks
    const contextLines = similarChunks
      .map((chunk) => `[${chunk.source}]\n${chunk.content}`)
      .join('\n\n');

    const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n## Información sobre Sergi:\n${contextLines}`;

    // Build messages for Claude
    const messages = [
      ...chatHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Stream Claude response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const responseStream = await streamClaudeResponse(fullSystemPrompt, messages);

    let totalChars = 0;
    for await (const chunk of responseStream) {
      totalChars += chunk.length;
      res.write(`data: ${JSON.stringify({ chunk })}\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true, chunksUsed: similarChunks.length })}\n`);
    res.end();
  } catch (error: any) {
    console.error('Chat endpoint error:', error);

    if (error.statusCode) {
      const statusCode = error.statusCode;
      const message = error.message || 'Unknown error';
      return res.status(statusCode).json({ error: message });
    }

    // Generic error response
    res.status(500).json({ error: 'Error procesando tu pregunta. Intenta de nuevo.' });
  }
}

export default handler;
