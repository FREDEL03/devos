"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Pencil,
  CheckSquare,
  Trash2,
  Copy,
  ChevronDown,
  AlertCircle,
  Loader2,
} from "./icons";
import { Task, TaskStatus, Priority, Project } from "./types";
import { updateTask, deleteTask } from "@/app/tasks/actions";
import { toast } from "./Toast";
import { confirmDialog } from "./ConfirmDialog";

interface TaskDetailModalProps {
  isOpen: boolean;
  task: Task | null;
  projects: Project[] | { id: string; name: string }[];
  onClose: () => void;
  onTaskUpdate: (updatedTask: Task) => void;
  onTaskDelete: (id: string) => void;
}

export function TaskDetailModal({
  isOpen,
  task,
  projects,
  onClose,
  onTaskUpdate,
  onTaskDelete,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Task | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"details" | "activity" | "notes">(
    "details"
  );

  if (!isOpen || !task) return null;

  const resetEdit = () => {
    setEditForm(task);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editForm) return;

    const updated = {
      ...editForm,
      title: editForm.title.trim(),
      description: editForm.description?.trim() || null,
    };

    // Optimistic update
    onTaskUpdate(updated);

    try {
      const res = await updateTask(task.id, {
        title: updated.title,
        description: updated.description || undefined,
        priority: updated.priority,
        due_date: updated.due_date || undefined,
        project_id: updated.project_id || undefined,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      toast.success("Task updated", {
        description: `Changes to "${updated.title}" saved.`,
      });
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to update task:", err);
      // Revert optimistic update
      onTaskUpdate(task);
      toast.error("Update failed", {
        description: err.message || "Could not save changes",
      });
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status) return;

    const updated = {
      ...task,
      status: newStatus,
      completed: newStatus === "completed",
    };

    // Optimistic update
    onTaskUpdate(updated);

    try {
      const res = await updateTask(task.id, {
        status: newStatus,
        completed: newStatus === "completed",
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      toast.success("Status updated", {
        description: `Task moved to ${getStatusLabel(newStatus)}`,
      });
    } catch (err: any) {
      console.error("Failed to update status:", err);
      // Revert
      onTaskUpdate(task);
      toast.error("Status change failed", {
        description: err.message || "Could not update status",
      });
    }
  };

  const handlePriorityChange = async (priority: Priority) => {
    if (priority === task.priority) return;

    const updated = { ...task, priority };

    onTaskUpdate(updated);

    try {
      const res = await updateTask(task.id, { priority });
      if (res?.error) throw new Error(res.error);
      toast.success("Priority updated");
    } catch (err: any) {
      onTaskUpdate(task);
      toast.error("Failed to update priority", {
        description: err.message,
      });
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: `Delete "${task.title}"?`,
      description:
        "This task will be permanently removed from your workspace. This action cannot be undone.",
      confirmText: "Delete Task",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      startTransition(async () => {
        const res = await deleteTask(task.id);
        if (res?.error) {
          toast.error("Delete failed", { description: res.error });
          return;
        }
        onTaskDelete(task.id);
        toast.success("Task deleted", {
          description: "The task was successfully removed.",
        });
        onClose();
      });
    }
  };

  const getStatusLabel = (status: TaskStatus | undefined) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "review":
        return "Review";
      case "completed":
        return "Completed";
      default:
        return "To Do";
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-xl border border-white/10 bg-[#121217] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editForm?.title || ""}
                onChange={(e) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
                className="w-full bg-transparent text-2xl font-bold text-white border-none outline-none"
                placeholder="Task title"
                autoFocus
              />
            ) : (
              <h2 className="text-2xl font-bold text-white truncate">
                {task.title}
              </h2>
            )}
            <div className="mt-2 flex items-center gap-3 text-sm text-zinc-400">
              <span className="font-mono text-xs bg-black/40 px-2 py-1 rounded">
                ID: {task.id.slice(0, 8)}...
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Created {formatDate(task.created_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              {isEditing ? "Cancel" : "Edit"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                  Description
                </h3>
                {isEditing ? (
                  <textarea
                    value={editForm?.description || ""}
                    onChange={(e) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, description: e.target.value } : null
                      )
                    }
                    className="w-full h-40 rounded-lg bg-zinc-900 border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                    placeholder="Describe what needs to be done..."
                  />
                ) : (
                  <div className="rounded-lg bg-zinc-900/50 border border-white/5 p-4">
                    {task.description ? (
                      <>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                          {task.description.replace(/!\[[^\]]*\]\(data:image\/[^)]+\)/g, '').trim() || (
                            <span className="text-zinc-500 italic">
                              No description provided
                            </span>
                          )}
                        </p>
                        {/* Display any embedded images */}
                        {(() => {
                          const imageMatch = task.description.match(/!\[[^\]]*\]\((data:image\/[^)]+)\)/);
                          if (imageMatch) {
                            const imageUrl = imageMatch[1];
                            return (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs text-zinc-400 mb-2">Uploaded Image:</p>
                                <img
                                  src={imageUrl}
                                  alt="Task screenshot"
                                  className="max-w-full h-auto rounded border border-white/10"
                                  style={{ maxHeight: '300px' }}
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    ) : (
                      <span className="text-zinc-500 italic">
                        No description provided
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div>
                <div className="flex border-b border-white/5">
                  {[
                    { id: "details", label: "Details" },
                    { id: "activity", label: "Activity" },
                    { id: "notes", label: "Notes" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "text-white border-b-2 border-violet-500"
                          : "text-zinc-400 hover:text-zinc-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                  {activeTab === "details" && (
                    <div className="space-y-4">
                      {/* Status */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2">
                          Status
                        </label>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                          className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                        >
                          {(["todo", "in_progress", "review", "completed"] as TaskStatus[]).map(
                            (status) => (
                              <option key={status} value={status}>
                                {getStatusLabel(status)}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2">
                          Priority
                        </label>
                        <select
                          value={task.priority}
                          onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                          className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                        >
                          {(["High", "Medium", "Low"] as Priority[]).map((priority) => (
                            <option key={priority} value={priority}>
                              {priority}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === "activity" && (
                    <div className="rounded-lg bg-zinc-900/50 border border-white/5 p-4">
                      <p className="text-sm text-zinc-400">
                        Activity history will appear here. The system
                        automatically logs task creation, updates, and status
                        changes.
                      </p>
                    </div>
                  )}

                  {activeTab === "notes" && (
                    <div className="rounded-lg bg-zinc-900/50 border border-white/5 p-4">
                      <p className="text-sm text-zinc-400">
                        Notes feature will be implemented in a future update.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Properties */}
            <div className="space-y-6">
              <div className="rounded-xl border border-white/5 bg-black/30 p-5">
                <h3 className="text-sm font-semibold text-zinc-300 mb-4">
                  Properties
                </h3>
                <div className="space-y-4">
                  {/* Due Date */}
                  <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due Date</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm?.due_date || ""}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, due_date: e.target.value || null }
                              : null
                          )
                        }
                        className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                      />
                    ) : (
                      <p className="text-sm text-zinc-300">
                        {task.due_date
                          ? formatDate(task.due_date)
                          : "No due date"}
                      </p>
                    )}
                  </div>

                  {/* Project */}
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">Project</div>
                    {isEditing ? (
                      <select
                        value={editForm?.project_id || ""}
                        onChange={(e) =>
                          setEditForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  project_id: e.target.value || null,
                                }
                              : null
                          )
                        }
                        className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                      >
                        <option value="">No project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-zinc-300">
                        {task.project || "No project"}
                      </p>
                    )}
                  </div>

                  {/* Created & Updated */}
                  <div className="pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-zinc-500 mb-1">Created</div>
                        <div className="text-zinc-300">
                          {formatDate(task.created_at)}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 mb-1">Updated</div>
                        <div className="text-zinc-300">
                          {formatDate(task.updated_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-xl border border-white/5 bg-black/30 p-5">
                <h3 className="text-sm font-semibold text-zinc-300 mb-4">
                  Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Delete Task</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            {isEditing ? "Make changes and save below" : "Click Edit to modify this task"}
          </div>
          <div className="flex items-center gap-3">
            {isEditing && (
              <>
                <button
                  onClick={resetEdit}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editForm?.title.trim()}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Changes
                </button>
              </>
            )}
            {!isEditing && (
              <button
                onClick={onClose}
                className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}