"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Code2,
  Search,
  Plus,
  Filter,
  X,
  Check,
  Tag,
} from "./icons";
import { CodeSnippet } from "./types";
import { SnippetCard } from "./SnippetCard";
import { SnippetModal } from "./SnippetModal";
import {
  createSnippet,
  updateSnippet,
  deleteSnippet,
  SnippetInput,
} from "@/app/snippets/actions";

interface SnippetManagerProps {
  initialSnippets: CodeSnippet[];
  onSnippetsChange?: (snippets: CodeSnippet[]) => void;
}

const LANGUAGE_FILTERS = [
  "All",
  "TypeScript",
  "JavaScript",
  "PHP",
  "SQL",
  "HTML",
  "CSS",
  "Python",
  "Bash",
  "Go",
  "Rust",
];

export function SnippetManager({
  initialSnippets,
  onSnippetsChange,
}: SnippetManagerProps) {
  const [snippets, setSnippets] = useState<CodeSnippet[]>(initialSnippets);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [, startTransition] = useTransition();

  const syncSnippets = (updated: CodeSnippet[]) => {
    setSnippets(updated);
    onSnippetsChange?.(updated);
  };

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    snippets.forEach((s) => {
      (s.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [snippets]);

  // Handle Create or Update
  const handleCreateOrUpdate = async (data: SnippetInput) => {
    if (editingSnippet) {
      // Optimistic update
      const updated = snippets.map((s) =>
        s.id === editingSnippet.id
          ? {
              ...s,
              title: data.title,
              description: data.description || null,
              code: data.code,
              language: (data.language || s.language).toLowerCase(),
              tags: data.tags || [],
              updated_at: new Date().toISOString(),
            }
          : s
      );
      syncSnippets(updated);

      const res = await updateSnippet(editingSnippet.id, data);
      if (res?.error) {
        showNotification("error", res.error);
        syncSnippets(snippets);
        return { error: res.error };
      }
      showNotification("success", "Snippet updated in Supabase.");
    } else {
      // Create new snippet
      const res = await createSnippet(data);
      if (res?.error) {
        showNotification("error", res.error);
        return { error: res.error };
      }
      if (res?.data) {
        const created: CodeSnippet = {
          id: res.data.id,
          user_id: res.data.user_id,
          title: res.data.title,
          description: res.data.description,
          code: res.data.code,
          language: res.data.language,
          tags: res.data.tags || [],
          created_at: res.data.created_at,
          updated_at: res.data.updated_at,
        };
        syncSnippets([created, ...snippets]);
      }
      showNotification("success", "Snippet saved in Supabase.");
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    const previous = snippets;
    syncSnippets(snippets.filter((s) => s.id !== id));

    startTransition(async () => {
      const res = await deleteSnippet(id);
      if (res?.error) {
        showNotification("error", `Failed to delete snippet: ${res.error}`);
        syncSnippets(previous);
      } else {
        showNotification("success", "Snippet deleted from Supabase.");
      }
    });
  };

  const handleOpenEdit = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingSnippet(null);
    setIsModalOpen(true);
  };

  // Filtered snippets
  const filteredSnippets = useMemo(() => {
    return snippets.filter((snip) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        snip.title.toLowerCase().includes(q) ||
        (snip.description && snip.description.toLowerCase().includes(q)) ||
        snip.code.toLowerCase().includes(q) ||
        (snip.tags && snip.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesLanguage =
        selectedLanguage === "All" ||
        snip.language.toLowerCase() === selectedLanguage.toLowerCase();

      const matchesTag =
        !selectedTag || (snip.tags && snip.tags.includes(selectedTag));

      return matchesSearch && matchesLanguage && matchesTag;
    });
  }, [snippets, searchQuery, selectedLanguage, selectedTag]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Code Snippets</span>
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs text-indigo-400 font-mono">
              {snippets.length} saved
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Personal library of reusable patterns, queries, utilities, and configs
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          data-new-snippet-btn
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Snippet</span>
        </button>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <X className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-white/5 bg-[#121217] p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by title, description, code, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Language Tabs */}
          <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/5 text-xs self-start md:self-auto overflow-x-auto max-w-full">
            {LANGUAGE_FILTERS.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs transition-colors ${
                  selectedLanguage.toLowerCase() === lang.toLowerCase()
                    ? "bg-violet-600/30 text-violet-200 border border-violet-500/30 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Tag chips row if tags exist */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5 text-xs">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1 mr-1">
              <Tag className="w-3 h-3" />
              Tags:
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 text-[10px] font-mono flex items-center gap-1 hover:bg-violet-600/30"
              >
                <span>#{selectedTag}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {allTags.map((t) => {
              const isSelected = selectedTag === t;
              if (isSelected) return null;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTag(t)}
                  className="rounded-full bg-white/5 text-zinc-400 border border-white/5 hover:border-violet-500/30 hover:text-violet-300 px-2 py-0.5 text-[10px] font-mono transition-colors"
                >
                  #{t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Snippets Grid */}
      <div>
        {filteredSnippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#121217] py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-zinc-500 mb-3">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">No snippets found</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm">
              {searchQuery || selectedLanguage !== "All" || selectedTag
                ? "No snippets match your filter criteria. Try clearing filters."
                : "Your Supabase code library is currently empty. Click 'New Snippet' to store your first code snippet."}
            </p>
            {(searchQuery || selectedLanguage !== "All" || selectedTag) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLanguage("All");
                  setSelectedTag(null);
                }}
                className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-4"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onTagClick={(t) => setSelectedTag(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Snippet Modal for create/edit */}
      <SnippetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSnippet(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialSnippet={editingSnippet}
      />
    </div>
  );
}
