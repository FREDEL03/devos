"use client";

import React, { useState, useEffect } from "react";
import { X, GraduationCap, Calendar, Sparkles, AlertCircle } from "./icons";
import { LearningEntry, LearningCategory, LearningStatus } from "./types";
import { LearningEntryInput } from "@/app/learning/actions";

const CATEGORIES: LearningCategory[] = [
  "Laravel",
  "Next.js",
  "React",
  "TypeScript",
  "SQL",
  "AI Integration",
  "Software Engineering",
  "DevOps",
  "Other",
];

const STATUSES: LearningStatus[] = [
  "To Learn",
  "In Progress",
  "Reviewing",
  "Completed",
];

const LEVELS: ("Beginner" | "Intermediate" | "Advanced" | "Exploratory")[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Exploratory",
];

interface LearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: LearningEntryInput, id?: string) => Promise<{ success: boolean; error?: string }>;
  initialData?: LearningEntry | null;
}

export function LearningModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: LearningModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<LearningCategory>("Next.js");
  const [status, setStatus] = useState<LearningStatus>("In Progress");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced" | "Exploratory">("Intermediate");
  const [mastery, setMastery] = useState<number>(25);
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setCategory((initialData.category as LearningCategory) || "General");
      setStatus((initialData.status as LearningStatus) || "In Progress");
      setLevel(initialData.level || "Intermediate");
      setMastery(initialData.mastery_percentage ?? 0);
      setTargetDate(initialData.target_date || "");
      setNotes(initialData.notes || "");
    } else {
      setTitle("");
      setDescription("");
      setCategory("Next.js");
      setStatus("In Progress");
      setLevel("Intermediate");
      setMastery(0);
      setTargetDate("");
      setNotes("");
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a topic title.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const input: LearningEntryInput = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      status,
      level,
      mastery_percentage: mastery,
      target_date: targetDate.trim() || null,
      notes: notes.trim() || null,
    };

    const res = await onSubmit(input, initialData?.id);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Failed to save learning topic.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#121217] p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {initialData ? "Edit Learning Topic" : "Add New Learning Topic"}
              </h2>
              <p className="text-xs text-zinc-400">Track technical mastery, resources, and goals</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Topic Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Next.js 16 Server Components & Partial Prerendering (PPR)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LearningCategory)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Learning Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const s = e.target.value as LearningStatus;
                  setStatus(s);
                  if (s === "Completed" && mastery < 100) setMastery(100);
                }}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Level & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Target Completion Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Mastery Progress Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Mastery Level
              </label>
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                {mastery}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={mastery}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMastery(val);
                if (val === 100) setStatus("Completed");
                else if (val > 0 && status === "To Learn") setStatus("In Progress");
              }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Objective & Core Concepts (optional)
            </label>
            <textarea
              rows={2}
              placeholder="What specific skills or milestones will define success for this topic?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Notes & Useful Resources */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Notes & Useful Resources (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Documentation links, sample repositories, cheat sheets, and technical takeaways..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed font-mono text-[11px]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? "Update Topic" : "Save Topic"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
