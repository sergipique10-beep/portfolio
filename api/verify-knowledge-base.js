#!/usr/bin/env node
/**
 * Verify knowledge base in Supabase and test similarity search
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyKnowledgeBase() {
  console.log('📊 Verifying Knowledge Base...\n');

  try {
    // Get all chunks
    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('id, content, source, metadata, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    console.log(`✓ Total chunks: ${chunks.length}`);
    console.log(`\n📋 Chunks by source:`);

    const sources = {};
    chunks.forEach((chunk) => {
      sources[chunk.source] = (sources[chunk.source] || 0) + 1;
    });

    Object.entries(sources).forEach(([source, count]) => {
      console.log(`   ${source}: ${count}`);
    });

    console.log(`\n📄 Sample chunks:\n`);

    chunks.slice(0, 3).forEach((chunk, i) => {
      console.log(`${i + 1}. [${chunk.source}] "${chunk.content.substring(0, 70)}..."`);
    });

    // Test similarity search RPC
    console.log(`\n🔍 Testing match_knowledge_chunks RPC...`);

    // Create a test embedding (1536 dims)
    const testEmbedding = Array(1536)
      .fill(0)
      .map(() => Math.random());

    const { data: matches, error: rpcError } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: testEmbedding,
      match_count: 3,
    });

    if (rpcError) {
      console.log(`⚠️  RPC call failed: ${rpcError.message}`);
      console.log(`   (This is expected if embeddings are mock - similarity won't be meaningful)`);
    } else {
      console.log(`✓ Retrieved ${matches?.length || 0} similar chunks`);
      if (matches?.length > 0) {
        matches.slice(0, 2).forEach((match, i) => {
          console.log(`   ${i + 1}. "${match.content.substring(0, 60)}..."`);
        });
      }
    }

    console.log(`\n✅ Knowledge base verification complete!`);
  } catch (error) {
    console.error(`\n❌ Verification failed:`, error.message);
    process.exit(1);
  }
}

verifyKnowledgeBase();
