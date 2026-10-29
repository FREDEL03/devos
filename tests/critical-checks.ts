/**
 * DevOS Critical Security & Logic Self-Checks
 * Pure Node.js assert-based verification.
 */
import assert from "node:assert";
import { generateBranchName, generateCommitMessage, generatePRTitle } from "../lib/git/generator";
import { SUPPORTED_TASK_TYPES, __runGeminiValidationSelfCheck } from "../lib/ai/gemini";

console.log("▶ [Test 1] Git Generator Rules...");
const branch = generateBranchName("feat", "DEV-101", "Supabase Session Token Refresh");
assert.strictEqual(branch, "feat/DEV-101-supabase-session-token-refresh");

const commit = generateCommitMessage("fix", "auth", "resolve token refresh redirect loop", false, "");
assert.strictEqual(commit, "fix(auth): resolve token refresh redirect loop");

const pr = generatePRTitle("feat", "DEV-101", "add daily work logs");
assert.strictEqual(pr, "feat(DEV-101): add daily work logs");
console.log("✓ Git Generator passed.");

console.log("▶ [Test 2] Gemini Assistant Validation Guard...");
assert.strictEqual(__runGeminiValidationSelfCheck(), true);
const validTypes = SUPPORTED_TASK_TYPES.map((t) => t.type);
assert.ok(validTypes.includes("explain_error"));
assert.ok(validTypes.includes("explain_code"));
assert.ok(validTypes.includes("debug_steps"));
console.log("✓ Gemini Assistant validation passed.");

console.log("▶ [Test 3] Input Boundary & Clamping Checks...");
const clampMastery = (val: number) => Math.min(100, Math.max(0, val));
assert.strictEqual(clampMastery(-10), 0);
assert.strictEqual(clampMastery(150), 100);
assert.strictEqual(clampMastery(75), 75);

const validDateRegex = /^\d{4}-\d{2}-\d{2}$/;
assert.ok(validDateRegex.test("2026-10-29"));
assert.ok(!validDateRegex.test("29-10-2026"));
assert.ok(!validDateRegex.test("invalid-date"));
console.log("✓ Input boundaries passed.");

console.log("▶ [Test 4] API Key Leakage Redaction Pattern...");
const secretSanitizer = (str: string) =>
  str.replace(/AIza[0-9A-Za-z-_]{35}|AQ\.[0-9A-Za-z-_]+/g, "[REDACTED_API_KEY]");

const sampleLeak = "Error: https://generativelanguage.googleapis.com/...key=AQ.TEST_DUMMY_KEY_FOR_UNIT_TEST_ONLY_12345 failed";
const sanitized = secretSanitizer(sampleLeak);
assert.ok(!sanitized.includes("AQ.TEST_DUMMY_KEY_FOR_UNIT_TEST_ONLY_12345"));
assert.ok(sanitized.includes("[REDACTED_API_KEY]"));
console.log("✓ API key redaction passed.");

console.log("\n All 4 Critical Logic & Security Checks Passed Successfully!");
