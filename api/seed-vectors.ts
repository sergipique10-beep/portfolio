import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateSeedVectorsPayload } from './utils/validation';
import { checkRateLimit, extractClientIp } from './middleware/rateLimit';
import { generateEmbedding } from './utils/llm';
import { insertChunks, getChunkCount } from './utils/supabase';

const RAG_API_KEY = process.env.RAG_API_KEY || '';

// Sample knowledge base chunks (in production, read from PDF or database)
const KNOWLEDGE_CHUNKS = [
  {
    content: 'Soy Sergi Piqué, especialista en IA, full-stack development, y arquitectura de sistemas.',
    source: 'cv',
    metadata: { category: 'resumen', section: 'profesional' },
  },
  {
    content: 'Mi experiencia incluye development con Angular en frontend, Node.js/Express en backend, y Python para IA/ML.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'lenguajes' },
  },
  {
    content: 'He trabajado en proyectos como CsFinance (plataforma de inversión) y DevHub (gestión de desarrolladores).',
    source: 'projects',
    metadata: { category: 'proyectos', section: 'principales' },
  },
  {
    content: 'En SPLAI, trabajé como full-stack engineer desarrollando soluciones de IA aplicadas a business intelligence.',
    source: 'trajectory',
    metadata: { category: 'experiencia', empresa: 'SPLAI' },
  },
  {
    content:
      'Mi perfil DISC es DC: Dominance + Conscientiousness. Soy resultados-oriented, quality-focused, y lógico en la resolución de problemas.',
    source: 'personality',
    metadata: { category: 'perfil', tipo: 'DISC' },
  },
  {
    content:
      'Mi eneagrama es 1w9 (Reformer/Perfectionist con ala 9). Valoro la corrección, integridad, justicia, y la regulación emocional.',
    source: 'personality',
    metadata: { category: 'perfil', tipo: 'eneagrama' },
  },
];

// Simple recursive splitter to create more chunks from longer content
function splitText(text: string, chunkSize = 500, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start = end - overlap;
    if (start < 0) break;
  }

  return chunks;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Rate limit seed endpoint more strictly (optional)
    const clientIp = extractClientIp(req);
    checkRateLimit(clientIp);

    // Validate API key
    const { apiKey, force = false } = req.body;

    if (!validateSeedVectorsPayload(req.body)) {
      return res.status(400).json({ error: 'Invalid payload. Required: apiKey, optional: force.' });
    }

    if (apiKey !== RAG_API_KEY) {
      return res.status(401).json({ error: 'Invalid API key.' });
    }

    // Check if knowledge base already seeded
    const existingCount = await getChunkCount();
    if (existingCount > 0 && !force) {
      return res.status(409).json({
        error: 'Knowledge base already seeded. Use force: true to override.',
        existingCount,
      });
    }

    // Process chunks
    const chunks = [];
    let totalTokens = 0;
    const startTime = Date.now();

    for (const kb of KNOWLEDGE_CHUNKS) {
      // Split long content into smaller chunks
      const textChunks = splitText(kb.content, 500, 100);

      for (let i = 0; i < textChunks.length; i++) {
        const chunkText = textChunks[i];

        try {
          // Generate embedding
          const embedding = await generateEmbedding(chunkText);

          // Estimate tokens (rough: 1 token ≈ 4 chars)
          totalTokens += Math.ceil(chunkText.length / 4);

          chunks.push({
            content: chunkText,
            metadata: { ...kb.metadata, chunk_index: i, chunk_count: textChunks.length },
            embedding,
            source: kb.source,
          });

          // Rate limit batch API calls
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to embed chunk: ${chunkText.slice(0, 50)}`, error);
          throw error;
        }
      }
    }

    // Insert into Supabase
    const inserted = await insertChunks(chunks);
    const duration = (Date.now() - startTime) / 1000;

    res.status(200).json({
      success: true,
      chunksCreated: inserted,
      chunkDetails: chunks.length,
      tokensUsed: totalTokens,
      durationSeconds: duration.toFixed(2),
      sources: {
        cv: chunks.filter((c) => c.source === 'cv').length,
        skills: chunks.filter((c) => c.source === 'skills').length,
        projects: chunks.filter((c) => c.source === 'projects').length,
        trajectory: chunks.filter((c) => c.source === 'trajectory').length,
        personality: chunks.filter((c) => c.source === 'personality').length,
      },
    });
  } catch (error: any) {
    console.error('Seed vectors endpoint error:', error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    res.status(500).json({ error: 'Error seeding knowledge base. Check logs.' });
  }
}

export default handler;
