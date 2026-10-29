"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import {
  GitBranch,
  Copy,
  Check,
  Plus,
  Trash2,
  Bookmark,
  Terminal,
  Sparkles,
  ArrowUpDown,
  X,
} from "./icons";
import { GitChangeType, GitTemplate } from "./types";
import {
  generateAllGitArtifacts,
  GitGeneratorInput,
  GeneratedGitResults,
} from "@/lib/git/generator";
import {
  createGitTemplate,
  deleteGitTemplate,
} from "@/app/git-toolkit/actions";
import { toast } from "./Toast";
import { confirmDialog } from "./ConfirmDialog";

interface GitToolkitProps {
  initialTemplates?: GitTemplate[];
}

const CHANGE_TYPES: { type: GitChangeType; label: string; desc: string; badge: string }[] = [
  { type: "feat", label: "feat", desc: "New feature or capability", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { type: "fix", label: "fix", desc: "Bug fix or defect correction", badge: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { type: "refactor", label: "refactor", desc: "Code restructuring without behavior alteration", badge: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  { type: "perf", label: "perf", desc: "Performance optimization", badge: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  { type: "chore", label: "chore", desc: "Tooling, dependencies, or tasks", badge: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20" },
  { type: "docs", label: "docs", desc: "Documentation updates only", badge: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  { type: "test", label: "test", desc: "Adding or fixing test cases", badge: "bg-teal-500/10 text-teal-300 border-teal-500/20" },
  { type: "ci", label: "ci", desc: "CI/CD or pipeline changes", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { type: "style", label: "style", desc: "Formatting, spaces, semi-colons", badge: "bg-pink-500/10 text-pink-300 border-pink-500/20" },
];

export function GitToolkit({ initialTemplates = [] }: GitToolkitProps) {
  // Inputs
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [changeType, setChangeType] = useState<GitChangeType>("feat");
  const [scope, setScope] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [breakingChange, setBreakingChange] = useState(false);
  const [breakingDetails, setBreakingDetails] = useState("");

  // Generated & Editable outputs
  const [branchName, setBranchName] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prDescription, setPrDescription] = useState("");

  // Copy tracking states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Template state
  const [templates, setTemplates] = useState<GitTemplate[]>(initialTemplates);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [, startTransition] = useTransition();

  // Re-generate deterministic artifacts whenever inputs change
  useEffect(() => {
    const input: GitGeneratorInput = {
      ticketTitle,
      ticketDescription,
      ticketId,
      changeType,
      scope,
      additionalNotes,
      breakingChange,
      breakingDetails,
    };
    const res: GeneratedGitResults = generateAllGitArtifacts(input);
    setBranchName(res.branchName);
    setCommitMessage(res.commitMessage);
    setPrTitle(res.prTitle);
    setPrDescription(res.prDescription);
  }, [
    ticketTitle,
    ticketDescription,
    ticketId,
    changeType,
    scope,
    additionalNotes,
    breakingChange,
    breakingDetails,
  ]);

  const handleCopy = async (text: string, fieldKey: string, fieldLabel = "Text") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      toast.success(`${fieldLabel} copied`, {
        description: "Content copied to clipboard.",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error(`Failed to copy ${fieldLabel.toLowerCase()}`, {
        description: "Clipboard access was denied or unavailable.",
      });
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    setSavingTemplate(true);
    try {
      const res = await createGitTemplate({
        name: templateName.trim(),
        change_type: changeType,
        branch_prefix: `${changeType}/`,
        commit_template: commitMessage,
        pr_title_template: prTitle,
        pr_description_template: prDescription,
      });

      if (res?.error) {
        toast.error("Failed to save template", { description: res.error });
      } else if (res?.data) {
        setTemplates((prev) => [res.data, ...prev]);
        setTemplateName("");
        setIsTemplateModalOpen(false);
        toast.success("Template saved", {
          description: `Template "${res.data.name}" saved to Supabase.`,
        });
      }
    } catch (err: unknown) {
      toast.error("Failed to save template", {
        description: err instanceof Error ? err.message : "Unexpected error saving template.",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleApplyTemplate = (t: GitTemplate) => {
    setChangeType((t.change_type as GitChangeType) || "feat");
    if (t.commit_template) setCommitMessage(t.commit_template);
    if (t.pr_title_template) setPrTitle(t.pr_title_template);
    if (t.pr_description_template) setPrDescription(t.pr_description_template);
    toast.info("Template applied", { description: `Loaded settings from "${t.name}".` });
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: `Delete template "${name}"?`,
      description: "This git template will be permanently removed from Supabase. This action cannot be undone.",
      confirmText: "Delete Template",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        const res = await deleteGitTemplate(id);
        if (res?.error) {
          throw new Error(res.error);
        }
      },
    });

    if (confirmed) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template deleted", { description: `Template "${name}" was removed.` });
    }
  };

  // Compute subject length of commit
  const commitSubjectLine = commitMessage.split("\n")[0] || "";
  const isCommitSubjectTooLong = commitSubjectLine.length > 72;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Git Toolkit</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs text-emerald-400 font-mono">
              Conventional Commits
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deterministic branch names, commit messages, PR titles, and structured descriptions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-violet-500/40 hover:bg-zinc-800 transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 text-violet-400" />
            <span>Save as Template</span>
          </button>
        </div>
      </div>

      {/* Templates Row (if any exist) */}
      {templates.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-[#121217] p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-violet-400" />
              Saved Templates ({templates.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="group flex items-center gap-2 rounded-lg bg-black/40 border border-white/5 px-2.5 py-1 text-xs text-zinc-300 hover:border-violet-500/30 transition-all"
              >
                <button
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="font-medium text-zinc-200 hover:text-violet-300"
                >
                  {tpl.name}
                </button>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  {tpl.change_type}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                  className="text-zinc-600 hover:text-rose-400 transition-colors ml-1"
                  title="Delete template"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Inputs Form & Generated Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white pb-3 border-b border-white/5 flex items-center justify-between">
              <span>Task & Ticket Details</span>
              <span className="text-[11px] font-normal text-zinc-500 font-mono">Live Generator</span>
            </h3>

            {/* Ticket Title */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Ticket / Feature Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Implement webhook retry with backoff"
                value={ticketTitle}
                onChange={(e) => setTicketTitle(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>

            {/* Ticket ID & Scope in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Ticket ID (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEV-104 or 42"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Scope (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. auth, api, db"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
            </div>

            {/* Change Type Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Change Type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {CHANGE_TYPES.map((ct) => (
                  <button
                    key={ct.type}
                    type="button"
                    onClick={() => setChangeType(ct.type)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs text-left transition-all ${
                      changeType === ct.type
                        ? "bg-violet-600/25 border border-violet-500/40 text-violet-200 font-medium"
                        : "bg-zinc-900/60 border border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="font-mono text-[11px] font-semibold">{ct.label}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{ct.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Ticket Description (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Technical context, acceptance criteria, or motivation..."
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Additional Notes / Testing (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Tested on staging; requires migration run"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Breaking Change Toggle */}
            <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-200">
                <input
                  type="checkbox"
                  checked={breakingChange}
                  onChange={(e) => setBreakingChange(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-violet-600 focus:ring-0"
                />
                <span className="font-medium text-rose-300">Breaking Change</span>
                <span className="text-[10px] text-zinc-500">(Appends ! and BREAKING CHANGE footer)</span>
              </label>
              {breakingChange && (
                <input
                  type="text"
                  placeholder="Describe breaking change details..."
                  value={breakingDetails}
                  onChange={(e) => setBreakingDetails(e.target.value)}
                  className="w-full rounded bg-zinc-900 border border-rose-500/30 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Generated Results (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Branch Name Card */}
          <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-600/20 text-violet-400 border border-violet-500/30">
                  <GitBranch className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Branch Name</h4>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(`git checkout -b ${branchName}`, "branchCmd", "Git checkout command")}
                  className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-[11px] font-mono text-zinc-300 hover:text-white hover:border-violet-500/40"
                  title="Copy 'git checkout -b <branch>'"
                >
                  {copiedField === "branchCmd" ? "Copied Cmd!" : "Copy checkout cmd"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(branchName, "branch", "Branch name")}
                  className="flex items-center gap-1 rounded border border-white/10 bg-violet-600/20 px-2 py-1 text-[11px] font-medium text-violet-300 hover:bg-violet-600/30"
                >
                  {copiedField === "branch" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Name</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full font-mono text-xs rounded-lg bg-black/60 border border-white/5 px-3 py-2 text-violet-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* 2. Commit Message Card */}
          <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Commit Message</h4>
                <span
                  className={`text-[10px] font-mono ${
                    isCommitSubjectTooLong ? "text-amber-400" : "text-zinc-500"
                  }`}
                >
                  {commitSubjectLine.length}/72 chars
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, "commitCmd", "Commit command")}
                  className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-[11px] font-mono text-zinc-300 hover:text-white hover:border-violet-500/40"
                  title="Copy 'git commit -m ...'"
                >
                  {copiedField === "commitCmd" ? "Copied Cmd!" : "Copy commit cmd"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(commitMessage, "commit", "Commit message")}
                  className="flex items-center gap-1 rounded border border-white/10 bg-violet-600/20 px-2 py-1 text-[11px] font-medium text-violet-300 hover:bg-violet-600/30"
                >
                  {copiedField === "commit" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Commit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full font-mono text-xs rounded-lg bg-black/60 border border-white/5 p-3 text-zinc-200 focus:outline-none focus:border-violet-500 leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>

          {/* 3. Pull Request Title Card */}
          <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Pull Request Title</h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(prTitle, "prTitle", "PR title")}
                className="flex items-center gap-1 rounded border border-white/10 bg-violet-600/20 px-2 py-1 text-[11px] font-medium text-violet-300 hover:bg-violet-600/30"
              >
                {copiedField === "prTitle" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy PR Title</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="w-full font-mono text-xs rounded-lg bg-black/60 border border-white/5 px-3 py-2 text-zinc-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* 4. Pull Request Description Card */}
          <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-600/20 text-amber-400 border border-amber-500/30">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Pull Request Description (Markdown)</h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(prDescription, "prDesc", "PR description")}
                className="flex items-center gap-1 rounded border border-white/10 bg-violet-600/20 px-2 py-1 text-[11px] font-medium text-violet-300 hover:bg-violet-600/30"
              >
                {copiedField === "prDesc" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied Markdown</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={8}
              value={prDescription}
              onChange={(e) => setPrDescription(e.target.value)}
              className="w-full font-mono text-xs rounded-lg bg-black/60 border border-white/5 p-3 text-zinc-300 focus:outline-none focus:border-violet-500 leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsTemplateModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#121217] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Save Reusable Git Template</h3>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTemplate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Template Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Standard JIRA Feature PR"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="rounded-lg bg-black/40 border border-white/5 p-3 text-[11px] text-zinc-400 space-y-1 font-mono">
                <div>Type: {changeType}</div>
                <div className="truncate">Commit: {commitSubjectLine}</div>
                <div className="truncate">PR: {prTitle}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  disabled={savingTemplate}
                  className="rounded px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate || !templateName.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {savingTemplate ? "Saving..." : "Save to Supabase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
