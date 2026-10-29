import { GitChangeType } from "@/components/types";

export interface GitGeneratorInput {
  ticketTitle: string;
  ticketDescription?: string;
  ticketId?: string;
  changeType: GitChangeType | string;
  scope?: string;
  additionalNotes?: string;
  breakingChange?: boolean;
  breakingDetails?: string;
}

export interface GeneratedGitResults {
  branchName: string;
  commitMessage: string;
  prTitle: string;
  prDescription: string;
}

/**
 * Slugify a title string for git branch naming
 */
export function slugify(text: string, maxLength = 50): string {
  if (!text) return "";
  const cleaned = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except spaces and hyphens
    .trim()
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove duplicate hyphens

  return cleaned.slice(0, maxLength).replace(/-+$/, "");
}

/**
 * Generate a clean Git branch name adhering to git conventions
 */
export function generateBranchName(input: GitGeneratorInput): string {
  const type = (input.changeType || "feat").toLowerCase().trim();
  const ticket = input.ticketId
    ? input.ticketId.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "")
    : "";
  const slug = slugify(input.ticketTitle || "");

  if (ticket && slug) {
    return `${type}/${ticket}-${slug}`;
  }
  if (ticket) {
    return `${type}/${ticket}`;
  }
  if (slug) {
    return `${type}/${slug}`;
  }
  return `${type}/update-work`;
}

/**
 * Generate a Conventional Commit message
 */
export function generateCommitMessage(input: GitGeneratorInput): string {
  const type = (input.changeType || "feat").toLowerCase().trim();
  const scope = input.scope ? input.scope.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") : "";
  const scopeStr = scope ? `(${scope})` : "";
  const breakingMarker = input.breakingChange ? "!" : "";

  const rawTitle = (input.ticketTitle || "update implementation").trim();
  // Lowercase first letter if conventional commit standard, unless it starts with an acronym
  const formattedTitle =
    rawTitle.length > 1 && rawTitle[0] === rawTitle[0].toUpperCase() && rawTitle[1] === rawTitle[1].toLowerCase()
      ? rawTitle[0].toLowerCase() + rawTitle.slice(1)
      : rawTitle;

  const subject = `${type}${scopeStr}${breakingMarker}: ${formattedTitle}`;

  const bodySections: string[] = [];

  if (input.ticketDescription && input.ticketDescription.trim()) {
    bodySections.push(input.ticketDescription.trim());
  }

  if (input.additionalNotes && input.additionalNotes.trim()) {
    bodySections.push(`Note: ${input.additionalNotes.trim()}`);
  }

  if (input.breakingChange) {
    const details = input.breakingDetails?.trim() || "Modifies existing public interface or behavior contract.";
    bodySections.push(`BREAKING CHANGE: ${details}`);
  }

  if (input.ticketId && input.ticketId.trim()) {
    const ticketId = input.ticketId.trim();
    const issueRef = ticketId.startsWith("#") ? ticketId : `#${ticketId}`;
    bodySections.push(`Refs: ${issueRef}`);
  }

  if (bodySections.length === 0) {
    return subject;
  }

  return `${subject}\n\n${bodySections.join("\n\n")}`;
}

/**
 * Generate a PR Title
 */
export function generatePrTitle(input: GitGeneratorInput): string {
  const type = (input.changeType || "feat").toLowerCase().trim();
  const scope = input.scope ? input.scope.trim().toLowerCase() : "";
  const scopeStr = scope ? `(${scope})` : "";
  const ticket = input.ticketId ? `[${input.ticketId.trim().toUpperCase()}] ` : "";
  const title = (input.ticketTitle || "Update engineering deliverables").trim();

  return `${ticket}${type}${scopeStr}: ${title}`;
}

/**
 * Generate a Pull Request Description template in Markdown
 */
export function generatePrDescription(input: GitGeneratorInput): string {
  const title = (input.ticketTitle || "Feature implementation").trim();
  const type = (input.changeType || "feat").toLowerCase().trim();
  const description = input.ticketDescription?.trim() || `Implements ${title}.`;
  const ticketId = input.ticketId?.trim();
  const notes = input.additionalNotes?.trim();

  const changeTypeLabels: Record<string, string> = {
    feat: "New feature (non-breaking change which adds functionality)",
    fix: "Bug fix (non-breaking change which fixes an issue)",
    refactor: "Code refactoring (restructuring without behavior alteration)",
    perf: "Performance improvement",
    docs: "Documentation update",
    chore: "Tooling / dependency / build updates",
    test: "Test suite addition or correction",
    ci: "Continuous Integration / DevOps changes",
    style: "Code style / formatting adjustments",
  };

  const typeDesc = changeTypeLabels[type] || `${type} change`;

  return `## Summary
${description}

## Change Type
- [x] ${typeDesc}${input.breakingChange ? "\n- [x] ⚠️ **BREAKING CHANGE**" : ""}

## Key Changes
- ${title}
${notes ? `- ${notes}\n` : ""}- Code refactored and aligned with codebase conventions

## Verification & Testing
- [x] Local verification and unit checks passed
- [x] Zero runtime regression identified
- [x] Code reviewed against project requirements

## Related Tickets
${ticketId ? `- Resolves: **${ticketId.toUpperCase()}**` : "- None specified"}
`;
}

/**
 * Deterministically generates all git artifacts from a single input
 */
export function generateAllGitArtifacts(input: GitGeneratorInput): GeneratedGitResults {
  return {
    branchName: generateBranchName(input),
    commitMessage: generateCommitMessage(input),
    prTitle: generatePrTitle(input),
    prDescription: generatePrDescription(input),
  };
}

/**
 * Self-check validation (assert-based check for Ponytail standard)
 */
export function __runGitGeneratorSelfCheck(): boolean {
  const branch = generateBranchName({
    ticketTitle: "Add JWT token rotation",
    ticketId: "DEV-104",
    changeType: "feat",
  });
  if (branch !== "feat/DEV-104-add-jwt-token-rotation") {
    throw new Error(`Self-check failed: expected feat/DEV-104-add-jwt-token-rotation, got ${branch}`);
  }

  const commit = generateCommitMessage({
    ticketTitle: "Fix race condition in db pool",
    ticketId: "42",
    changeType: "fix",
    scope: "db",
  });
  if (!commit.startsWith("fix(db): fix race condition in db pool")) {
    throw new Error(`Self-check failed: commit header mismatch: ${commit}`);
  }

  return true;
}
