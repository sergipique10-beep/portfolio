-- Enable pgvector
create extension if not exists vector with schema extensions;

-- Knowledge base chunks for RAG retrieval
create table public.knowledge_chunks (
  id bigint generated always as identity primary key,
  content text not null check (char_length(content) > 0),
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1536) not null,
  source text not null check (source in ('cv','skills','projects','personality','faq','trajectory','strengths')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.knowledge_chunks is 'Vectorized chunks of Sergi Pique profile data for RAG retrieval. Written/read server-side via service_role only.';
comment on column public.knowledge_chunks.embedding is '1536-dim embedding vector; cosine distance used for similarity search.';

-- Similarity search index (HNSW: better recall/latency than ivfflat and valid on an empty table)
create index idx_knowledge_chunks_embedding
  on public.knowledge_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- Filtering by source
create index idx_knowledge_chunks_source on public.knowledge_chunks (source);

-- Metadata containment queries
create index idx_knowledge_chunks_metadata on public.knowledge_chunks using gin (metadata jsonb_path_ops);

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_knowledge_chunks_updated_at
  before update on public.knowledge_chunks
  for each row execute function public.set_updated_at();

-- RLS: deny all client-side access. Serverless functions use the service_role key (bypasses RLS).
alter table public.knowledge_chunks enable row level security;
