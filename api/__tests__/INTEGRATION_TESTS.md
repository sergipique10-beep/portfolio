# Integration Tests for RAG API

## Setup

Before running tests, ensure:
1. `.env.local` has all required keys: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `RAG_API_KEY`
2. Supabase project is active and `knowledge_chunks` table exists
3. Test server is running (e.g., `vercel dev`)

## Endpoint: POST /api/seed-vectors

### Test 1: Successful seed (first time)
```bash
curl -X POST http://localhost:3000/api/seed-vectors \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"YOUR_RAG_API_KEY"}'
```

**Expected:** 200 OK
```json
{
  "success": true,
  "chunksCreated": 6,
  "tokensUsed": 1500,
  "durationSeconds": "2.3",
  "sources": { "cv": 1, "skills": 1, "projects": 1, "trajectory": 1, "personality": 2 }
}
```

### Test 2: Seed with force override
```bash
curl -X POST http://localhost:3000/api/seed-vectors \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"YOUR_RAG_API_KEY","force":true}'
```

**Expected:** 200 OK (overwrites existing data)

### Test 3: Invalid API key
```bash
curl -X POST http://localhost:3000/api/seed-vectors \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"wrong-key"}'
```

**Expected:** 401 Unauthorized
```json
{ "error": "Invalid API key." }
```

### Test 4: Already seeded (no force)
```bash
curl -X POST http://localhost:3000/api/seed-vectors \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"YOUR_RAG_API_KEY"}'
```

**Expected:** 409 Conflict (after first seed)
```json
{ "error": "Knowledge base already seeded. Use force: true to override.", "existingCount": 6 }
```

---

## Endpoint: POST /api/chat

### Test 1: Valid query (Spanish)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Qué experiencia tienes con IA?",
    "chatHistory": []
  }'
```

**Expected:** 200 OK (text/event-stream)
```
data: {"chunk":"Tengo experiencia..."}
data: {"chunk":" integrando la"}
...
data: {"done":true,"chunksUsed":5}
```

### Test 2: Empty message
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"","chatHistory":[]}'
```

**Expected:** 400 Bad Request
```json
{ "error": "Invalid message. Must be 1-500 characters." }
```

### Test 3: Message > 500 chars
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"'$(printf 'a%.0s' {1..501})'","chatHistory":[]}'
```

**Expected:** 400 Bad Request

### Test 4: Invalid chat history (> 20 messages)
```bash
HISTORY=$(node -e "console.log(JSON.stringify(Array(21).fill({role:'user',content:'test'})))")
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"hi\",\"chatHistory\":$HISTORY}"
```

**Expected:** 400 Bad Request

### Test 5: Rate limiting (10 req/min per IP)
```bash
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"test '"$i"'","chatHistory":[]}'
done
```

**Expected:** First 10 return 200, 11th returns 429
```json
{ "error": "Too many requests. Max 10 per minute per IP." }
```

### Test 6: With chat history
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Y en backend?",
    "chatHistory": [
      {"role":"user","content":"¿Qué stack dominas?"},
      {"role":"assistant","content":"Domino Angular, Node.js, Express, MongoDB..."}
    ]
  }'
```

**Expected:** 200 OK (streaming response using context)

---

## Endpoint: Streaming Response Format

The `/api/chat` endpoint streams Server-Sent Events (SSE):
- Each chunk arrives as `data: {"chunk":"text"}\n`
- Final message: `data: {"done":true,"chunksUsed":N}\n`

To capture full response in bash:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola","chatHistory":[]}' \
  | grep -o '"chunk":"[^"]*"' | tail -1
```

---

## Error Handling Tests

### Test: Supabase down
- Stop Supabase or change `SUPABASE_URL` to invalid URL
- Expected: 500 Internal Server Error

### Test: OpenAI API failure
- Use invalid `OPENAI_API_KEY`
- Expected: 500 Internal Server Error

### Test: Claude timeout
- Known limitation: if Claude takes > 30s, may timeout
- Expected: 504 Gateway Timeout (if using Vercel timeout)

---

## Success Criteria

- ✅ Seed endpoint creates chunks with correct metadata
- ✅ Chat endpoint validates inputs correctly
- ✅ Chat endpoint performs rate limiting per IP
- ✅ Chat endpoint streams responses correctly
- ✅ Error responses have correct status codes
- ✅ Streaming format is SSE (newline-delimited JSON)
- ✅ Supabase queries return relevant chunks
- ✅ Claude responses are contextual (uses provided chunks)
