-- Retrieval is server-side only; no browser-facing role may call the RPC.
revoke execute on function public.match_knowledge_chunks(extensions.vector, int, text) from anon, authenticated, public;
