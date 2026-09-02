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

  // Strip accents and lowercase, so "qué"/"que" and "eneágrama"/"eneagrama" compare equal
  private normalize(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  // Levenshtein edit distance, used to tolerate typos in query terms
  private levenshtein(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[a.length][b.length];
  }

  // Matches term against word allowing small typos; tolerance scales with word length
  // so short words stay strict (avoids unrelated words matching by accident)
  private isFuzzyMatch(term: string, word: string): boolean {
    if (term === word) return true;
    const maxDistance = term.length <= 4 ? 1 : term.length <= 8 ? 2 : 3;
    if (Math.abs(term.length - word.length) > maxDistance) return false;
    return this.levenshtein(term, word) <= maxDistance;
  }

  // Recruiter-style questions ("¿deberías contratarlo?", "fortalezas/debilidades")
  // need an actual argument built from several facts at once, not the single
  // closest-matching chunk — keyword retrieval alone can't produce that, so
  // these get a hand-written pitch instead.
  private recruiterTemplates: { triggers: string[]; response: string }[] = [
    {
      triggers: ['contratar', 'contratarlo', 'contratarte', 'contrataria', 'contratarias', 'candidato', 'candidata', 'fichar', 'fichaje', 'recomendarias', 'recomiendas'],
      response:
        'Sí, te lo recomiendo. Sergi combina ejecución rápida con estándares de calidad altos: aplica principios SOLID, testing automatizado y code review riguroso, así que no sacrifica arquitectura por velocidad. Ha liderado la arquitectura de una plataforma con miles de usuarios activos en SPLAI, y su eneatipo 1w9 + perfil DISC DC (resultados-oriented, orientado a datos, foco en calidad) encajan bien en entornos donde la corrección y la mejora continua importan. Además tiene mentalidad de producto: no ve el código como un fin, sino como un medio para resolver problemas reales.',
    },
    {
      triggers: ['fortalezas', 'fuertes', 'destaca', 'sobresale'],
      response:
        'Sus principales fortalezas: (1) Velocidad + calidad — desarrolla features complejas rápido sin sacrificar arquitectura, aplicando SOLID y testing automatizado. (2) Mentalidad de producto — prioriza resolver problemas reales sobre escribir código por escribirlo. (3) Aprendizaje continuo — explora nuevas tecnologías constantemente, con formación en IA aplicada. (4) Comunicación clara — traduce complejidad técnica a lenguaje accesible, con buena documentación y PRs claros. A nivel de personalidad, su perfil DISC DC aporta liderazgo directo y resistencia bajo presión, y su eneatipo 1w9 aporta un fuerte sentido de responsabilidad e integridad.',
    },
    {
      triggers: ['debilidades', 'debiles', 'flaquea', 'defecto', 'defectos', 'mejorar'],
      response:
        'Es honesto reconocer un par de áreas: su eneatipo 1w9 puede derivar en perfeccionismo (mitigado por el ala 9, que le da flexibilidad) y una autocrítica interna bastante severa. Su perfil DISC DC, orientado a resultados y directo, a veces puede sonar demasiado directo o tener dificultad recibiendo feedback negativo si no está gestionado de forma consciente. En el día a día esto se traduce en alguien exigente consigo mismo y con el equipo — en la mayoría de entornos de calidad es un activo, pero conviene saberlo de antemano.',
    },
    {
      triggers: ['diferencia', 'destacas', 'unico', 'especial', 'diferente'],
      response:
        'Lo que lo diferencia es la combinación de rigor técnico y pragmatismo: puede liderar arquitectura escalable (lo hizo en SPLAI, con miles de usuarios activos) sin perder de vista el impacto real del producto. Además tiene experiencia concreta integrando IA en producción (Claude API, OpenAI, sistemas RAG) más allá de la teoría — este mismo chat es un ejemplo. Y su perfil de personalidad (1w9 + DISC DC) hace que la calidad y la integridad no sean un discurso, sino cómo trabaja por defecto.',
    },
  ];

  // Checks the query against recruiter-intent trigger words (fuzzy, so
  // "contrataría"/"contratarlo" etc. all match the same template)
  private matchRecruiterIntent(queryTerms: string[]): string | null {
    for (const template of this.recruiterTemplates) {
      const matched = template.triggers.some(trigger =>
        queryTerms.some(term => this.isFuzzyMatch(term, trigger))
      );
      if (matched) return template.response;
    }
    return null;
  }

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

      // 1. Extract meaningful query terms (remove stop words)
      const queryLower = this.normalize(message);
      const stopWords = ['que', 'como', 'donde', 'cuando', 'por', 'para', 'con', 'del', 'de', 'es', 'en', 'y', 'o', 'a', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'];
      const baseQueryTerms = queryLower
        .split(/[\s,\.\!\?]+/)
        .filter(w => w.length > 2 && !stopWords.includes(w));

      // 2. Recruiter-intent questions get a hand-written pitch, skipping
      // retrieval entirely (no single chunk answers "should I hire him")
      const recruiterResponse = this.matchRecruiterIntent(baseQueryTerms);
      if (recruiterResponse) {
        console.log('[RAG] Matched recruiter intent template');
        return recruiterResponse;
      }

      // 3. Fetch all chunks from Supabase
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

      // 3. Calculate TF-IDF-like scores, with fuzzy matching for typo/accent tolerance
      const queryTermsArray = Array.from(queryTerms);

      const scored = allChunks.map((chunk: any) => {
        const contentNormalized = this.normalize(chunk.content);
        const contentWords = contentNormalized.split(/[^a-z0-9]+/).filter(Boolean);
        const contentLength = chunk.content.length;

        // Count term occurrences (TF), tolerating small typos/accent differences
        let termFrequency = 0;
        queryTermsArray.forEach(term => {
          contentWords.forEach(word => {
            if (this.isFuzzyMatch(term, word)) termFrequency++;
          });
        });

        // Normalize by document length (longer docs shouldn't get huge scores)
        const normalizedTF = termFrequency / Math.sqrt(contentLength / 100);

        // Boost for exact phrase matches (if any base term appears)
        const hasAnyBaseTerm = baseQueryTerms.some(term =>
          contentWords.some(word => this.isFuzzyMatch(term, word))
        );
        const exactPhraseBoost = hasAnyBaseTerm ? 1.5 : 1;

        // Category boost: query terms that describe this chunk's topic even
        // when those words never appear literally in the chunk content
        const catKeywords = this.sourceKeywords[chunk.source] || [];
        const categoryBoost = baseQueryTerms.some(term =>
          catKeywords.some(kw => this.isFuzzyMatch(term, this.normalize(kw)))
        ) ? 1 : 0;

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
        .map((chunk: any) => chunk.content)
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
