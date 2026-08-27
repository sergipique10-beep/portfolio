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
  private useMockMode = true; // Toggle to false for real API

  // Send message and receive streaming response via Server-Sent Events
  chat(message: string, chatHistory: ChatMessage[]): Observable<string> {
    if (this.useMockMode) {
      return this.chatMock(message);
    }

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

  // Mock responses for testing without API costs
  private chatMock(message: string): Observable<string> {
    const mockResponses: Record<string, string> = {
      stack:
        'Trabajo principalmente con Angular en frontend, Node.js/Express en backend, y PostgreSQL para datos. También tengo experiencia con Python, AWS, y últimamente integro mucho Claude API para IA aplicada.',
      skills:
        'Mis fortalezas: full-stack development, arquitectura escalable, IA aplicada, y comunicación clara del código. Perfil DISC DC: resultados-oriented y quality-focused. Eneagrama 1w9: perfectionist con flexibilidad.',
      projects:
        'He desarrollado CsFinance (plataforma de inversión), DevHub (gestor para developers), y este Portfolio Assistant que estás usando ahora. Todos combinan frontend Angular, backend serverless, y IA.',
      experiencia:
        'Trabajé en SPLAI (IA aplicada a BI) y Templo Esports (plataforma de competiciones). Combino velocidad de ejecución con rigor técnico. Valoro mentality de product y aprendizaje continuo.',
      personalidad:
        'Soy Eneagrama 1w9: principios sólidos hacia lo correcto, pero flexible. DISC DC: driven by results pero con conscientiousness. Prefiero autonomía y equipos de alta performance.',
      hola: '¡Hola! Soy el asistente RAG de Sergi. Pregúntame sobre stack, skills, proyectos, experiencia o personalidad. Estoy aquí para ayudarte a conocer mejor a Sergi.',
      default:
        'Esa es una pregunta interesante. Basado en mi conocimiento sobre Sergi, puedo decirte que es un fullstack engineer especializado en IA con mentalidad de product. ¿Hay algo más específico que quieras saber?',
    };

    // Match keywords
    const msg = message.toLowerCase();
    let response = mockResponses.default;

    if (msg.includes('stack') || msg.includes('tecnolog')) response = mockResponses.stack;
    else if (msg.includes('skill') || msg.includes('fortaleza')) response = mockResponses.skills;
    else if (msg.includes('proyecto')) response = mockResponses.projects;
    else if (msg.includes('experiencia') || msg.includes('trabajo')) response = mockResponses.experiencia;
    else if (msg.includes('personali') || msg.includes('eneagrama') || msg.includes('disc'))
      response = mockResponses.personalidad;
    else if (msg.includes('hola') || msg.includes('hi')) response = mockResponses.hola;

    // Stream response character by character with delay
    return new Observable((subscriber) => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < response.length) {
          subscriber.next(response[index]);
          index++;
        } else {
          clearInterval(interval);
          subscriber.complete();
        }
      }, 30); // 30ms per character for natural typing effect

      return () => clearInterval(interval);
    });
  }
}
