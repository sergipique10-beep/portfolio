#!/usr/bin/env node
/**
 * Mock seeding script - uses simulated embeddings for testing
 * In production, replace with real OpenAI embeddings
 *
 * Usage: node api/seed-knowledge-base-mock.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Knowledge base content
const KNOWLEDGE_BASE = [
  {
    content:
      'Soy Sergi Piqué, especialista en full-stack development con enfoque en IA, backend engineering, y arquitectura de sistemas.',
    source: 'cv',
    metadata: { category: 'resumen', section: 'profesional' },
  },
  {
    content:
      'Frontend: Angular 21+ (TypeScript, RxJS), React, especializado en UI/UX con animaciones y diseño responsivo.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'frontend' },
  },
  {
    content:
      'Backend: Node.js (Express, NestJS), Python (FastAPI), arquitectura serverless con APIs REST escalables.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'backend' },
  },
  {
    content:
      'Bases de datos: PostgreSQL, MongoDB, Supabase (pgvector), Redis. Diseño de esquemas y optimización de queries.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'databases' },
  },
  {
    content:
      'Cloud & DevOps: Vercel, AWS (EC2, S3, Lambda), Google Cloud. Docker, CI/CD con GitHub Actions, monitoreo con Sentry.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'cloud' },
  },
  {
    content:
      'IA & ML: Integración con Claude API, OpenAI (GPT-4, embeddings), LangChain. Desarrollo de RAG systems, prompt engineering.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'ia' },
  },
  {
    content:
      'CsFinance: Plataforma SaaS de inversión personal con integración a Steam API. Backend Node.js/Express, frontend Angular, análisis en tiempo real.',
    source: 'projects',
    metadata: { category: 'proyecto', nombre: 'CsFinance' },
  },
  {
    content:
      'DevHub: Sistema de gestión para desarrolladores. Portfolio builder, tracker de skills. Monorepo Angular + NestJS con búsqueda vectorial.',
    source: 'projects',
    metadata: { category: 'proyecto', nombre: 'DevHub' },
  },
  {
    content:
      'Portfolio assistant: Sistema RAG integrado en portfolio. Asistente inteligente con embeddings y Claude API. Arquitectura serverless con Vercel + Supabase.',
    source: 'projects',
    metadata: { category: 'proyecto', nombre: 'Portfolio Assistant' },
  },
  {
    content:
      'SPLAI: Full-stack engineer en startup de IA aplicada a business intelligence. Soluciones de análisis predictivo, dashboards interactivos, sistemas de recomendación.',
    source: 'trajectory',
    metadata: { category: 'experiencia', empresa: 'SPLAI' },
  },
  {
    content:
      'Eneagrama 1w9: Tengo brújula interna hacia lo correcto. Valoro integridad, calidad, mejora continua. El ala 9 aporta flexibilidad.',
    source: 'personality',
    metadata: { category: 'perfil', tipo: 'eneagrama', value: '1w9' },
  },
  {
    content:
      'DISC: Perfil DC (Dominance + Conscientiousness). Resultados-oriented, impulsado por objetivos claros. Valoro datos y calidad.',
    source: 'personality',
    metadata: { category: 'perfil', tipo: 'DISC', value: 'DC' },
  },
];

// Generate mock embedding (random vector, 1536 dims like OpenAI)
function generateMockEmbedding(text) {
  // Use text hash as seed for reproducibility
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const seed = Math.abs(hash) % 1000;
  const embedding = [];

  for (let i = 0; i < 1536; i++) {
    // Pseudo-random based on seed + index
    const x = Math.sin(seed + i * 0.1) * 10000;
    embedding.push(x - Math.floor(x)); // Get decimal part
  }

  // Normalize (L2 norm)
  const norm = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
  return embedding.map((x) => x / norm);
}

// Main seeding function
async function seedKnowledgeBase() {
  console.log('🌱 Starting knowledge base seeding (with mock embeddings)...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const startTime = Date.now();

  try {
    // Check existing data
    const { count, error: countError } = await supabase
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    if (count > 0) {
      console.log(`⚠️  Knowledge base already has ${count} chunks.`);
      console.log('   Delete existing data first or modify script.\n');
      process.exit(0);
    }

    const chunks = [];

    // Process each knowledge base item
    for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
      const item = KNOWLEDGE_BASE[i];
      process.stdout.write(`\r[${i + 1}/${KNOWLEDGE_BASE.length}] Generating mock embedding...`);

      const embedding = generateMockEmbedding(item.content);

      chunks.push({
        content: item.content,
        embedding,
        source: item.source,
        metadata: item.metadata,
      });
    }

    console.log(`\r✓ Generated ${chunks.length} mock embeddings              `);

    // Insert into Supabase
    console.log('\n📤 Inserting chunks into Supabase...');
    const { data, error: insertError } = await supabase
      .from('knowledge_chunks')
      .insert(chunks)
      .select('id');

    if (insertError) throw insertError;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✓ Inserted ${data.length} chunks`);

    // Verify by counting
    const { count: finalCount } = await supabase.from('knowledge_chunks').select('*', { count: 'exact', head: true });

    console.log(`\n📊 Seeding Summary:`);
    console.log(`   ✓ Chunks inserted: ${data.length}`);
    console.log(`   ✓ Total in DB: ${finalCount}`);
    console.log(`   ✓ Duration: ${duration}s`);
    console.log(`   ⚠️  Using MOCK embeddings (for testing only)`);
    console.log(`\n✅ Knowledge base seeded successfully!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Configure real OpenAI API key in .env.local`);
    console.log(`   2. Run: npx node api/seed-knowledge-base.js (real embeddings)`);
    console.log(`   3. Test similarity search in Supabase dashboard`);
  } catch (error) {
    console.error(`\n❌ Seeding failed:`, error.message);
    process.exit(1);
  }
}

// Run seeding
seedKnowledgeBase();
