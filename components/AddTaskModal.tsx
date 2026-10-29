"use client";

import React, { useState } from "react";
import { X, Plus, Sparkles } from "./icons";
import { Priority, Task } from "./types";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, "id" | "completed">) => void;
  projects: string[];
}

export function AddTaskModal({
  isOpen,
  onClose,
  onAddTask,
  projects,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [project, setProject] = useState(projects[0] || "General");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [customProject, setCustomProject] = useState("");
  const [dueDate, setDueDate] = useState("Today");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedProject =
      project === "custom"
        ? customProject.trim() || "General"
        : project;

    onAddTask({
      title: title.trim(),
      project: assignedProject,
      priority,
      dueDate,
    });

    setTitle("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121217] p-6 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create New Task</h2>
              <p className="text-xs text-zinc-500">Track and prioritize developer deliverables</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Implement webhook retry with exponential backoff"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Associated Project
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
              >
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="custom">+ New Project...</option>
              </select>

              {project === "custom" && (
                <input
                  type="text"
                  placeholder="Enter project name"
                  value={customProject}
                  onChange={(e) => setCustomProject(e.target.value)}
                  className="mt-2 w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-zinc-900 p-1 border border-white/5">
                {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded py-1 text-xs font-medium transition-colors ${
                      priority === p
                        ? p === "High"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : p === "Medium"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Due Timeline
            </label>
            <input
              type="text"
              placeholder="Today, Tomorrow, or sprint name"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
