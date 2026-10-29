"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Pencil, FolderGit2 } from "./icons";
import { Project, ProjectStatus } from "./types";
import { ProjectInput } from "@/app/projects/actions";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectInput) => Promise<{ error?: string } | void>;
  initialProject?: Project | null;
}

export function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  initialProject,
}: ProjectModalProps) {
  const isEditing = Boolean(initialProject);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("In Progress");
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name || "");
      setDescription(initialProject.description || "");
      const stack =
        initialProject.technology_stack ||
        initialProject.technologies ||
        initialProject.technology ||
        [];
      setTechStack(stack.join(", "));
      setStatus(initialProject.status || "In Progress");
      setProgress(initialProject.progress ?? 0);
      setStartDate(initialProject.start_date || "");
      setTargetDate(initialProject.target_date || "");
    } else {
      setName("");
      setDescription("");
      setTechStack("");
      setStatus("In Progress");
      setProgress(0);
      setStartDate("");
      setTargetDate("");
    }
    setError(null);
  }, [initialProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const techArray = techStack
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        technology_stack: techArray,
        status,
        progress: Number(progress),
        start_date: startDate.trim() || undefined,
        target_date: targetDate.trim() || undefined,
      });

      if (res && res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setLoading(false);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save project.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121217] p-6 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
              {isEditing ? <Pencil className="w-4 h-4" /> : <FolderGit2 className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isEditing ? "Edit Project" : "Create New Project"}
              </h2>
              <p className="text-xs text-zinc-500">
                {isEditing
                  ? "Update repository details, roadmap, and tech stack"
                  : "Track software architecture and development milestones in Supabase"}
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
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Auth Gateway Microservice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of repository goals, architecture, or deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Technology Stack (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Next.js 16, TypeScript, Tailwind, Go, PostgreSQL"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Manual Progress
                </label>
                <span className="font-mono text-xs text-violet-400 font-medium">
                  {progress}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-violet-600 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Note: Will auto-calculate when tasks are attached
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Start Date (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2026-10-01"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Date (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2026-12-15"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
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
              disabled={loading || !name.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Create Project"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
