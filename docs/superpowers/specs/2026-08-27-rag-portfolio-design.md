# RAG Portfolio Assistant with Babysharky — Design Specification

**Date:** 2026-08-27  
**Author:** Claude Code  
**Status:** Design Phase  
**Scope:** New feature for Sergi Piqué's portfolio

---

## Executive Summary

This spec defines a **Retrieval-Augmented Generation (RAG) system** integrated into Sergi Piqué's Angular portfolio. Users can ask natural language questions about Sergi's background, skills, projects, personality, and experience. The system retrieves relevant context from a vectorized knowledge base (Supabase + pgvector) and generates personalized responses via Claude API.

**Key Features:**
- Chat interface via a professional drawer panel (bottom-right)
- Babysharky mascot (fixed, floating, animated) as chat trigger
- Semantic search over Sergi's complete profile (CV, skills, projects, personality—eneagrama 1w9 + DISC DC)
- Streaming responses for real-time UX
- Rate limiting, validation, and robust error handling
- Serverless architecture (Vercel + Supabase)

---

## Requirements

### Functional Requirements

| Req | Description | Priority |
|-----|-------------|----------|
| FR1 | Users can ask questions in a chat drawer | MUST |
| FR2 | System retrieves relevant context from vectorized knowledge base | MUST |
| FR3 | Claude API generates contextual responses | MUST |
| FR4 | Babysharky floats in fixed position, animates, opens drawer on click | MUST |
| FR5 | Chat responses stream in real-time (typing effect) | SHOULD |
| FR6 | Drawer slides in smoothly from right side | MUST |
| FR7 | User can close drawer; chat history persists in session | SHOULD |
| FR8 | Admin can seed/update knowledge base via API | MUST |

### Non-Functional Requirements

| Req | Description | Priority |
|-----|-------------|----------|
| NFR1 | Chat response latency < 3 seconds (90th percentile) | MUST |
| NFR2 | Rate limiting: 10 requests/min per IP | MUST |
| NFR3 | API key authentication for sensitive endpoints | MUST |
| NFR4 | Graceful degradation on service failures (user-friendly errors) | MUST |
| NFR5 | Mobile-responsive chat drawer | SHOULD |
| NFR6 | Logging and error tracking (Vercel analytics) | SHOULD |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│ Angular Portfolio (Vercel)                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Babysharky (fixed, bottom-right, animated)             │  │
│ │ + Chat Drawer (opens on click, 400px width)            │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
           ↓ HTTP POST /api/chat (streaming)
┌──────────────────────────────────────────────────────────────┐
│ Vercel Serverless Functions                                  │
│ • POST /api/chat — Query + retrieval + Claude integration   │
│ • POST /api/seed-vectors — One-time data ingestion          │
│ • Error handling, rate limiting, validation                 │
└──────────────────────────────────────────────────────────────┘
           ↓ SQL queries + embeddings
┌──────────────────────────────────────────────────────────────┐
│ Supabase (PostgreSQL + pgvector)                             │
│ • knowledge_chunks table (vectors, metadata, source)         │
│ • Similarity search via pgvector cosine operator             │
│ • Storage for chat session data (optional)                   │
└──────────────────────────────────────────────────────────────┘
           ↓ API calls
┌──────────────────────────────────────────────────────────────┐
│ External Services                                            │
│ • Anthropic API — Embeddings (embed-3.5-turbo or claude)    │
│ • Anthropic API — Message generation (claude-opus-5)        │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Design

### Table: `knowledge_chunks`

```sql
CREATE TABLE knowledge_chunks (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,                    -- Chunk text (500 chars ~)
  metadata JSONB,                           -- { category, section, order }
  embedding vector(1536) NOT NULL,          -- Anthropic embed model
  source TEXT NOT NULL,                     -- "cv" | "skills" | "projects" | "personality" | "faq"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast similarity search
CREATE INDEX idx_knowledge_chunks_embedding 
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);

-- Metadata example:
-- { "category": "skills", "section": "backend", "order": 1 }
-- { "category": "projects", "project": "CsFinance", "detail": "steam-api-integration" }
-- { "category": "personality", "type": "eneagrama", "value": "1w9" }
```

