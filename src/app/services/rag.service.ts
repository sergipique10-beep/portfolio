import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// The RAG backend only runs on Vercel (serverless functions) — Render only
// hosts the static frontend build, so it must call this cross-origin.
const API_BASE_URL = 'https://portfolio-ecru-iota-08wjw81j5u.vercel.app';

@Injectable({ providedIn: 'root' })
export class RagService {
  // Send message to the RAG backend (embeddings + similarity search + Groq
  // generation) and stream the response back chunk by chunk.
  chat(message: string, chatHistory: ChatMessage[] = []): Observable<string> {
    return new Observable((subscriber) => {
      const controller = new AbortController();

      fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          chatHistory: chatHistory.map(({ role, content }) => ({ role, content })),
        }),
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || `RAG request failed (${response.status})`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = JSON.parse(line.slice('data: '.length));
              if (payload.error) throw new Error(payload.error);
              if (payload.chunk) subscriber.next(payload.chunk);
              if (payload.done) {
                subscriber.complete();
                return;
              }
            }
          }

          subscriber.complete();
        })
        .catch((error) => {
          console.error('RAG error:', error);
          subscriber.error(error);
        });

      return () => controller.abort();
    });
  }
}
