import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class RagService {
  private readonly API_URL = '/api/chat';
  private useMockMode = true; // Toggle to false for real API
  private supabase = createClient(
    'https://kjrykbcbsugkaxhsahex.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcnlrYmNic3Vna2F4aHNhaGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTE4NzIsImV4cCI6MjEwMzM2Nzg3Mn0.EHQIVjhGx6vrDSNGGh8z_twqbU5_bNphNFIJ_CbcRK8'
  );
  private gemini = new GoogleGenerativeAI(
    'REDACTED_GOOGLE_API_KEY'
  );

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

  // RAG with Supabase + mock embeddings (no API costs)
  private chatMock(message: string): Observable<string> {
    return new Observable((subscriber) => {
      this.ragMockWithSupabase(message)
        .then((response) => {
          // Stream response character by character with delay
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
        })
        .catch((error) => {
          console.error('Mock RAG error:', error);
          subscriber.error(error);
        });
    });
  }

  // RAG retrieval using Supabase + mock embeddings (Gemini not available)
  private async ragMockWithSupabase(message: string): Promise<string> {
    try {
      // 1. Generate embedding from message using mock (Gemini API key issues)
      console.log('[RAG] Query:', message);
      const embedding = this.generateMockEmbedding(message);

      // 2. Query Supabase for similar chunks
      const { data: chunks, error } = await this.supabase.rpc(
        'match_knowledge_chunks',
        {
          query_embedding: embedding,
          match_count: 3,
        }
      );

      console.log('[RAG] Supabase response:', { chunks: chunks?.length || 0, error });

      if (error) {
        console.error('[RAG] Supabase error:', error);
        return this.getFallbackResponse(message);
      }

      if (!chunks || chunks.length === 0) {
        console.log('[RAG] No chunks found, using fallback');
        return this.getFallbackResponse(message);
      }

      // 3. Build response from retrieved chunks (RAG)
      console.log('[RAG] Retrieved chunks:', chunks.map((c: any) => c.source));
      const context = chunks
        .map((chunk: any) => chunk.content)
        .join(' ')
        .substring(0, 500);

      const response = `Basándome en mi conocimiento: ${context}`;
      console.log('[RAG] Response length:', response.length);
      return response;
    } catch (error) {
      console.error('[RAG] Error:', error);
      return this.getFallbackResponse(message);
    }
  }

  // Generate real embedding using Gemini API (free tier)
  private async generateGeminiEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.gemini.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      console.log('[Gemini] Embedding generated:', result.embedding.values.length, 'dims');
      return result.embedding.values;
    } catch (error) {
      console.error('[Gemini] Embedding error:', error);
      // Fallback to mock if Gemini fails
      return this.generateMockEmbedding(text);
    }
  }

  // Fallback: Generate mock embedding if Gemini is unavailable
  private generateMockEmbedding(text: string): number[] {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
    }
    const seed = Math.abs(hash) % 1000;
    const embedding = [];
    for (let i = 0; i < 768; i++) {
      const x = Math.sin(seed + i * 0.1) * 10000;
      embedding.push(x - Math.floor(x));
    }
    const norm = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
    return embedding.map((x) => x / norm);
  }

  // Fallback responses if Supabase fails
  private getFallbackResponse(message: string): string {
    const msg = message.toLowerCase();

    if (msg.includes('eneagrama') || msg.includes('personalidad') || msg.includes('disc'))
      return 'Sergi es Eneagrama 1w9 con perfil DISC DC. Tiene principios fuertes pero es flexible. Resultados-oriented y calidad-focused.';
    if (msg.includes('stack') || msg.includes('tecnolog'))
      return 'Stack: Angular (frontend), Node.js/Express (backend), PostgreSQL (datos), AWS/Vercel (cloud), Claude API (IA).';
    if (msg.includes('proyecto'))
      return 'Proyectos: CsFinance (plataforma inversión), DevHub (gestor developers), Portfolio Assistant (lo que estás usando).';
    if (msg.includes('experiencia') || msg.includes('trabajo'))
      return 'Trabajó en SPLAI (IA aplicada a BI) y Templo Esports. Especialista en full-stack y IA aplicada.';

    return 'Soy el asistente RAG de Sergi. Pregúntame sobre su stack, skills, proyectos, experiencia o personalidad.';
  }
}
