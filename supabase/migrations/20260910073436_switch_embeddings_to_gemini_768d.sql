-- Switch embedding provider from OpenAI (1536d) to Gemini gemini-embedding-001 (768d).
-- Existing rows were seeded with mock/OpenAI vectors incompatible with the new
-- dimensionality, so the table is cleared and will be re-seeded with real
-- Gemini embeddings via api/seed-knowledge-base.js.

truncate table public.knowledge_chunks;

drop index if exists public.idx_knowledge_chunks_embedding;

alter table public.knowledge_chunks
  drop column embedding;

alter table public.knowledge_chunks
  add column embedding extensions.vector(768) not null;

comment on column public.knowledge_chunks.embedding is '768-dim embedding vector (Gemini gemini-embedding-001); cosine distance used for similarity search.';

create index idx_knowledge_chunks_embedding
  on public.knowledge_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- Same function signature (vector is not overloaded by typmod), so the existing
-- revoke on public.match_knowledge_chunks(extensions.vector, int, text) still applies.
create or replace function public.match_knowledge_chunks(
  query_embedding extensions.vector(768),
  match_count int default 8,
  filter_source text default null
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  source text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    kc.id,
    kc.content,
    kc.metadata,
    kc.source,
    1 - (kc.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.knowledge_chunks kc
  where filter_source is null or kc.source = filter_source
  order by kc.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 50);
$$;
