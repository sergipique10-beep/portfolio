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
  private readonly OLLAMA_URL = 'http://localhost:11434/api';
  private useMockMode = false; // Use Ollama mode
  private useOllama = true; // Toggle Ollama
  private supabase = createClient(
    'https://kjrykbcbsugkaxhsahex.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcnlrYmNic3Vna2F4aHNhaGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTE4NzIsImV4cCI6MjEwMzM2Nzg3Mn0.EHQIVjhGx6vrDSNGGh8z_twqbU5_bNphNFIJ_CbcRK8'
  );
  private gemini = new GoogleGenerativeAI(
    'REDACTED_GOOGLE_API_KEY'
  );

  // Send message and receive streaming response
  chat(message: string, chatHistory: ChatMessage[]): Observable<string> {
    // Always use mock mode (which handles Ollama or keyword search)
    return this.chatMock(message);
  }

  // RAG with Ollama or fallback to keyword search - streams response directly
  private chatMock(message: string): Observable<string> {
    return new Observable((subscriber) => {
      (this.useOllama ? this.ragWithOllamaStream(message, subscriber) : this.ragMockWithSupabaseStreamed(message, subscriber))
        .catch((error) => {
          console.error('RAG error:', error);
          subscriber.error(error);
        });
    });
  }

  // Stream Ollama response directly
  private async ragWithOllamaStream(message: string, subscriber: any): Promise<void> {
    try {
      console.log('[RAG] Ollama Query:', message);

      // 1. Find relevant chunks
      const chunks = await this.getRelevantChunksByKeywords(message);
      console.log('[RAG] Chunks found:', chunks.length);

      if (chunks.length === 0) {
        const fallback = this.getFallbackResponse(message);
        this.streamResponse(fallback, subscriber);
        return;
      }

      // 2. Build context
      const context = chunks.map((c: any) => c.content).join('\n\n');
      const systemPrompt = `Eres un asistente sobre Sergi Piqué. Responde de manera conversacional y natural en español.
Usa SOLO la información proporcionada. Sé conciso y amable.`;

      // 3. Stream Ollama response
      console.log('[RAG] Streaming Ollama response...');
      await this.streamOllamaResponse(systemPrompt, context, subscriber);
    } catch (error) {
      console.error('[RAG] Ollama stream error:', error);
      subscriber.error(error);
    }
  }

  // Stream response character by character
  private streamResponse(response: string, subscriber: any): void {
    let index = 0;
    const interval = setInterval(() => {
      if (index < response.length) {
        subscriber.next(response[index]);
        index++;
      } else {
        clearInterval(interval);
        subscriber.complete();
      }
    }, 30);
  }

  // Stream Ollama response chunks
  private async streamOllamaResponse(prompt: string, context: string, subscriber: any): Promise<void> {
    try {
      const fullPrompt = `${prompt}\n\nContexto:\n${context}`;

      const stream = await fetch(`${this.OLLAMA_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          prompt: fullPrompt,
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!stream.ok) {
        throw new Error(`Ollama error: ${stream.status}`);
      }

      const reader = stream.body?.getReader();
      if (!reader) throw new Error('No stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              // Stream each character with delay
              for (const char of json.response) {
                subscriber.next(char);
                await new Promise(resolve => setTimeout(resolve, 30));
              }
            }
          } catch {}
        }
      }

      subscriber.complete();
    } catch (error) {
      console.error('[RAG] Stream error:', error);
      subscriber.error(error);
    }
  }

  // Fallback streamed response (for when Ollama is unavailable)
  private async ragMockWithSupabaseStreamed(message: string, subscriber: any): Promise<void> {
    try {
      const response = await this.ragMockWithSupabase(message);
      this.streamResponse(response, subscriber);
    } catch (error) {
      subscriber.error(error);
    }
  }

  // Ollama embedding generation
  private async generateOllamaEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.OLLAMA_URL}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          input: text,
        }),
      });

      if (!response.ok) {
        console.error('[Ollama] Embedding error:', response.status);
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      return data.embeddings[0] || [];
    } catch (error) {
      console.error('[Ollama] Embedding failed:', error);
      throw error;
    }
  }

  // Ollama text generation (conversational responses)
  private async generateOllamaResponse(prompt: string, context: string): Promise<string> {
    try {
      const fullPrompt = `${prompt}\n\nContexto:\n${context}`;
      let response = '';

      const stream = await fetch(`${this.OLLAMA_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          prompt: fullPrompt,
          stream: true,
          temperature: 0.7,
        }),
      });

      const reader = stream.body?.getReader();
      if (!reader) throw new Error('No stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) response += json.response;
          } catch {}
        }
      }

      return response;
    } catch (error) {
      console.error('[Ollama] Generation failed:', error);
      throw error;
    }
  }

  // RAG retrieval using keyword search + Ollama for conversational response
  private async ragWithOllama(message: string): Promise<string> {
    try {
      console.log('[RAG] Ollama Query:', message);

      // 1. Use keyword search to find relevant chunks
      const chunks = await this.getRelevantChunksByKeywords(message);
      console.log('[RAG] Chunks found via keyword search:', chunks.length);

      if (chunks.length === 0) {
        console.log('[RAG] No chunks found');
        return this.getFallbackResponse(message);
      }

      // 2. Build context from chunks
      const context = chunks.map((c: any) => c.content).join('\n\n');

      // 3. Generate conversational response with Ollama
      const systemPrompt = `Eres un asistente sobre Sergi Piqué. Responde de manera conversacional y natural en español.
Usa SOLO la información proporcionada para contestar preguntas sobre su experiencia, skills, proyectos y personalidad.
Si no encuentras la información exacta, responde de forma natural basándote en el contexto.
Sé conciso y amable.`;

      console.log('[RAG] Generating Ollama response...');
      const response = await this.generateOllamaResponse(systemPrompt, context);
      console.log('[RAG] Ollama response length:', response.length);
      return response || this.getFallbackResponse(message);
    } catch (error: any) {
      console.error('[RAG] Ollama error:', error?.message || error);
      return await this.ragMockWithSupabase(message);
    }
  }

  // Extract relevant chunks by keywords
  private async getRelevantChunksByKeywords(message: string): Promise<any[]> {
    try {
      const { data: allChunks, error } = await this.supabase
        .from('knowledge_chunks')
        .select('id, content, source');

      if (error || !allChunks || allChunks.length === 0) {
        return [];
      }

      // Keyword search with category detection
      const queryLower = message.toLowerCase();
      const categories = {
        hardskills: ['hardskills', 'hard skills', 'angular', 'react', 'node', 'python', 'typescript', 'backend', 'frontend', 'stack', 'tecnolog'],
        softskills: ['softskills', 'soft skills', 'liderazgo', 'comunicación', 'personalidad', 'disc', 'eneagrama'],
        proyectos: ['proyecto', 'csfinance', 'devhub', 'portfolio', 'aplicación', 'plataforma'],
        experiencia: ['trabajo', 'experiencia', 'splai', 'templo', 'empresa', 'laboral'],
        ia: ['inteligencia artificial', 'ia', 'llm', 'embeddings'],
      };

      let detectedCategory = '';
      for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(kw => queryLower.includes(kw))) {
          detectedCategory = cat;
          break;
        }
      }

      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      const scored = allChunks.map((chunk: any) => {
        const contentLower = chunk.content.toLowerCase();
        let score = queryWords.filter(word => contentLower.includes(word)).length;

        if (detectedCategory) {
          const categoryKeywords = categories[detectedCategory as keyof typeof categories];
          if (categoryKeywords.some(kw => contentLower.includes(kw))) {
            score += 2;
          }
        }

        return { ...chunk, score };
      });

      return scored
        .filter((c: any) => c.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 3);
    } catch (error) {
      console.error('[RAG] Keyword extraction error:', error);
      return [];
    }
  }

  // RAG retrieval using keyword search (no embeddings needed)
  private async ragMockWithSupabase(message: string): Promise<string> {
    try {
      console.log('[RAG] Query:', message);

      // 1. Fetch all chunks from Supabase
      const { data: allChunks, error } = await this.supabase
        .from('knowledge_chunks')
        .select('id, content, source');

      console.log('[RAG] Fetch response:', { data: allChunks, error });

      if (error) {
        console.error('[RAG] Supabase error:', error);
        return this.getFallbackResponse(message);
      }

      if (!allChunks || allChunks.length === 0) {
        console.log('[RAG] No chunks in database:', { allChunks, isNull: allChunks === null, isArray: Array.isArray(allChunks) });
        return this.getFallbackResponse(message);
      }

      // 2. Keyword search with category detection
      const queryLower = message.toLowerCase();
      const categories = {
        hardskills: ['hardskills', 'hard skills', 'angular', 'react', 'node.js', 'node', 'python', 'fastapi', 'express', 'nestjs', 'sql', 'postgresql', 'aws', 'vercel', 'typescript', 'javascript', 'backend', 'frontend', 'stack', 'tecnolog'],
        softskills: ['softskills', 'soft skills', 'liderazgo', 'comunicación', 'adaptabilidad', 'resolución', 'pensamiento crítico', 'collaboración', 'trabajo en equipo', 'personalidad', 'disc', 'eneagrama', 'habilidades blandas'],
        proyectos: ['proyecto', 'proyectos', 'csfinance', 'devhub', 'portfolio', 'aplicación', 'plataforma', 'herramienta'],
        experiencia: ['trabajo', 'experiencia', 'splai', 'templo esports', 'empresa', 'laboral'],
        ia: ['inteligencia artificial', 'ia', 'gemini', 'claude', 'llm', 'machine learning', 'generative', 'embeddings', 'ai'],
      };

      let detectedCategory = '';
      for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(kw => queryLower.includes(kw))) {
          detectedCategory = cat;
          break;
        }
      }

      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      const scored = allChunks.map((chunk: any) => {
        const contentLower = chunk.content.toLowerCase();
        let score = queryWords.filter(word => contentLower.includes(word)).length;

        // Boost score if category matches
        if (detectedCategory) {
          const categoryKeywords = categories[detectedCategory as keyof typeof categories];
          if (categoryKeywords.some(kw => contentLower.includes(kw))) {
            score += 2;
          }
        }

        return { ...chunk, score };
      });

      const relevantChunks = scored
        .filter((c: any) => c.score > 0)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 3);

      console.log('[RAG] Keyword search results:', relevantChunks.length, 'chunks - Category:', detectedCategory || 'none');

      if (relevantChunks.length === 0) {
        console.log('[RAG] No matching chunks, using fallback');
        return this.getFallbackResponse(message);
      }

      // 3. Build response from retrieved chunks (RAG)
      console.log('[RAG] Retrieved chunks:', relevantChunks.map((c: any) => c.source));
      const context = relevantChunks
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
    for (let i = 0; i < 1536; i++) {
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
