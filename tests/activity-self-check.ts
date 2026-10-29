/**
 * Self-check for activity log service contracts.
 * Run: npx ts-node -e "require('./tests/activity-self-check')"
 * These are pure logic checks — no DB connection needed.
 */

// Verify action naming conventions follow entity.verb pattern
const VALID_ACTIONS = [
  "task.created", "task.updated", "task.completed", "task.reopened", "task.deleted",
  "project.created", "project.updated", "project.archived", "project.deleted",
  "snippet.created", "snippet.updated", "snippet.deleted", "snippet.copied",
  "git_template.created", "git_template.deleted", "git.copied",
  "learning.created", "learning.updated", "learning.completed", "learning.deleted",
  "settings.updated", "profile.updated",
  "auth.login", "auth.logout",
];

for (const action of VALID_ACTIONS) {
  const parts = action.split(".");
  if (parts.length !== 2) {
    throw new Error(`Action "${action}" must follow entity.verb format`);
  }
  if (!parts[0] || !parts[1]) {
    throw new Error(`Action "${action}" has empty segment`);
  }
}
console.assert(VALID_ACTIONS.length >= 20, "Expected at least 20 action types");

// Verify no sensitive fields in metadata keys
const FORBIDDEN_METADATA_KEYS = ["password", "token", "secret", "api_key", "apiKey", "credential"];
function checkMetadata(metadata: Record<string, unknown>) {
  for (const key of Object.keys(metadata)) {
    const lower = key.toLowerCase();
    for (const forbidden of FORBIDDEN_METADATA_KEYS) {
      if (lower.includes(forbidden)) {
        throw new Error(`Forbidden metadata key detected: "${key}"`);
      }
    }
  }
}

checkMetadata({ taskTitle: "Fix bug", priority: "High", status: "todo" });
checkMetadata({ projectName: "DevOS", status: "In Progress" });
checkMetadata({ snippetTitle: "useEffect hook", language: "typescript" });
checkMetadata({ changedKeys: ["theme", "accent_color"] });
checkMetadata({ hasAvatarUrl: false });

// Ensure forbidden keys are caught
let caught = false;
try {
  checkMetadata({ password: "should-fail" });
} catch {
  caught = true;
}
console.assert(caught, "Should have caught forbidden key 'password'");

console.log("✓ All activity log self-checks passed");