### Knowledge Base Content

**Sources to vectorize:**
1. **CV & Professional Summary** (Resumen profesional, datos contacto)
2. **Tech Stack** (Frontend, Backend, Databases, Cloud, Auth, IA integrations)
3. **Projects** (CsFinance, DevHub — full descriptions + tech used)
4. **Trajectory** (SPLAI, Templo Esports)
5. **Strengths** (Business + code profile, entrepreneurial mindset, applied IA)
6. **FAQ Q&A** (Pre-formatted Q&A pairs from PDF)
7. **Personality Profile**
   - Eneagrama: Type 1w9 (Reformer/Perfectionist with 9-wing) — values correctness, integrity, justice, emotional regulation
   - DISC: DC profile (Dominance + Conscientiousness) — results-oriented, quality-focused, logical problem-solving
   - Key traits, emotional management, work translation

### Chunking Strategy

- **Chunk size:** ~400–600 characters (semantic boundary respecting)
- **Overlap:** 50-100 characters between chunks (context preservation)
- **Tool:** Recursive text splitter (LangChain or custom)
- **Metadata tagging:** Every chunk includes `source` and structured metadata for filtering/context

---

## Frontend Design

### New Components

#### 1. **Babysharky Component** (`src/app/components/babysharky/`)

**File Structure:**
```
babysharky/
├── babysharky.ts (component)
├── babysharky.css (styles + animations)
└── babysharky.svg (or PNG logo asset)
```

**Specifications:**
- **Position:** `position: fixed; bottom: 20px; right: 20px; z-index: 1000`
- **Size:** 80px × 80px (responsive to 60px on mobile)
- **Logo:** cyan/turquoise + dark blue gradient (match brand colors)
- **Animations:**
  - **Levitate:** Gentle bobbing motion (±5px vertical, 4s loop, ease-in-out)
  - **Glow effect:** Subtle box-shadow pulse (cyan glow, 2s loop)
  - **Hover:** Scale up 1.1x, intensify glow
- **Interaction:** Click → emit event to open drawer
- **Optional:** Unread message badge (small circle, top-right corner)

**Code pattern:**
```typescript
@Component({
  selector: 'app-babysharky',
  template: `<div class="babysharky" (click)="onOpen()" [attr.aria-label]="'Abrir chat'">
    <img src="/assets/babysharky.svg" alt="Chat mascot" />
  </div>`,
  styleUrls: ['./babysharky.css']
})
export class BabysharkyComponent {
  @Output() openChat = new EventEmitter<void>();
  
  onOpen() {
    this.openChat.emit();
  }
}
```

#### 2. **Chat Drawer Component** (`src/app/components/chat-drawer/`)

**File Structure:**
```
chat-drawer/
├── chat-drawer.ts (component)
├── chat-drawer.css (styles)
├── message-item.ts (sub-component)
└── message-item.css
```

