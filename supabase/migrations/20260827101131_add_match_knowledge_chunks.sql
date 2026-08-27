-- Similarity search RPC (supabase-js cannot express a vector ORDER BY directly)
create or replace function public.match_knowledge_chunks(
  query_embedding extensions.vector(1536),
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
