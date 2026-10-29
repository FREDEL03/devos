"use client";

import React, { useState, useEffect } from "react";
import { X, Code2, Plus, Pencil } from "./icons";
import { CodeSnippet } from "./types";
import { SnippetInput } from "@/app/snippets/actions";

interface SnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (snippetData: SnippetInput) => Promise<{ error?: string } | void>;
  initialSnippet?: CodeSnippet | null;
}

const COMMON_LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "php", label: "PHP" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "bash", label: "Bash / Shell" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
];

export function SnippetModal({
  isOpen,
  onClose,
  onSubmit,
  initialSnippet,
}: SnippetModalProps) {
  const isEditing = Boolean(initialSnippet);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [code, setCode] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSnippet) {
      setTitle(initialSnippet.title || "");
      setDescription(initialSnippet.description || "");
      setLanguage(initialSnippet.language?.toLowerCase() || "typescript");
      setCode(initialSnippet.code || "");
      setTagsInput((initialSnippet.tags || []).join(", "));
    } else {
      setTitle("");
      setDescription("");
      setLanguage("typescript");
      setCode("");
      setTagsInput("");
    }
    setError(null);
  }, [initialSnippet, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Snippet title is required.");
      return;
    }

    if (!code.trim()) {
      setError("Code snippet body cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        language,
        code: code.trim(),
        tags: parsedTags,
      });

      if (res && res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setLoading(false);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save snippet.");
      setLoading(false);
    }
  };

  // Preview tags
  const currentTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#121217] p-6 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              {isEditing ? <Pencil className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isEditing ? "Edit Code Snippet" : "Save Code Snippet"}
              </h2>
              <p className="text-xs text-zinc-500">
                {isEditing
                  ? "Update snippet code, language, and metadata in Supabase"
                  : "Store reusable algorithms, utilities, and queries in Supabase"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Snippet Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. PDO Database Connection Singleton"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Language <span className="text-rose-400">*</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
              >
                {COMMON_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Description (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Prepared statement wrapper preventing SQL injections"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Code <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">
                {code.split("\n").length} lines • {code.length} chars
              </span>
            </div>
            <textarea
              required
              rows={9}
              placeholder={`// Paste your ${language} snippet here...`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full font-mono text-xs rounded-lg bg-zinc-900 border border-white/10 p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. PDO, Security, Database"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
            {currentTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {currentTags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-mono text-violet-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !code.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  {isEditing ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isEditing ? "Save Changes" : "Save Snippet"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
