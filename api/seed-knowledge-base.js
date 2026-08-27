#!/usr/bin/env node
/**
 * Manual script to seed the knowledge base into Supabase
 *
 * Usage:
 *   RAG_API_KEY=your-key npx node api/seed-knowledge-base.js
 *
 * Or set it in .env.local first
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error(
    '❌ Missing required environment variables. Check .env.local has:\n' +
      '  - SUPABASE_URL\n' +
      '  - SUPABASE_SERVICE_ROLE_KEY\n' +
      '  - OPENAI_API_KEY'
  );
  process.exit(1);
}

// Simple knowledge base (duplicated here for standalone execution)
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

// Generate embedding using OpenAI API
async function generateEmbedding(text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`OpenAI API error: ${response.error.message}`));
          } else {
            resolve(response.data[0].embedding);
          }
        } catch (e) {
          reject(new Error(`Failed to parse OpenAI response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Main seeding function
async function seedKnowledgeBase() {
  console.log('🌱 Starting knowledge base seeding...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const startTime = Date.now();
  let tokensUsed = 0;

  try {
    // Check existing data
    const { count, error: countError } = await supabase
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    if (count > 0) {
      console.log(`⚠️  Knowledge base already has ${count} chunks.`);
      console.log('   Set FORCE=true to overwrite.\n');
      process.exit(0);
    }

    const chunks = [];

    // Process each knowledge base item
    for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
      const item = KNOWLEDGE_BASE[i];
      process.stdout.write(`\r[${i + 1}/${KNOWLEDGE_BASE.length}] Generating embedding...`);

      try {
        const embedding = await generateEmbedding(item.content);
        tokensUsed += Math.ceil(item.content.length / 4); // Rough estimate

        chunks.push({
          content: item.content,
          embedding,
          source: item.source,
          metadata: item.metadata,
        });

        // Rate limit (OpenAI limit)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`\n❌ Failed to embed chunk ${i + 1}:`, err.message);
        process.exit(1);
      }
    }

    console.log(`\r✓ Generated ${chunks.length} embeddings                  `);

    // Insert into Supabase
    console.log('\n📤 Inserting chunks into Supabase...');
    const { data, error: insertError } = await supabase
      .from('knowledge_chunks')
      .insert(chunks)
      .select('id');

    if (insertError) throw insertError;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✓ Inserted ${data.length} chunks`);
    console.log(`\n📊 Seeding Summary:`);
    console.log(`   ✓ Chunks: ${data.length}`);
    console.log(`   ✓ Tokens: ~${tokensUsed}`);
    console.log(`   ✓ Duration: ${duration}s`);
    console.log(`\n✅ Knowledge base seeded successfully!`);
  } catch (error) {
    console.error(`\n❌ Seeding failed:`, error.message);
    process.exit(1);
  }
}

// Run seeding
seedKnowledgeBase();
