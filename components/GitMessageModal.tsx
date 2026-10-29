"use client";

import React, { useState } from "react";
import { X, GitBranch, Copy, Check } from "./icons";

interface GitMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitMessageModal({ isOpen, onClose }: GitMessageModalProps) {
  const [type, setType] = useState("feat");
  const [scope, setScope] = useState("");
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const commitTypes = [
    { value: "feat", label: "feat: A new feature" },
    { value: "fix", label: "fix: A bug fix" },
    { value: "refactor", label: "refactor: Code restructuring" },
    { value: "perf", label: "perf: Performance boost" },
    { value: "docs", label: "docs: Documentation changes" },
    { value: "chore", label: "chore: Build/tooling maintenance" },
  ];

  const generatedCommit = `${type}${scope.trim() ? `(${scope.trim()})` : ""}: ${description.trim() || "update implementation"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCommit);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121217] p-6 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Generate Git Commit</h2>
              <p className="text-xs text-zinc-500">Conventional Commits formatted helper</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Commit Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
              >
                {commitTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Scope (optional)
              </label>
              <input
                type="text"
                placeholder="auth, api, ui, parser"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Short Summary
            </label>
            <input
              type="text"
              placeholder="e.g. add bearer token rotation with replay guard"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Generated Result Box */}
          <div className="rounded-xl bg-black/60 border border-white/10 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Output
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commit</span>
                  </>
                )}
              </button>
            </div>
            <code className="block font-mono text-xs text-emerald-400 break-all select-all">
              {generatedCommit}
            </code>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