**Specifications:**
- **Width:** 400px on desktop, 100% on mobile (< 768px breakpoint)
- **Position:** Slides in from right; overlay with semi-transparent backdrop (#000, 0.3 opacity)
- **Header:** "Pregúntame sobre mí" + close button (X)
- **Body:** 
  - Message list (scrollable, max-height ~400px)
  - Each message: user (right, light bg) vs assistant (left, darker bg)
  - Timestamps optional but nice-to-have
- **Footer:**
  - Input field (textarea, min-height 40px, auto-expand up to 120px)
  - Send button (icon + text, disabled while loading)
  - Hint text: "Pregunta sobre mis habilidades, proyectos, o personalidad"

**Interaction Flow:**
1. User types message
2. Click send (or Ctrl+Enter)
3. Input disables, shows loading spinner
4. Message appears in list (user side)
5. Placeholder "Escribiendo..." appears (assistant side)
6. Response streams in, replacing placeholder
7. Input re-enables

**Chat History:**
- Store in component state (Array of `{ role: 'user' | 'assistant'; content: string; timestamp: Date }`)
- Persist in sessionStorage (clears on tab close) OR local state only
- Max 20 messages in memory (prevent context bloat)

#### 3. **RagService** (`src/app/services/rag.service.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class RagService {
  constructor(private http: HttpClient) {}
  
  // POST /api/chat → Returns Observable<string> (streaming via Server-Sent Events or chunked response)
  chat(message: string, chatHistory: Message[]): Observable<string> {
    const payload = {
      message,
      chatHistory: chatHistory.slice(-10) // Last 10 messages for context
    };
    return this.http.post<{ response: string }>('/api/chat', payload)
      .pipe(map(res => res.response));
  }
}
```

#### 4. **Layout Integration**

Add `<app-babysharky (openChat)="openDrawer()"></app-babysharky>` to main `app.ts`  
Add `<app-chat-drawer *ngIf="drawerOpen" (close)="drawerOpen = false"></app-chat-drawer>` to main `app.ts`

---

## API Design

### Endpoint 1: `POST /api/chat`

**Request:**
```json
{
  "message": "¿Qué experiencia tienes con IA?",
  "chatHistory": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¡Hola! Soy un asistente RAG sobre Sergi..." }
  ]
}
```

**Process:**
1. Validate input (message: 1–500 chars, chatHistory: max 20 items)
2. Check API key header (`x-api-key`)
3. Enforce rate limit (10 req/min per IP)
4. Generate embedding of user message (Anthropic API)
5. Query Supabase: `SELECT content, source FROM knowledge_chunks ORDER BY embedding <-> $1 LIMIT 8`
6. Build context string from top chunks
7. Call Claude API with system prompt + context + chat history + user message
8. Stream response back to client (Server-Sent Events or chunked JSON)

**Response:**
```
200 OK
Content-Type: text/event-stream (or application/x-ndjson)

data: {"chunk":"Tengo experiencia..."}\n
data: {"chunk":" integrando la"}\n
data: {"chunk":" Claude API"}\n
...
data: {"done":true}\n
```

**Error Responses:**
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing/invalid API key
- `429 Too Many Requests` — Rate limit exceeded
- `500 Internal Server Error` — Supabase/Claude API failure (with fallback message)
- `504 Gateway Timeout` — Claude API timeout

---

### Endpoint 2: `POST /api/seed-vectors`

**Request:**
```json
{
  "apiKey": "secret-key-here",
  "force": false
}
```

**Process:**
1. Validate API key
2. If `knowledge_chunks` already has data and `force=false` → return warning (prevent duplicates)
3. Read knowledge base document (PDF + personality profile)
4. Chunk content (recursive splitter, ~500 chars)
5. Generate embeddings for each chunk (batch API calls to Anthropic)
6. Insert into Supabase with metadata
7. Return summary: `{ chunksCreated: 42, tokensUsed: 15000, duration: "3.2s" }`

**Response:**
```json
{
  "success": true,
  "chunksCreated": 42,
  "sources": {
    "cv": 8,
    "skills": 12,
    "projects": 10,
    "personality": 8,
    "faq": 4
  },
  "tokensUsed": 15000,
  "durationSeconds": 3.2
}
```

**Error Handling:**
- `409 Conflict` — Knowledge base already seeded (use `force: true` to override)
- `500 Internal Server Error` — Embedding generation failure (with retry suggestion)

---

## Validation & Error Handling

### Input Validation

```typescript
// POST /api/chat
if (!message || typeof message !== 'string') return 400;
if (message.length < 1 || message.length > 500) return 400;
if (!Array.isArray(chatHistory) || chatHistory.length > 20) return 400;

// Each history item
chatHistory.forEach(m => {
  if (!['user', 'assistant'].includes(m.role)) return 400;
  if (!m.content || m.content.length > 2000) return 400;
});
```

### Rate Limiting

```typescript
// Middleware (simple in-memory store, or use external service)
const requestCounts = new Map(); // IP → count

