"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, FolderGit2, AlertCircle } from "./icons";
import { WorkLog } from "./types";
import { WorkLogInput } from "@/app/work-logs/actions";

interface ProjectOption {
  id: string;
  name: string;
}

interface WorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: WorkLogInput, id?: string) => Promise<{ success: boolean; error?: string }>;
  initialData?: WorkLog | null;
  projects: ProjectOption[];
}

export function WorkLogModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects,
}: WorkLogModalProps) {
  const [title, setTitle] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [workSummary, setWorkSummary] = useState("");
  const [challenges, setChallenges] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setEntryDate(initialData.entry_date || new Date().toISOString().split("T")[0]);
      setProjectId(initialData.project_id || "");
      setDurationMinutes(initialData.duration_minutes ? String(initialData.duration_minutes) : "");
      setWorkSummary(initialData.work_summary || "");
      setChallenges(initialData.challenges || "");
      setLessonsLearned(initialData.lessons_learned || "");
    } else {
      setTitle("");
      setEntryDate(new Date().toISOString().split("T")[0]);
      setProjectId("");
      setDurationMinutes("");
      setWorkSummary("");
      setChallenges("");
      setLessonsLearned("");
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title for this daily log.");
      return;
    }
    if (!workSummary.trim()) {
      setError("Please provide a summary of completed work.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const input: WorkLogInput = {
      title: title.trim(),
      entry_date: entryDate || new Date().toISOString().split("T")[0],
      project_id: projectId.trim() ? projectId.trim() : null,
      duration_minutes: durationMinutes.trim() ? Number(durationMinutes) : null,
      work_summary: workSummary.trim(),
      challenges: challenges.trim() || null,
      lessons_learned: lessonsLearned.trim() || null,
    };

    const res = await onSubmit(input, initialData?.id);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Failed to save work log.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#121217] p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {initialData ? "Edit Daily Work Log" : "Log Daily Engineering Work"}
              </h2>
              <p className="text-xs text-zinc-400">Record tasks, blockers, and technical insights</p>
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
          {/* Row 1: Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Log Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Supabase Auth edge middleware & session refresh fix"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Row 2: Date, Project, Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Date
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                <FolderGit2 className="w-3.5 h-3.5 text-zinc-500" />
                Associated Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="e.g. 90"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Completed Work Summary */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Completed Work & Deliverables <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="What specific tasks, PRs, features, or fixes did you finish today?"
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Row 4: Challenges & Blockers */}
          <div>
            <label className="block text-xs font-medium text-amber-300/90 mb-1.5">
              Blockers & Technical Challenges (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any runtime errors, API rate limits, environment snags, or unresolved blockers?"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Row 5: Lessons Learned */}
          <div>
            <label className="block text-xs font-medium text-emerald-300/90 mb-1.5">
              Lessons Learned & Engineering Takeaways (optional)
            </label>
            <textarea
              rows={2}
              placeholder="What architecture insight, library quirk, or debugging technique did you discover?"
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors leading-relaxed"
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
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-violet-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? "Update Log" : "Save Daily Log"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
