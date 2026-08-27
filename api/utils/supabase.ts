import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface KnowledgeChunk {
  id: bigint;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
  source: string;
  created_at: string;
  updated_at: string;
}

export async function searchSimilar(
  embedding: number[],
  matchCount: number = 8
): Promise<KnowledgeChunk[]> {
  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: embedding,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Supabase search failed: ${error.message}`);
  }

  return data || [];
}

export async function insertChunks(
  chunks: Array<{
    content: string;
    metadata: Record<string, any>;
    embedding: number[];
    source: string;
  }>
): Promise<number> {
  const { data, error, count } = await supabase
    .from('knowledge_chunks')
    .insert(chunks)
    .select('id');

  if (error) {
    throw new Error(`Failed to insert chunks: ${error.message}`);
  }

  return data?.length || 0;
}

export async function getChunkCount(): Promise<number> {
  const { count, error } = await supabase.from('knowledge_chunks').select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get chunk count: ${error.message}`);
  }

  return count || 0;
}