function checkRateLimit(ip: string) {
  const count = requestCounts.get(ip) || 0;
  if (count >= 10) return false; // Reject
  requestCounts.set(ip, count + 1);
  // Reset every 60 seconds
  setTimeout(() => requestCounts.delete(ip), 60000);
  return true;
}
```

### Error Handling Strategy

| Scenario | Status | Message | Retry? |
|----------|--------|---------|--------|
| Supabase down | 503 | "Servicio temporal no disponible" | Auto retry 3x |
| Claude timeout (>30s) | 504 | "Respuesta lenta, intenta de nuevo" | User clicks retry |
| Token limit exceeded | 400 | "Tu pregunta es muy larga, intenta simplificarla" | No |
| Empty response | 200 | "Disculpa, no entendí bien. ¿Puedes reformular?" | User reformulates |
| Embedding gen fails | 500 | "Error procesando tu pregunta" | Auto retry 1x |

**Logging:**
- Every request: timestamp, IP, message preview, chunks used, latency
- Every error: stack trace, request context, error code
- Aggregate to Vercel Analytics dashboard

---

## Testing Strategy

### Unit Tests

```typescript
// test/validation.spec.ts
describe('Input Validation', () => {
  it('rejects empty messages', () => {
    expect(validateMessage('')).toBeFalsy();
  });
  
  it('rejects messages > 500 chars', () => {
    const longMsg = 'a'.repeat(501);
    expect(validateMessage(longMsg)).toBeFalsy();
  });
  
  it('rejects chat history > 20 items', () => {
    const history = Array(21).fill({ role: 'user', content: 'test' });
    expect(validateChatHistory(history)).toBeFalsy();
  });
});

// test/chunking.spec.ts
describe('PDF Chunking', () => {
  it('produces non-empty chunks', () => {
    const chunks = chunkPDF(samplePDF);
    expect(chunks.every(c => c.length > 0)).toBeTruthy();
  });
  
  it('preserves chunk overlap', () => {
    const chunks = chunkPDF(samplePDF, { overlap: 100 });
    // Verify next chunk starts near end of previous chunk
  });
});
```

### Integration Tests

```typescript
// test/supabase.integration.spec.ts
describe('Supabase Queries', () => {
  it('inserts and retrieves chunks', async () => {
    await client.from('knowledge_chunks').insert(testChunk);
    const result = await client.from('knowledge_chunks').select('*');
    expect(result.data.length).toBeGreaterThan(0);
  });
  
  it('similarity search returns relevant chunks', async () => {
    const query = 'What is Sergi\'s experience with AI?';
    const embedding = await generateEmbedding(query);
    const results = await similaritySearch(embedding, 5);
    expect(results.some(r => r.source === 'faq')).toBeTruthy();
  });
});

