import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class RagService {
  private readonly API_URL = '/api/chat';

  // Send message and receive streaming response via Server-Sent Events
  chat(message: string, chatHistory: ChatMessage[]): Observable<string> {
    return new Observable((subscriber) => {
      const payload = {
        message,
        chatHistory: chatHistory
          .slice(-10) // Last 10 messages for context
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
      };

      fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const processStream = async () => {
            try {
              let buffer = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += new TextDecoder().decode(value);

                // Parse complete lines (data: {...}\n)
                const lines = buffer.split('\n');
                buffer = lines[lines.length - 1]; // Keep incomplete line

                for (let i = 0; i < lines.length - 1; i++) {
                  const line = lines[i].trim();
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.substring(6));
                      if (data.done) {
                        subscriber.complete();
                        return;
                      } else if (data.chunk) {
                        subscriber.next(data.chunk);
                      }
                    } catch (e) {
                      console.warn('Failed to parse SSE data:', e);
                    }
                  }
                }
              }

              // Process final line if any
              if (buffer) {
                const line = buffer.trim();
                if (line.startsWith('data: ')) {
                  const data = JSON.parse(line.substring(6));
                  if (data.chunk) {
                    subscriber.next(data.chunk);
                  }
                }
              }

              subscriber.complete();
            } catch (error) {
              subscriber.error(error);
            }
          };

          processStream();
        })
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }
}
