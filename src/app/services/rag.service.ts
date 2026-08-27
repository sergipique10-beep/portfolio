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
          console.error('RAG error:', error);
          subscriber.error(error);
        });
    });
  }


  // Extract relevant chunks by keywords (flexible matching)
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
        hardskills: ['hardskills', 'hard skills', 'skill', 'habilidad', 'angular', 'react', 'node', 'python', 'typescript', 'backend', 'frontend', 'stack', 'tecnolog', 'framework', 'lenguaje', 'herramient'],
        softskills: ['softskills', 'soft skills', 'liderazgo', 'comunicación', 'personalidad', 'disc', 'eneagrama', 'eneatipo', 'tipo', 'caracter', 'rasgo'],
        proyectos: ['proyecto', 'csfinance', 'devhub', 'portfolio', 'aplicación', 'plataforma', 'app', 'herramienta', 'crear', 'build'],
        experiencia: ['trabajo', 'experiencia', 'splai', 'templo', 'empresa', 'laboral', 'carrera', 'puesto', 'profesional'],
        ia: ['inteligencia artificial', 'ia', 'ai', 'llm', 'embeddings', 'generative', 'modelo', 'machine learning'],
      };

      let detectedCategory = '';
      for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(kw => queryLower.includes(kw))) {
          detectedCategory = cat;
          break;
        }
      }

      // List of all valid keyword variations
      const allValidKeywords = [
        'hardskills', 'hard skills', 'skill', 'habilidad', 'angular', 'react', 'node', 'python', 'typescript', 'backend', 'frontend', 'stack', 'tecnolog', 'framework',
        'softskills', 'soft skills', 'liderazgo', 'comunicación', 'personalidad', 'disc', 'eneagrama', 'eneatipo', 'caracter',
        'proyecto', 'csfinance', 'devhub', 'portfolio', 'aplicación', 'plataforma', 'app',
        'trabajo', 'experiencia', 'splai', 'templo', 'empresa', 'laboral', 'carrera',
        'ia', 'ai', 'inteligencia artificial', 'llm', 'embeddings', 'machine learning'
      ];

      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

      // Check if ANY query word matches our valid keywords
      const hasValidKeyword = queryWords.some(word =>
        allValidKeywords.some(kw => kw.includes(word) || word.includes(kw.slice(0, 4)))
      );

      if (!hasValidKeyword && !detectedCategory) {
        console.log('[RAG] No valid keywords found - using fallback immediately');
        return [];
      }

      const scored = allChunks.map((chunk: any) => {
        const contentLower = chunk.content.toLowerCase();
        let score = 0;

        // Only score if there's a category or valid keyword match
        if (detectedCategory) {
          const categoryKeywords = categories[detectedCategory as keyof typeof categories];
          if (categoryKeywords.some(kw => contentLower.includes(kw))) {
            score = 5;
          }
        } else {
          // Score only if valid keyword found in query
          for (const word of queryWords) {
            if (allValidKeywords.some(kw => kw.includes(word) || word.includes(kw.slice(0, 4)))) {
              if (contentLower.includes(word)) {
                score += 3;
              }
            }
          }
        }

        return { ...chunk, score };
      });

      const relevant = scored.filter((c: any) => c.score > 0);
      return relevant.length > 0 ? relevant.sort((a: any, b: any) => b.score - a.score).slice(0, 3) : [];
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

  // Fallback responses if no chunks found
  private getFallbackResponse(message: string): string {
    const responses = [
      'No tengo información sobre eso en mi base de datos. ¡Pero puedes preguntarle directamente a Sergi en una entrevista! 😊',
      'Esa información no la tengo disponible. Te recomiendo contactar con Sergi directamente para conocer más detalles.',
      'No encuentro información sobre eso. ¿Por qué no le haces la pregunta directamente a Sergi? Seguro tiene una respuesta interesante.',
      'Parece que eso no está en mi conocimiento. ¡Sergi estaría encantado de explicártelo en persona!',
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }
}
