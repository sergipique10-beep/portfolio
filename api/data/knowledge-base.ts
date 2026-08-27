/**
 * Knowledge base content for RAG system
 * Divided into semantic chunks by source category
 */

export interface KnowledgeBaseItem {
  content: string;
  source: 'cv' | 'skills' | 'projects' | 'trajectory' | 'strengths' | 'personality' | 'faq';
  metadata: Record<string, any>;
}

export const knowledgeBase: KnowledgeBaseItem[] = [
  // === CV & Professional Summary ===
  {
    content:
      'Soy Sergi Piqué, especialista en full-stack development con enfoque en IA, backend engineering, y arquitectura de sistemas. Con experiencia en startups y proyectos escalables, combino visión técnica con capacidad de liderazgo.',
    source: 'cv',
    metadata: { category: 'resumen', section: 'profesional', order: 1 },
  },
  {
    content:
      'Contacto: sergipique10@gmail.com | LinkedIn: linkedin.com/in/sergipique | GitHub: github.com/sergipique10-beep | Portfolio: portfolio-website.com',
    source: 'cv',
    metadata: { category: 'contacto', section: 'datos', order: 1 },
  },

  // === Tech Stack ===
  {
    content:
      'Frontend: Angular 21+ (TypeScript, RxJS, componentes reactivos), React (hooks, state management). Especializado en UI/UX con animaciones y diseño responsivo.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'frontend', order: 1 },
  },
  {
    content:
      'Backend: Node.js (Express, NestJS), Python (FastAPI, Django), arquitectura serverless. Experiencia con APIs REST y sistemas escalables. Rate limiting, autenticación, y manejo de concurrencia.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'backend', order: 2 },
  },
  {
    content:
      'Bases de datos: PostgreSQL, MongoDB, Supabase (pgvector para búsqueda vectorial), Redis para caching. Diseño de esquemas normalizados y optimización de queries.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'databases', order: 3 },
  },
  {
    content:
      'Cloud & DevOps: Vercel (deployments), AWS (EC2, S3, Lambda), Google Cloud. Docker, CI/CD pipelines, GitHub Actions, monitoreo con Sentry y LogRocket.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'cloud', order: 4 },
  },
  {
    content:
      'Autenticación: JWT, OAuth2, sesiones seguras. Integración con Auth0, Firebase Authentication. Manejo de permisos y roles basados en RLS (Row-Level Security).',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'auth', order: 5 },
  },
  {
    content:
      'IA & ML: Integración con Claude API (Anthropic), OpenAI (GPT-4, embeddings), LangChain. Desarrollo de RAG systems, prompt engineering, fine-tuning. Aplicación de IA a business intelligence.',
    source: 'skills',
    metadata: { category: 'tech-stack', section: 'ia', order: 6 },
  },

  // === Projects ===
  {
    content:
      'CsFinance: Plataforma SaaS de inversión personal con integración a Steam API para análisis de juegos como activos. Desarrollé el backend con Node.js/Express, base de datos PostgreSQL, y frontend con Angular. Implementé análisis de datos en tiempo real y reportes personalizados.',
    source: 'projects',
    metadata: { category: 'proyecto', nombre: 'CsFinance', order: 1 },
  },
  {
    content:
      'DevHub: Sistema de gestión centralizado para desarrolladores. Features incluyen portfolio builder, tracker de skills, y recomendaciones de proyectos. Arquitectura monorepo con frontend Angular y backend NestJS. Implementé búsqueda vectorial con pgvector para recomendaciones inteligentes.',
    source: 'projects',
    metadata: { category: 'proyecto', nombre: 'DevHub', order: 2 },
  },
  {
    content:
      'Portfolio assistant: Sistema RAG (Retrieval-Augmented Generation) integrado en portfolio personal. Asistente inteligente que responde preguntas sobre experiencia, skills, y proyectos usando embeddings vectoriales y Claude API. Arquitectura serverless con Vercel Functions y Supabase.',
    source: 'projects',
    metadata: { category: 'proyecto', nombre: 'Portfolio Assistant', order: 3 },
  },

  // === Trajectory ===
  {
    content:
      'SPLAI: Trabajé como full-stack engineer en una startup especializada en IA aplicada a business intelligence. Desarrollé soluciones de análisis predictivo, dashboards interactivos, y sistemas de recomendación basados en datos. Lideré la arquitectura de una plataforma escalable con miles de usuarios activos.',
    source: 'trajectory',
    metadata: { category: 'experiencia', empresa: 'SPLAI', orden: 1 },
  },
  {
    content:
      'Templo Esports: Participé en el desarrollo de plataforma de competiciones esports. Implementé sistema de brackets, scoring en tiempo real, y estadísticas de jugadores. Tech stack: Angular, Node.js, MongoDB, WebSockets para actualizaciones live.',
    source: 'trajectory',
    metadata: { category: 'experiencia', empresa: 'Templo Esports', orden: 2 },
  },

  // === Strengths & Values ===
  {
    content:
      'Mentalidad de producto: Entiendo que el código es un medio, no un fin. Enfoco mis esfuerzos en resolver problemas reales del usuario, medir impacto, y iterar rápidamente. Combino rigor técnico con flexibilidad pragmática.',
    source: 'strengths',
    metadata: { category: 'fortaleza', tipo: 'mindset', order: 1 },
  },
  {
    content:
      'Velocidad + Calidad: Puedo desarrollar features complejas rápidamente sin sacrificar arquitectura. Aplico principios SOLID, testing automatizado, y code review riguroso. La deuda técnica no es aceptable si la calidad es el estándar.',
    source: 'strengths',
    metadata: { category: 'fortaleza', tipo: 'ejecucion', order: 2 },
  },
  {
    content:
      'Aprendizaje continuo: El tech evoluciona rápido y así lo hago yo. Siempre explorando nuevas frameworks, patrones, y tecnologías. Hice un máster exploratoria en IA aplicada. Leo papers, hago side projects, y comparto conocimiento.',
    source: 'strengths',
    metadata: { category: 'fortaleza', tipo: 'crecimiento', order: 3 },
  },
  {
    content:
      'Comunicación clara: Traducir complejidad técnica a lenguaje accesible es una skill crítica. Hago buenos PRs, documentación clara, y explicaciones que los stakeholders entienden. El tech es un medio para comunicar ideas.',
    source: 'strengths',
    metadata: { category: 'fortaleza', tipo: 'comunicacion', order: 4 },
  },

  // === Personality Profile ===
  {
    content:
      'Eneagrama 1w9 (Reformer/Perfectionist con ala 9): Tengo una brújula interna fuerte hacia lo correcto y justo. Valoro la integridad, la calidad del trabajo, y la mejora continua. El ala 9 aporta flexibilidad y capacidad de escucha, evitando la rigidez pura del tipo 1.',
    source: 'personality',
    metadata: { category: 'perfil', tipo: 'eneagrama', value: '1w9', order: 1 },
  },
  {
    content:
      'Mis fortalezas eneatipo 1: sentido de responsabilidad, principios éticos, capacidad crítica para mejorar procesos. Mis sombras: perfeccionismo paralizante (mitigado por el ala 9), crítica interna severa, rigidez ante el cambio.',
    source: 'personality',
    metadata: { category: 'perfil', tipo: 'eneagrama', aspecto: 'dinamica', order: 2 },
  },
  {
    content:
      'DISC: Perfil DC (Dominance + Conscientiousness). Soy resultados-oriented, impulsado por objetivos claros y métricos. Valoro datos, eficiencia, y calidad. La conscientiousness equilibra el impulso dominante con planificación y análisis rigoroso.',
    source: 'personality',
    metadata: { category: 'perfil', tipo: 'DISC', value: 'DC', order: 3 },
  },
  {
    content:
      'Fortalezas DISC DC: liderazgo directo, toma de decisiones rápida, foco en calidad, resistencia bajo presión. Sombras: puede venir como demasiado directo, dificultad con feedback negativo, tendencia a micromanagement si no es consciente.',
    source: 'personality',
    metadata: { category: 'perfil', tipo: 'DISC', aspecto: 'dinamica', order: 4 },
  },
  {
    content:
      'Mi estilo de trabajo: Prefiero autonomía y claridad de objetivos. Una vez que sé qué objetivo resolver, encuentro el camino técnico. Trabajo bien en startups y entornos de ambigüedad. Valoro teammates que traen perspectivas diferentes.',
    source: 'personality',
    metadata: { category: 'preferencias', section: 'trabajo', order: 1 },
  },

  // === FAQ ===
  {
    content: '¿Cuál es tu stack tecnológico principal? Angular en frontend, Node.js/NestJS en backend, PostgreSQL y Supabase en datos.',
    source: 'faq',
    metadata: { categoria: 'technical', pregunta: 'stack', order: 1 },
  },
  {
    content:
      '¿Tienes experiencia con IA? Sí, integro Claude API y OpenAI en mis proyectos. Desarrollé un RAG system (Retrieval-Augmented Generation) para este portfolio.',
    source: 'faq',
    metadata: { categoria: 'technical', pregunta: 'IA', order: 2 },
  },
  {
    content:
      '¿Trabajas remoto? Sí, con experiencia en equipos distribuidos. Valoro timezone amigable pero trabajo en horarios flexibles.',
    source: 'faq',
    metadata: { categoria: 'trabajo', pregunta: 'remoto', order: 3 },
  },
  {
    content:
      '¿Qué buscas en tu próxima oportunidad? Un rol donde pueda impactar en producto, trabajar con startups o tech companies, y crecer en IA aplicada.',
    source: 'faq',
    metadata: { categoria: 'trabajo', pregunta: 'oportunidad', order: 4 },
  },
];
