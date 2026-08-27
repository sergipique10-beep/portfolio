#!/usr/bin/env node

/**
 * Re-seed all knowledge chunks with mock embeddings
 * This ensures query embeddings (frontend) match stored embeddings (Supabase)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kjrykbcbsugkaxhsahex.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcnlrYmNic3Vna2F4aHNhaGV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc5MTg3MiwiZXhwIjoyMTAzMzY3ODcyfQ.p-OJfz_matpM90K3z1Q0lFjq-mHavJr2HGQkx50uafo";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Same function as rag.service.ts
function generateMockEmbedding(text) {
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

async function reseedEmbeddings() {
  try {
    console.log("🔄 Fetching chunks from Supabase...");
    const { data: chunks, error: fetchError } = await supabase
      .from("knowledge_chunks")
      .select("id, content");

    if (fetchError) {
      console.error("❌ Error fetching chunks:", fetchError);
      return;
    }

    console.log(`✅ Found ${chunks.length} chunks`);

    for (const chunk of chunks) {
      const embedding = generateMockEmbedding(chunk.content);
      console.log(`📝 Re-embedding chunk ${chunk.id}...`);

      const { error: updateError } = await supabase
        .from("knowledge_chunks")
        .update({ embedding })
        .eq("id", chunk.id);

      if (updateError) {
        console.error(`❌ Error updating chunk ${chunk.id}:`, updateError);
      } else {
        console.log(`✅ Chunk ${chunk.id} updated`);
      }
    }

    console.log("\n🎉 All chunks re-seeded with mock embeddings!");
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

reseedEmbeddings();
