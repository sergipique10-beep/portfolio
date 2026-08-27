# Task 1 Report — Supabase Setup & Database Schema

**Status:** DONE (with one manual follow-up: service_role key)
**Date:** 2026-08-27

## BASE commit

`3cde650cba757b85a950673512ed2ed32b4e8be2` — "feat: new features"

## Spec source

The referenced plan file `docs/superpowers/plans/2026-08-27-rag-portfolio-implementation.md` **does not exist**.
Implemented against the design spec that does exist:
`docs/superpowers/specs/2026-08-27-rag-portfolio-design.md`, section "Database Design", plus the
global constraints supplied in the task brief (embedding dim = 1536).

## Supabase project

| Field | Value |
|---|---|
| Name | `portfolio-rag` |
| Project ref | `kjrykbcbsugkaxhsahex` |
| Organization | `ncmwegsuqhkmnctyqjir` |
| Region | `eu-west-3` (Paris — lowest latency to Vercel EU + the user) |
| Postgres | 17 |
| Status | ACTIVE_HEALTHY |
| Cost | **$0/month** (free tier; confirmed via `get_cost` before creation) |

A new project was created rather than reusing the only existing one (`TulApp`), which is an
unrelated application.

## Credentials

Written to `.env.local` (gitignored — verified with `git check-ignore`).

```
SUPABASE_URL=https://kjrykbcbsugkaxhsahex.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...CbcRK8   (legacy anon JWT)
SUPABASE_PUBLISHABLE_KEY=sb_publishable_4zJ9o4MAX_4CTxF9yOpLcw_bd8T2TJE
SUPABASE_SERVICE_ROLE_KEY=<EMPTY — manual step required>
```

**Manual step:** the service_role / secret key is not exposed by the Supabase MCP server
(`get_publishable_keys` returns publishable keys only) and the local CLI is unauthenticated
(`LegacyPlatformAuthRequiredError`). Copy it from
https://supabase.com/dashboard/project/kjrykbcbsugkaxhsahex/settings/api-keys
into `.env.local`. Task 2 (`/api/chat`, `/api/seed-vectors`) cannot run without it.

`.env.example` was created and committed as the tracked template.

## Schema applied

Three migrations, applied remotely and checkpointed to `supabase/migrations/` for version control:

| Version | Name |
|---|---|
| 20260827100949 | create_knowledge_chunks |
| 20260827101131 | add_match_knowledge_chunks |
| 20260827101138 | restrict_match_knowledge_chunks_grants |

- `vector` extension **0.8.2** enabled in the `extensions` schema.
- `public.knowledge_chunks(id, content, metadata, embedding vector(1536), source, created_at, updated_at)`.
- `updated_at` trigger via `public.set_updated_at()` (`search_path = ''`).
- `public.match_knowledge_chunks(query_embedding, match_count, filter_source)` RPC — cosine
  similarity search. Needed because supabase-js cannot express a vector `ORDER BY`; execute
  revoked from `anon`/`authenticated`/`public`.
- RLS enabled on the table with **no policies** = deny-all for client keys. Serverless functions
  authenticate with `service_role`, which bypasses RLS.

### Deviations from the spec

1. **HNSW instead of `ivfflat`** for the embedding index. `ivfflat` built on an empty table
   produces useless centroids and would have to be rebuilt after seeding; HNSW is valid on an
   empty table, builds incrementally, and gives better recall/latency. 1536 dims is within HNSW's
   2000-dim limit.
2. **`timestamptz` instead of `timestamp`**, and `bigint generated always as identity` instead of
   `BIGSERIAL` (Postgres best-practice defaults).
3. `source` constrained by CHECK to the spec's enumerated values plus `trajectory` and
   `strengths`, which the spec's "Knowledge Base Content" list names as separate sources.
4. Added `idx_knowledge_chunks_source` (btree) and `idx_knowledge_chunks_metadata`
   (GIN, `jsonb_path_ops`) beyond the spec's single index.
5. Added the `match_knowledge_chunks` RPC (arguably Task 2 scope, but retrieval is not expressible
   from the client library without it).

## Verification

| Check | Result |
|---|---|
| `pg_extension` has `vector` | PASS — v0.8.2 |
| Table + 4 indexes present (`pg_indexes`) | PASS |
| Insert 2 rows, 1536 dims each | PASS |
| `match_knowledge_chunks` cosine ordering | PASS — orthonormal probes returned similarity 1.0 and 0.0 in the correct order |
| `updated_at` trigger fires on UPDATE | PASS |
| HNSW index actually chosen (`EXPLAIN`, `enable_seqscan=off`) | PASS — `Index Scan using idx_knowledge_chunks_embedding` |
| Test rows cleaned up | PASS — table has 0 rows |
| Security advisors | Only `rls_enabled_no_policy` (INFO) — intentional deny-all |
| `.env.local` ignored by git | PASS — `git check-ignore` matches `.gitignore:48` |

**CLI connectivity:** the Supabase CLI (`npx supabase`, v2.116.0) is **not** authenticated —
`supabase projects list` fails with `LegacyPlatformAuthRequiredError`. All work was done through
the authenticated Supabase MCP server instead, which is fully functional. Run `supabase login`
(or set `SUPABASE_ACCESS_TOKEN`) if CLI-driven migrations are wanted later; `supabase link
--project-ref kjrykbcbsugkaxhsahex` would then pick up the checkpointed `supabase/migrations/`.

## Concerns / blockers for later tasks

1. **`SUPABASE_SERVICE_ROLE_KEY` is empty** — manual dashboard copy required (see above).
2. **Anthropic has no embeddings API.** The spec (line 79, 595) assumes an Anthropic
   `embed-3.5-turbo`; no such model exists. The embedding dimension of 1536 matches OpenAI's
   `text-embedding-3-small` / Voyage `voyage-3` (Anthropic's recommended embeddings partner).
   **This must be resolved before Task 2/3** — whichever provider is chosen must emit 1536 dims or
   the column and index need altering. Flagging rather than deciding, as it is a spec-level choice.
3. **Free-tier projects pause after ~1 week of inactivity.** A paused project will 503 the chat
   endpoint. Worth a keep-alive ping or an upgrade before launch.
4. The named plan document does not exist; Task 1 was inferred from the design spec. If a plan
   with different acceptance criteria surfaces, re-check this work against it.
5. `ivfflat` vs HNSW (deviation 1) should be confirmed acceptable by the plan owner.

## Commits

- `<commit-1>` — chore(rag): provision Supabase project and knowledge_chunks schema
