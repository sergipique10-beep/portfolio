// Input validation for /api/chat and /api/seed-vectors

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export function validateMessage(message: unknown): message is string {
  if (typeof message !== 'string') return false;
  if (message.length < 1 || message.length > 500) return false;
  return true;
}

export function validateChatHistory(history: unknown): history is ChatMessage[] {
  if (!Array.isArray(history)) return false;
  if (history.length > 20) return false;

  return history.every((msg) => {
    if (typeof msg !== 'object' || msg === null) return false;
    if (!['user', 'assistant'].includes((msg as any).role)) return false;
    if (typeof (msg as any).content !== 'string') return false;
    if ((msg as any).content.length < 1 || (msg as any).content.length > 2000) return false;
    return true;
  });
}

export function validateSeedVectorsPayload(payload: unknown): boolean {
  if (typeof payload !== 'object' || payload === null) return false;
  const { apiKey, force } = payload as any;
  if (typeof apiKey !== 'string') return false;
  if (typeof force !== 'boolean' && force !== undefined) return false;
  return true;
}

export class ValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}
