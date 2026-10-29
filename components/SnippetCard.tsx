"use client";

import React, { useState } from "react";
import { Code2, Copy, Check, Pencil, Trash2, ChevronDown, ChevronUp, Tag } from "./icons";
import { CodeSnippet } from "./types";

interface SnippetCardProps {
  snippet: CodeSnippet;
  onEdit: (snippet: CodeSnippet) => void;
  onDelete: (id: string) => Promise<void>;
  onTagClick?: (tag: string) => void;
}

export function SnippetCard({
  snippet,
  onEdit,
  onDelete,
  onTagClick,
}: SnippetCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy snippet:", err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(snippet.id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  // Color mapping by language
  const getLanguageBadge = (lang: string) => {
    const l = lang.toLowerCase();
    switch (l) {
      case "typescript":
      case "ts":
        return {
          label: "TypeScript",
          className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
      case "javascript":
      case "js":
        return {
          label: "JavaScript",
          className: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        };
      case "php":
        return {
          label: "PHP",
          className: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
        };
      case "sql":
        return {
          label: "SQL",
          className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        };
      case "html":
        return {
          label: "HTML",
          className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        };
      case "css":
        return {
          label: "CSS",
          className: "bg-sky-500/10 text-sky-300 border-sky-500/20",
        };
      case "python":
      case "py":
        return {
          label: "Python",
          className: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
        };
      case "rust":
      case "rs":
        return {
          label: "Rust",
          className: "bg-red-500/10 text-red-300 border-red-500/20",
        };
      case "go":
      case "golang":
        return {
          label: "Go",
          className: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
        };
      case "bash":
      case "sh":
        return {
          label: "Bash",
          className: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
        };
      case "json":
        return {
          label: "JSON",
          className: "bg-teal-500/10 text-teal-300 border-teal-500/20",
        };
      default:
        return {
          label: lang,
          className: "bg-violet-500/10 text-violet-300 border-violet-500/20",
        };
    }
  };

  const badgeInfo = getLanguageBadge(snippet.language);
  const codeLines = snippet.code.split("\n");
  const isLongCode = codeLines.length > 8;
  const tags = snippet.tags || [];

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-white/5 bg-[#121217] p-4 sm:p-5 transition-all duration-150 hover:border-violet-500/25 hover:bg-[#14141a]">
      <div className="space-y-3">
        {/* Header: Title, Language & Copy */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-colors">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
                  {snippet.title}
                </h3>
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-medium ${badgeInfo.className}`}
                >
                  {badgeInfo.label}
                </span>
              </div>
              {snippet.description && (
                <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {snippet.description}
                </p>
              )}
            </div>
          </div>

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              copied
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-sm shadow-emerald-950/40"
                : "border-white/10 bg-zinc-900/80 text-zinc-300 hover:border-violet-500/40 hover:bg-zinc-900 hover:text-white"
            }`}
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code View Panel */}
        <div className="relative rounded-lg border border-white/5 bg-black/60 overflow-hidden">
          {/* Top code bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/5 text-[11px] text-zinc-500 font-mono">
            <span>{codeLines.length} {codeLines.length === 1 ? "line" : "lines"}</span>
            <span>{snippet.code.length} chars</span>
          </div>

          {/* Code content */}
          <div
            className={`overflow-x-auto p-3 text-xs font-mono leading-relaxed text-zinc-200 transition-all ${
              !expanded && isLongCode ? "max-h-48 overflow-y-hidden" : ""
            }`}
          >
            <pre className="m-0 p-0 whitespace-pre">
              <code>{snippet.code}</code>
            </pre>
          </div>

          {/* Fade gradient + Expand button for long snippets */}
          {isLongCode && (
            <div
              className={`flex items-center justify-center p-1.5 border-t border-white/5 bg-zinc-950/80 ${
                !expanded ? "bg-gradient-to-t from-black via-black/80 to-transparent pt-4" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                {expanded ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Show full code ({codeLines.length} lines)</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Tag className="w-3 h-3 text-zinc-500 mr-0.5" />
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick?.(tag)}
                className="rounded bg-white/5 hover:bg-violet-500/10 hover:text-violet-300 hover:border-violet-500/20 border border-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-[10px] text-zinc-500 font-mono">
          {snippet.created_at
            ? new Date(snippet.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Supabase Snippet"}
        </span>

        <div className="flex items-center gap-1">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
              <span className="text-[11px] text-zinc-400">Delete snippet?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded bg-rose-600/30 border border-rose-500/40 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-600/50 disabled:opacity-50"
              >
                {isDeleting ? "..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded px-1.5 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onEdit(snippet)}
                className="flex items-center gap-1 rounded-md p-1.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                title="Edit snippet"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 rounded-md p-1.5 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                title="Delete snippet"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
