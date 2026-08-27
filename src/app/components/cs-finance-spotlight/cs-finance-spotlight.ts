import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TechIcon } from '../tech-icon/tech-icon';

@Component({
  selector: 'app-cs-finance-spotlight',
  imports: [TechIcon, CommonModule],
  templateUrl: './cs-finance-spotlight.html',
  styleUrl: './cs-finance-spotlight.scss'
})
export class CsFinanceSpotlight {
  showTechnicalDetails = false;
  stack = {
    backend: ['Python', 'FastAPI', 'Gemini'],
    data: ['Supabase', 'pgvector', 'Steam Web API', 'GitHub Actions'],
    frontend: ['Angular', 'Ionic', 'TypeScript']
  };

  phases = [
    { title: 'Chat conversacional', status: 'completado', phase: '1' },
    { title: 'RAG + ingesta de noticias', status: 'completado', phase: '2.1' },
    { title: 'Histórico de precios', status: 'completado', phase: '2.2' },
    { title: 'Tool de tendencia con function calling', status: 'en progreso', phase: '2.3' }
  ];

  learnings = [
    {
      icon: '⚠️',
      title: 'Fallo silencioso en APIs externas',
      desc: 'steamwebapi devuelve datos que parecen correctos pero no lo son. Validar suposiciones antes de confiar en proveedores externos.'
    },
    {
      icon: '🔒',
      title: 'No escalé credenciales de sesión',
      desc: 'Decisión consciente: rechacé una solución que "funcionaría" porque no escala de forma segura a otros usuarios.'
    },
    {
      icon: '⚙️',
      title: 'LLM ≠ ML',
      desc: 'El agente es el LLM llamando tools. La predicción es un modelo aparte. Cálculos exactos van por SQL, nunca por embeddings.'
    }
  ];

  githubUrl = 'https://github.com/sergipique10-beep/LoginCsFinance';

  toggleTechnicalDetails() {
    this.showTechnicalDetails = !this.showTechnicalDetails;
  }

  technicalDetails = {
    endpoints: [
      { method: 'POST', path: '/rag/chat', desc: 'Chat conversacional con contexto RAG' },
      { method: 'POST', path: '/rag/ask', desc: 'Consulta directa al vector store con umbral de similitud (RAG_MIN_SIMILARITY=0.5)' },
      { method: 'POST', path: '/internal/rag-ingest', desc: 'Ingesta diaria de noticias (RSS + Steam News) disparada por GitHub Actions' },
      { method: 'POST', path: '/internal/price-tick', desc: 'Captura diaria de precios históricos, disparada por GitHub Actions' }
    ],
    architecture: [
      {
        title: 'Vector Store & RAG',
        detail: 'Supabase pgvector con índice HNSW. Chunks de noticias embebidos con gemini-embedding-001 (768 dims). RPC match_rag_chunks para búsqueda de similitud coseno.'
      },
      {
        title: 'Caché de inventario (23h)',
        detail: 'App tiene su propio caché en stores.py. steamwebapi tiene SU PROPIA caché congelada. Fix: forzar no_cache=1 en _fetch_fresh_inventory.'
      },
      {
        title: 'Histórico de precios',
        detail: 'Steam API limita a ~50 días de ventana móvil. Solución: recolector propio (price_capture) acumula en tabla precios_historicos en Supabase.'
      }
    ],
    security: [
      {
        title: 'Credenciales en Backend',
        detail: 'GEMINI_API_KEY vive solo en rag/gemini.py. Frontend Angular NUNCA la ve. Backend actúa como proxy seguro.'
      },
      {
        title: 'Autenticación de endpoints internos',
        detail: 'RAG_INGEST_TOKEN para /internal/rag-ingest. X-Price-Tick-Token (PRICE_TICK_TOKEN) para /internal/price-tick. Ambos disparados por GitHub Actions.'
      },
      {
        title: 'Decisión: No escalé steamLoginSecure',
        detail: 'Se evaluó usar cookie de sesión de Steam para saltear bloqueo de 10 días. Rechazado: es credencial de sesión completa que no escala a otros usuarios. Prioridad: seguridad/arquitectura sobre funcionalidad.'
      }
    ],
    workflow: [
      {
        title: 'Feature branches',
        detail: 'Rama con mismo nombre en ambos repos (frontend: main, backend: master). Claude hace commit + push, nunca merge.'
      },
      {
        title: 'Integración manual',
        detail: 'Usuario integra manualmente a rama por defecto. Ciclo feat/rag-chat: RAG + tools + predicción + histórico quedó en origin/master.'
      }
    ],
    modules: [
      {
        phase: '1',
        title: 'Chat conversacional',
        desc: 'Completado. Chat simple con Gemini, sin retrieval.'
      },
      {
        phase: '2.1',
        title: 'RAG + Ingesta de noticias',
        desc: 'Completado. Ingesta diaria CS2 (RSS + Steam News) → chunk → embed → Supabase pgvector → /rag/ask con umbral de similitud → Gemini responde.'
      },
      {
        phase: '2.2',
        title: 'Histórico de precios',
        desc: 'Completado. Recolector diario amplía histórico más allá de ~50 días que da la API.'
      },
      {
        phase: '2.3',
        title: 'Tool de tendencia (Módulo 3)',
        desc: 'Diseñado, plan TDD escrito, en progreso. Sharky llama por function calling a predecir_tendencia_skin → regresión lineal 7 días.'
      },
      {
        phase: '2.4 (future)',
        title: 'Orquestador + ML de predicción',
        desc: 'Más tools registradas. Modelo ML real de predicción aprovecha histórico acumulado.'
      }
    ],
    keyInsight: 'Agente LLM ≠ Entrenar ML. El agente es el LLM llamando tools. Predicción es modelo numérico aparte. Cálculos exactos (precios, números) van por SQL, NUNCA por embeddings.'
  };
}
