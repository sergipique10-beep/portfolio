/**
 * Manual testing script for RAG API endpoints
 * Run with: npx ts-node api/__tests__/manual-test.ts
 *
 * Set BASE_URL environment variable to override default (e.g., http://localhost:3000)
 */

import { validateMessage, validateChatHistory, validateSeedVectorsPayload } from '../utils/validation';
import { checkRateLimit } from '../middleware/rateLimit';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test suite
const tests = {
  passed: 0,
  failed: 0,
  skipped: 0,
};

function assert(condition: boolean, message: string) {
  if (condition) {
    tests.passed++;
    console.log(`✓ ${message}`);
  } else {
    tests.failed++;
    console.error(`✗ ${message}`);
  }
}

function skip(message: string) {
  tests.skipped++;
  console.log(`⊘ ${message} (skipped)`);
}

console.log('=== RAG API Manual Tests ===\n');

// 1. Validation Tests
console.log('📋 Validation Tests');
console.log('---');

// Message validation
assert(validateMessage('Hello'), 'Valid message (single word)');
assert(validateMessage('A question about my skills'), 'Valid message (sentence)');
assert(!validateMessage(''), 'Rejects empty message');
assert(!validateMessage('a'.repeat(501)), 'Rejects message > 500 chars');
assert(!validateMessage(123 as any), 'Rejects non-string message');

// Chat history validation
assert(validateChatHistory([]), 'Valid empty chat history');
assert(
  validateChatHistory([
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' },
  ]),
  'Valid chat history with 2 messages'
);
assert(!validateChatHistory([{ role: 'user', content: 'Hello' }, 'invalid']), 'Rejects invalid message in history');
assert(
  !validateChatHistory(Array(21).fill({ role: 'user', content: 'test' })),
  'Rejects chat history > 20 messages'
);

// Seed vectors payload validation
assert(validateSeedVectorsPayload({ apiKey: 'key123' }), 'Valid seed payload (basic)');
assert(validateSeedVectorsPayload({ apiKey: 'key123', force: true }), 'Valid seed payload (with force)');
assert(!validateSeedVectorsPayload({ apiKey: 123 }), 'Rejects invalid apiKey type');
assert(!validateSeedVectorsPayload({ force: true }), 'Rejects missing apiKey');

// 2. Rate Limiting Tests
console.log('\n📊 Rate Limiting Tests');
console.log('---');

const testIp = '192.168.1.1';
let allowed = 0;
for (let i = 0; i < 12; i++) {
  if (checkRateLimit(testIp)) {
    allowed++;
  }
}
assert(allowed === 10, `Rate limit allows exactly 10 requests (got ${allowed})`);
assert(!checkRateLimit(testIp), 'Rate limit rejects 11th request');

// 3. API Endpoint Tests (HTTP)
console.log('\n🌐 API Endpoint Tests (requires running server)');
console.log('---');

async function testEndpoints() {
  // Skip if server not running
  try {
    await fetch(`${BASE_URL}/api/chat`, { method: 'OPTIONS' });
  } catch (e) {
    skip('Server not running at ' + BASE_URL);
    console.log(
      `Tip: Start server with 'vercel dev' or 'npm run dev' and set BASE_URL if using different port`
    );
    return;
  }

  // Test 1: Invalid POST to /api/chat
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', chatHistory: [] }),
    });
    assert(res.status === 400, 'POST /api/chat rejects empty message (400)');
  } catch (e) {
    console.error('Failed to test /api/chat:', e);
  }

  // Test 2: Valid query to /api/chat
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hola', chatHistory: [] }),
    });
    assert(res.status === 200, 'POST /api/chat accepts valid message (200)');
    assert(res.headers.get('Content-Type') === 'text/event-stream', 'Returns Server-Sent Events');
  } catch (e) {
    console.error('Failed to test valid /api/chat:', e);
  }

  // Test 3: Seed vectors (requires valid API key)
  const ragApiKey = process.env.RAG_API_KEY || 'test-key';
  try {
    const res = await fetch(`${BASE_URL}/api/seed-vectors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'invalid' }),
    });
    assert(res.status === 401, 'POST /api/seed-vectors rejects invalid key (401)');
  } catch (e) {
    console.error('Failed to test /api/seed-vectors auth:', e);
  }
}

await testEndpoints();

// 4. Summary
console.log('\n=== Test Results ===');
console.log(`✓ Passed: ${tests.passed}`);
console.log(`✗ Failed: ${tests.failed}`);
console.log(`⊘ Skipped: ${tests.skipped}`);
console.log(`Total: ${tests.passed + tests.failed + tests.skipped}`);

process.exit(tests.failed > 0 ? 1 : 0);
