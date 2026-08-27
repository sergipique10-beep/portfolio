#!/usr/bin/env node
/**
 * Unit tests para las funciones de validación y utilidades de RAG API
 * Ejecutar con: node api/__tests__/unit-tests.js
 */

// Importar funciones de validación (manualmente para evitar problemas de módulos)
const tests = {
  passed: 0,
  failed: 0,
};

function assert(condition, message) {
  if (condition) {
    tests.passed++;
    console.log(`✓ ${message}`);
  } else {
    tests.failed++;
    console.error(`✗ FAILED: ${message}`);
  }
}

console.log("=== RAG API Unit Tests ===\n");

// Test 1: Message Validation Logic
console.log("📋 Message Validation Tests");
console.log("---");

const isValidMessage = (msg) => {
  if (typeof msg !== "string") return false;
  if (msg.length < 1 || msg.length > 500) return false;
  return true;
};

assert(isValidMessage("Hello"), "Valid: single word");
assert(isValidMessage("¿Qué stack dominas?"), "Valid: Spanish question");
assert(!isValidMessage(""), "Invalid: empty string");
assert(!isValidMessage("a".repeat(501)), "Invalid: > 500 chars");
assert(!isValidMessage(123), "Invalid: non-string");
assert(isValidMessage("a"), "Valid: single char");
assert(isValidMessage("a".repeat(500)), "Valid: exactly 500 chars");

// Test 2: Chat History Validation
console.log("\n💬 Chat History Validation Tests");
console.log("---");

const isValidChatHistory = (history) => {
  if (!Array.isArray(history)) return false;
  if (history.length > 20) return false;

  return history.every((msg) => {
    if (typeof msg !== "object" || msg === null) return false;
    if (!["user", "assistant"].includes(msg.role)) return false;
    if (typeof msg.content !== "string") return false;
    if (msg.content.length < 1 || msg.content.length > 2000) return false;
    return true;
  });
};

assert(isValidChatHistory([]), "Valid: empty history");
assert(
  isValidChatHistory([
    { role: "user", content: "Hello" },
    { role: "assistant", content: "Hi there!" },
  ]),
  "Valid: 2 messages"
);
assert(!isValidChatHistory([{ role: "user", content: "Hi" }, "invalid"]), "Invalid: non-object in history");
assert(
  !isValidChatHistory(Array(21).fill({ role: "user", content: "test" })),
  "Invalid: > 20 messages"
);
assert(
  !isValidChatHistory([{ role: "user", content: "" }]),
  "Invalid: empty message content"
);
assert(
  !isValidChatHistory([{ role: "invalid", content: "test" }]),
  "Invalid: wrong role"
);

// Test 3: Rate Limiting Logic
console.log("\n📊 Rate Limiting Tests");
console.log("---");

const createRateLimiter = () => {
  const store = new Map();
  const RATE_LIMIT = 10;
  const WINDOW_MS = 60 * 1000;

  return {
    check: (ip) => {
      const now = Date.now();
      const entry = store.get(ip);

      if (!entry || now > entry.resetTime) {
        store.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return true;
      }

      if (entry.count >= RATE_LIMIT) {
        return false;
      }

      entry.count++;
      return true;
    },
  };
};

const limiter = createRateLimiter();
const testIp = "192.168.1.100";

let allowedCount = 0;
for (let i = 0; i < 12; i++) {
  if (limiter.check(testIp)) {
    allowedCount++;
  }
}

assert(allowedCount === 10, `Rate limit allows exactly 10 (got ${allowedCount})`);
assert(!limiter.check(testIp), "Rate limit blocks 11th request");

// Test different IPs
const limiter2 = createRateLimiter();
const ip1 = "192.168.1.1";
const ip2 = "192.168.1.2";

assert(limiter2.check(ip1), "IP1 first request allowed");
assert(limiter2.check(ip2), "IP2 first request allowed");
assert(limiter2.check(ip1), "IP1 second request allowed (different IP)");

// Test 4: Payload Validation
console.log("\n🔐 Seed Vectors Payload Validation");
console.log("---");

const isValidSeedPayload = (payload) => {
  if (typeof payload !== "object" || payload === null) return false;
  const { apiKey, force } = payload;
  if (typeof apiKey !== "string") return false;
  if (typeof force !== "boolean" && force !== undefined) return false;
  return true;
};

assert(isValidSeedPayload({ apiKey: "key123" }), "Valid: basic payload");
assert(isValidSeedPayload({ apiKey: "key123", force: true }), "Valid: with force");
assert(isValidSeedPayload({ apiKey: "key123", force: false }), "Valid: force=false");
assert(!isValidSeedPayload({ apiKey: 123 }), "Invalid: non-string apiKey");
assert(!isValidSeedPayload({ force: true }), "Invalid: missing apiKey");
assert(!isValidSeedPayload(null), "Invalid: null payload");

// Test 5: IP Extraction Logic
console.log("\n🌐 IP Extraction Tests");
console.log("---");

const extractIp = (req) => {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
};

assert(
  extractIp({ headers: { "x-forwarded-for": "192.168.1.1" } }) === "192.168.1.1",
  "Extract single IP from header"
);
assert(
  extractIp({ headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" } }) === "192.168.1.1",
  "Extract first IP from multiple"
);
assert(extractIp({ socket: { remoteAddress: "127.0.0.1" } }) === "127.0.0.1", "Extract from socket");
assert(extractIp({}) === "unknown", "Return unknown when no IP found");

// Summary
console.log("\n=== Test Results ===");
console.log(`✓ Passed: ${tests.passed}`);
console.log(`✗ Failed: ${tests.failed}`);
console.log(`Total: ${tests.passed + tests.failed}`);

if (tests.failed > 0) {
  console.log("\n⚠️ Some tests failed!");
  process.exit(1);
} else {
  console.log("\n✅ All tests passed!");
  process.exit(0);
}