// test/api.integration.spec.ts
describe('POST /api/chat', () => {
  it('returns 400 for invalid input', async () => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '', chatHistory: [] })
    });
    expect(res.status).toBe(400);
  });
  
  it('returns 429 after 10 requests in 60s', async () => {
    for (let i = 0; i < 11; i++) {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'x-api-key': 'test-key' },
        body: JSON.stringify({ message: 'test', chatHistory: [] })
      });
      if (i < 10) expect(res.status).toBe(200);
      else expect(res.status).toBe(429);
    }
  });
  
  it('streams response correctly', async () => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hola', chatHistory: [] })
    });
    const reader = res.body.getReader();
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += new TextDecoder().decode(value);
    }
    expect(fullText.length).toBeGreaterThan(0);
  });
});
```

### E2E Tests (Playwright/Cypress)

```typescript
describe('Chat Drawer E2E', () => {
  it('opens drawer on babysharky click', async () => {
    await page.click('[data-testid="babysharky"]');
    await expect(page.locator('[data-testid="drawer"]')).toBeVisible();
  });
  
  it('sends message and receives response', async () => {
    await page.fill('[data-testid="input"]', '¿Qué stack dominas?');
    await page.click('[data-testid="send-btn"]');
    await expect(page.locator('.message-assistant')).toContainText('Angular');
  });
  
  it('closes drawer on close button click', async () => {
    await page.click('[data-testid="close-btn"]');
    await expect(page.locator('[data-testid="drawer"]')).not.toBeVisible();
  });
});
```

---

## Deployment Plan

### Phase 1: Setup (Day 1)
- [ ] Create Supabase project, enable pgvector extension
- [ ] Create `knowledge_chunks` table with indices
- [ ] Generate Anthropic API keys (embeddings + Claude)
- [ ] Create Vercel environment variables
- [ ] Set up GitHub Actions (optional: auto-deploy on push)

### Phase 2: Backend (Days 2-3)
- [ ] Implement Vercel Functions: `/api/chat`, `/api/seed-vectors`
- [ ] Add rate limiting, input validation, error handling
- [ ] Integration tests with Supabase
- [ ] Manual testing of API endpoints

### Phase 3: Data Ingestion (Day 4)
- [ ] Prepare knowledge base (PDF + personality profile markdown)
- [ ] Run `/api/seed-vectors` to populate `knowledge_chunks`
- [ ] Verify data in Supabase dashboard
- [ ] Test similarity search queries manually

### Phase 4: Frontend (Days 5-6)
- [ ] Create Babysharky component (logo, animations, styling)
- [ ] Create Chat Drawer component (layout, input, message display)
- [ ] Implement RagService (HTTP client for `/api/chat`)
- [ ] Integration with main `app.ts` layout
- [ ] Local testing in dev server

### Phase 5: Polish & Testing (Days 7-8)
- [ ] E2E tests (Playwright)
- [ ] Cross-browser & mobile testing
- [ ] Performance profiling (Lighthouse)
- [ ] Adjust animations, timing, UX based on feedback
- [ ] Final bug fixes

### Phase 6: Launch (Day 9)
- [ ] Deploy to Vercel (auto via GitHub or manual `vercel deploy`)
- [ ] Smoke test in production (send test queries)
- [ ] Monitor logs & error rates (24h)
- [ ] Gather user feedback

---

## Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Chat response latency (p90) | < 3s | Perceived UX speed |
| Uptime | > 99% | Reliability signal |
| Embedding accuracy (manual QA) | > 85% relevance | Knowledge base quality |
| Error rate | < 1% | Stability |
| Mobile usability score | > 85 (Lighthouse) | Mobile-first UX |
| User engagement (bounces) | < 20% | Feature adoption |

---

## Security Considerations

1. **API Key Management:**
   - Store `x-api-key` in Vercel environment variables (not in code)
   - Rotate keys every 90 days
   - Log failed auth attempts

2. **Rate Limiting:**
   - Per-IP limits (10 req/min) prevent abuse
   - Consider geo-blocking if needed (very strict)

3. **Data Privacy:**
   - Knowledge base is public (no PII beyond LinkedIn)
   - Chat history stored in sessionStorage (client-side, cleared on tab close)
   - No logs of user messages after 30 days (GDPR compliance)

4. **Injection Attacks:**
   - Validate & sanitize all user inputs
   - Use parameterized queries (Supabase client prevents SQL injection)
   - Escape message content when rendering in HTML

5. **Claude API Usage:**
   - Implement cost controls (alert if bill > threshold)
   - Monitor token usage per request
   - Set max tokens per response (e.g., 500)

---

## Future Enhancements (Out of Scope)

- [ ] Multi-language support (Spanish + English)
- [ ] Analytics dashboard (most common questions)
- [ ] Chat persistence (save & load previous conversations)
- [ ] Voice input/output (TTS + STT)
- [ ] Share chat transcripts (via link)
- [ ] Suggest follow-up questions ("Did you also want to know...?")
- [ ] Admin panel for knowledge base management (update, delete chunks)

---

## Open Questions / TBD

- Embedding model: Anthropic `embed-3.5-turbo` vs OpenAI `text-embedding-3-small`? (Recommend Anthropic for consistency)
- Claude model version: `claude-opus-5` or `claude-sonnet-5`? (Recommend Opus for quality)
- Chat history limit: 10 messages (context window) or 20? (Set to 10 to be safe)
- Streaming format: Server-Sent Events (SSE) or newline-delimited JSON (NDJSON)? (SSE simpler for Angular)

---

## Document Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-08-27 | Initial specification |

