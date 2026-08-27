import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { createClient } from '@supabase/supabase-js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class RagService {
  private supabase = createClient(
    'https://kjrykbcbsugkaxhsahex.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcnlrYmNic3Vna2F4aHNhaGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTE4NzIsImV4cCI6MjEwMzM2Nzg3Mn0.EHQIVjhGx6vrDSNGGh8z_twqbU5_bNphNFIJ_CbcRK8'
  );

  // Synonyms mapping for better keyword matching
  private synonyms = {
    eneatipo: ['eneagrama', 'tipo'],
    eneagrama: ['eneatipo', 'tipo'],
    softskills: ['personality', 'personalidad', 'disc', 'eneagrama', 'blandas'],
    personalidad: ['softskills', 'personality', 'disc', 'eneagrama'],
    disc: ['personality', 'personalidad', 'softskills'],
    skills: ['habilidades', 'competencias', 'stack', 'técnicas', 'angular', 'react', 'nodejs', 'python', 'backend', 'frontend'],
    habilidades: ['skills', 'competencias', 'stack', 'técnicas'],
    experiencia: ['trabajo', 'empresa', 'splai', 'templo esports', 'laboral'],
    conocimientos: ['skills', 'habilidades', 'competencias'],
    tecnolog: ['stack', 'frameworks', 'herramientas', 'backend', 'frontend'],
  };

  // Maps a chunk's `source` category to terms that imply it, even when those
  // words never literally appear in the chunk content (e.g. "proyectos" never
  // appears inside the CsFinance/DevHub chunks themselves).
  private sourceKeywords: Record<string, string[]> = {
    skills: ['skills', 'habilidades', 'stack', 'tecnolog', 'tecnología', 'lenguaje', 'framework', 'herramienta', 'herramientas', 'frontend', 'backend', 'competencias'],
    projects: ['proyecto', 'proyectos', 'project', 'aplicación', 'aplicaciones', 'plataforma', 'crear', 'construido', 'build'],
    trajectory: ['experiencia', 'trabajo', 'empresa', 'laboral', 'carrera', 'puesto', 'profesional'],
    personality: ['personalidad', 'softskills', 'disc', 'eneagrama', 'eneatipo', 'carácter', 'rasgo', 'blandas'],
    cv: ['quien', 'quién', 'perfil', 'resumen', 'presentate', 'presentación'],
  };

  // Send message and receive streaming response
  chat(message: string): Observable<string> {
    return new Observable((subscriber) => {
      // Search is purely keyword-based with no coreference resolution, so
      // folding previous turns into the query only pollutes term matching —
      // e.g. asking "eneatipo" then "proyectos" would drag personality
      // chunks into the projects answer. Each query is scored standalone.
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

  // RAG retrieval using keyword search (no embeddings needed)
  private async ragMockWithSupabase(message: string): Promise<string> {
    try {
      console.log('[RAG] Query:', message);

      // 1. Fetch all chunks from Supabase
      const { data: allChunks, error } = await this.supabase
        .from('knowledge_chunks')
        .select('id, content, source');

      console.log('[RAG] Fetch response:', { dataCount: allChunks?.length || 0, error });

      if (error) {
        console.error('[RAG] Supabase error:', error);
        return this.getFallbackResponse(message);
      }

      if (!allChunks || allChunks.length === 0) {
        console.log('[RAG] No chunks in database');
        return this.getFallbackResponse(message);
      }

      // 2. Extract meaningful query terms (remove stop words)
      const queryLower = message.toLowerCase();
      const stopWords = ['qué', 'cómo', 'dónde', 'cuándo', 'por', 'para', 'con', 'del', 'de', 'es', 'en', 'y', 'o', 'a', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'];
      const baseQueryTerms = queryLower
        .split(/[\s,\.\!\?]+/)
        .filter(w => w.length > 2 && !stopWords.includes(w));

      // Expand with synonyms
      const queryTerms = new Set<string>();
      baseQueryTerms.forEach(term => {
        queryTerms.add(term);
        // Add synonyms for this term
        if (this.synonyms[term as keyof typeof this.synonyms]) {
          this.synonyms[term as keyof typeof this.synonyms].forEach(syn => queryTerms.add(syn));
        }
      });

      console.log('[RAG] Base terms:', baseQueryTerms, '| Expanded:', Array.from(queryTerms));

      // 3. Calculate TF-IDF-like scores
      const queryTermsArray = Array.from(queryTerms);
      const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const scored = allChunks.map((chunk: any) => {
        const contentLower = chunk.content.toLowerCase();
        const contentLength = chunk.content.length;

        // Count term occurrences (TF)
        let termFrequency = 0;
        queryTermsArray.forEach(term => {
          const escapedTerm = escapeRegex(term);
          const regex = new RegExp(`\\b${escapedTerm}\\b`, 'g');
          const matches = contentLower.match(regex);
          termFrequency += matches ? matches.length : 0;
        });

        // Normalize by document length (longer docs shouldn't get huge scores)
        const normalizedTF = termFrequency / Math.sqrt(contentLength / 100);

        // Boost for exact phrase matches (if any base term appears)
        const hasAnyBaseTerm = baseQueryTerms.some(term => contentLower.includes(term));
        const exactPhraseBoost = hasAnyBaseTerm ? 1.5 : 1;

        // Category boost: query terms that describe this chunk's topic even
        // when those words never appear literally in the chunk content
        const catKeywords = this.sourceKeywords[chunk.source] || [];
        const categoryBoost = baseQueryTerms.some(term => catKeywords.includes(term)) ? 1 : 0;

        const score = normalizedTF * exactPhraseBoost + categoryBoost;
        return { ...chunk, score, termFrequency };
      });

      // 4. Apply strict threshold (minimum relevance)
      const RELEVANCE_THRESHOLD = 0.3;
      const relevantChunks = scored
        .filter((c: any) => c.score >= RELEVANCE_THRESHOLD)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5);

      console.log('[RAG] Found', relevantChunks.length, 'relevant chunks (threshold:', RELEVANCE_THRESHOLD + ')');

      if (relevantChunks.length === 0) {
        console.log('[RAG] No chunks meet relevance threshold, using fallback');
        return this.getFallbackResponse(message);
      }

      // 5. Build response from retrieved chunks (RAG)
      console.log('[RAG] Top chunks:', relevantChunks.slice(0, 3).map((c: any) => `${c.source} (score: ${c.score.toFixed(2)})`));

      // Include more context (up to 1500 chars instead of 500)
      const context = relevantChunks
        .map((chunk: any) => `[${chunk.source}] ${chunk.content}`)
        .join('\n\n')
        .substring(0, 1500);

      const response = `Basándome en mi conocimiento:\n\n${context}`;
      console.log('[RAG] Response length:', response.length, 'chunks used:', relevantChunks.length);
      return response;
    } catch (error) {
      console.error('[RAG] Error:', error);
      return this.getFallbackResponse(message);
    }
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
