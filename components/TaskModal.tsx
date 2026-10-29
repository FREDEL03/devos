"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Pencil } from "./icons";
import { Priority, Task, TaskStatus } from "./types";
import { TaskInput } from "@/app/tasks/actions";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskInput) => Promise<{ error?: string } | void>;
  initialTask?: Task | null;
  projects?: { id: string; name: string }[] | string[];
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  projects = [],
}: TaskModalProps) {
  const isEditing = Boolean(initialTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalize project options
  const projectList: { id: string; name: string }[] = projects.map((p) =>
    typeof p === "string" ? { id: p, name: p } : p
  );

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || "");
      setDescription(initialTask.description || "");
      setProjectId(initialTask.project_id || "");
      setPriority(initialTask.priority || "Medium");
      setStatus(initialTask.status || (initialTask.completed ? "completed" : "todo"));
      setDueDate(initialTask.due_date || initialTask.dueDate || "");
    } else {
      setTitle("");
      setDescription("");
      setProjectId("");
      setPriority("Medium");
      setStatus("todo");
      setDueDate("");
    }
    setError(null);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        project_id: projectId || null,
        priority,
        status,
        due_date: dueDate.trim() || undefined,
      });

      if (res && res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setLoading(false);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save task.");
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
              {isEditing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isEditing ? "Edit Task" : "Create New Task"}
              </h2>
              <p className="text-xs text-zinc-500">
                {isEditing
                  ? "Update task details, deadline, and priority"
                  : "Track engineering deliverables directly in Supabase"}
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

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add technical context, acceptance criteria, or PR link..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Associated Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
              >
                <option value="">No Project (General)</option>
                {projectList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-900 p-1 border border-white/5">
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

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Due Date / Deadline
              </label>
              <input
                type="text"
                placeholder="e.g. 2026-11-15, Today, or Sprint 4"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
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
              disabled={loading || !title.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Create Task"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
