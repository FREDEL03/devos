"use client";

import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  Sparkles,
  Plus,
  Search,
  Check,
  Clock,
  X,
  Filter,
} from "./icons";
import { LearningEntry, LearningCategory, LearningStatus } from "./types";
import { LearningCard } from "./LearningCard";
import { LearningModal } from "./LearningModal";
import { toast } from "./Toast";
import { confirmDialog } from "./ConfirmDialog";
import {
  createLearningEntry,
  updateLearningEntry,
  deleteLearningEntry,
  LearningEntryInput,
} from "@/app/learning/actions";

interface LearningManagerProps {
  initialEntries: LearningEntry[];
}

const CATEGORY_TABS: (LearningCategory | "All")[] = [
  "All",
  "Laravel",
  "Next.js",
  "React",
  "TypeScript",
  "SQL",
  "AI Integration",
  "Software Engineering",
  "DevOps",
];

const STATUS_FILTERS: (LearningStatus | "All")[] = [
  "All",
  "In Progress",
  "To Learn",
  "Completed",
  "Reviewing",
];

export function LearningManager({ initialEntries }: LearningManagerProps) {
  const [entries, setEntries] = useState<LearningEntry[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LearningCategory | "All">("All");
  const [selectedStatus, setSelectedStatus] = useState<LearningStatus | "All">("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LearningEntry | null>(null);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      // Category filter
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "All" && item.status !== selectedStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) ?? false;
        const matchesNotes = item.notes?.toLowerCase().includes(query) ?? false;
        const matchesCat = item.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesNotes && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [entries, selectedCategory, selectedStatus, searchQuery]);

  // Metrics
  const totalCount = entries.length;
  const completedCount = entries.filter((e) => e.status === "Completed").length;
  const inProgressCount = entries.filter((e) => e.status === "In Progress").length;
  const avgMastery =
    totalCount > 0
      ? Math.round(entries.reduce((acc, e) => acc + (e.mastery_percentage || 0), 0) / totalCount)
      : 0;

  const handleCreateOrUpdate = async (input: LearningEntryInput, id?: string) => {
    if (id) {
      const res = await updateLearningEntry(id, input);
      if (res.error || !res.data) {
        toast.error("Failed to update topic", { description: res.error });
        return { success: false, error: res.error || "Failed to update topic" };
      }
      setEntries((prev) => prev.map((item) => (item.id === id ? res.data! : item)));
      toast.success("Learning topic updated", { description: `"${input.title}" updated.` });
      return { success: true };
    } else {
      const res = await createLearningEntry(input);
      if (res.error || !res.data) {
        toast.error("Failed to create topic", { description: res.error });
        return { success: false, error: res.error || "Failed to create topic" };
      }
      setEntries((prev) => [res.data!, ...prev]);
      toast.success("Learning topic created", { description: `"${input.title}" tracked.` });
      return { success: true };
    }
  };

  const handleDelete = async (id: string) => {
    const target = entries.find((e) => e.id === id);
    const confirmed = await confirmDialog({
      title: target ? `Delete "${target.title}"?` : "Delete learning topic?",
      description: "This learning topic will be permanently removed. This action cannot be undone.",
      confirmText: "Delete Topic",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        const res = await deleteLearningEntry(id);
        if (!res.success) {
          throw new Error(res.error || "Failed to delete topic");
        }
      },
    });

    if (confirmed) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Learning topic deleted", { description: "Topic removed from tracker." });
    }
  };

  const handleQuickToggleComplete = async (entry: LearningEntry) => {
    const isCompleted = entry.status === "Completed";
    const nextStatus: LearningStatus = isCompleted ? "In Progress" : "Completed";
    const nextMastery = isCompleted ? 50 : 100;

    const res = await updateLearningEntry(entry.id, {
      status: nextStatus,
      mastery_percentage: nextMastery,
    });

    if (res.data) {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? res.data! : e)));
      toast.success(
        isCompleted ? "Marked in progress" : "Topic completed!",
        { description: `"${entry.title}" is now ${nextStatus.toLowerCase()}.` }
      );
    } else if (res.error) {
      toast.error("Failed to update status", { description: res.error });
    }
  };

  const handleOpenEdit = (entry: LearningEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Learning Tracker</span>
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs text-indigo-400 font-mono">
              {totalCount} {totalCount === 1 ? "Topic" : "Topics"}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Structured roadmap for programming skills, frameworks, and engineering competencies
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm shadow-indigo-700/30 hover:bg-indigo-500 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Topic</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/5 bg-[#121217] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Total Topics</span>
            <span className="text-xl font-bold text-white mt-1 block">{totalCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121217] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">In Progress</span>
            <span className="text-xl font-bold text-indigo-400 mt-1 block">{inProgressCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121217] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Completed</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">{completedCount}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121217] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Avg Mastery</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {avgMastery}%
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="rounded-xl border border-white/5 bg-[#121217] p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topics, milestones, resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-zinc-900 border border-white/10 pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown/Tabs */}
        <div className="flex items-center gap-1 bg-[#121217] border border-white/5 rounded-lg p-1 text-xs">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                selectedStatus === st
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <LearningCard
              key={entry.id}
              entry={entry}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onQuickToggleComplete={handleQuickToggleComplete}
            />
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-white/5 bg-[#121217] p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">
              {entries.length === 0 ? "No Learning Topics Yet" : "No Matching Topics Found"}
            </h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              {entries.length === 0
                ? "Start tracking your technical goals across Laravel, Next.js, React, TypeScript, SQL, and AI Integration."
                : "Try resetting your category or status filter to view all topics."}
            </p>
            {entries.length === 0 && (
              <button
                type="button"
                onClick={handleOpenNew}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Topic</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Learning Modal */}
      <LearningModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingEntry}
      />
    </div>
  );
}
