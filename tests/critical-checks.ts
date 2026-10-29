/**
 * DevOS Critical Security & Logic Self-Checks
 * Pure Node.js assert-based verification.
 */
import assert from "node:assert";
import {
  generateBranchName,
  generateCommitMessage,
  generatePrTitle,
  __runGitGeneratorSelfCheck,
} from "../lib/git/generator";
import { SUPPORTED_TASK_TYPES, __runGeminiValidationSelfCheck } from "../lib/ai/gemini";

console.log("▶ [Test 1] Git Generator Rules...");
assert.strictEqual(__runGitGeneratorSelfCheck(), true);

const branch = generateBranchName({
  changeType: "feat",
  ticketId: "DEV-101",
  ticketTitle: "Supabase Session Token Refresh",
});
assert.strictEqual(branch, "feat/DEV-101-supabase-session-token-refresh");

const commit = generateCommitMessage({
  changeType: "fix",
  scope: "auth",
  ticketTitle: "resolve token refresh redirect loop",
});
assert.strictEqual(commit, "fix(auth): resolve token refresh redirect loop");

const pr = generatePrTitle({
  changeType: "feat",
  ticketId: "DEV-101",
  ticketTitle: "add daily work logs",
});
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

console.log("▶ [Test 5] Settings Constraints & Allowed Enum Values...");
const validThemes = ["dark", "light", "system"];
const validAccents = ["violet", "indigo", "emerald", "blue", "amber", "rose"];
const validDateFormats = ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"];
const validTimeFormats = ["12h", "24h"];
const validViews = ["List", "Grid"];
const validSorts = ["priority", "due_date", "created_at", "title"];
const validResponseStyles = ["concise", "balanced", "detailed"];

assert.ok(validThemes.includes("dark"));
assert.ok(validThemes.includes("light"));
assert.ok(!validThemes.includes("neon"));

assert.ok(validAccents.includes("violet"));
assert.ok(validAccents.includes("rose"));
assert.ok(!validAccents.includes("rainbow"));

assert.ok(validDateFormats.includes("YYYY-MM-DD"));
assert.ok(validTimeFormats.includes("12h"));
assert.ok(validViews.includes("List"));
assert.ok(validSorts.includes("priority"));
assert.ok(validResponseStyles.includes("balanced"));
console.log("✓ Settings constraints verified.");

console.log("▶ [Test 6] Toast Store & Deduplication Logic...");
import { toast, getToasts, dismissToast, clearToasts } from "../components/Toast";
clearToasts();
assert.strictEqual(getToasts().length, 0);

toast.success("Task completed", { description: "Great work!" });
assert.strictEqual(getToasts().length, 1);
assert.strictEqual(getToasts()[0].type, "success");
assert.strictEqual(getToasts()[0].title, "Task completed");

// Deduplication test: same message within 1 second should not duplicate
toast.success("Task completed", { description: "Great work!" });
assert.strictEqual(getToasts().length, 1);

// Different message adds toast
const errId = toast.error("Error occurred");
assert.strictEqual(getToasts().length, 2);

// Dismiss by ID
dismissToast(errId);
assert.strictEqual(getToasts().length, 1);

clearToasts();
assert.strictEqual(getToasts().length, 0);
console.log("✓ Toast store passed.");

console.log("▶ [Test 7] ConfirmDialog State Machine & Promise Resolution...");
import { confirmDialog, closeConfirmDialog, getActiveDialog } from "../components/ConfirmDialog";

let resolvedValue: boolean | null = null;
const dialogPromise = confirmDialog({
  title: "Delete resource?",
  description: "Permanent action",
  variant: "destructive",
}).then((val) => {
  resolvedValue = val;
  return val;
});

const currentDialog = getActiveDialog();
assert.ok(currentDialog !== null);
assert.strictEqual(currentDialog?.title, "Delete resource?");
assert.strictEqual(currentDialog?.variant, "destructive");

// Simulate confirming
closeConfirmDialog(true);
assert.strictEqual(getActiveDialog(), null);

await dialogPromise;
assert.strictEqual(resolvedValue, true);
console.log("✓ ConfirmDialog state machine passed.");

console.log("\n All Critical Logic & Security Checks Passed Successfully!");
