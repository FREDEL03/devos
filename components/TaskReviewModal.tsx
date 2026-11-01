"use client";

import React, { useState } from "react";
import { CheckSquare, X, Edit2, Trash2, Calendar, AlertTriangle, Loader2 } from "./icons";
import { Priority } from "./types";

export interface DraftTask {
  title: string;
  description?: string;
  priority?: Priority;
  due_date?: string;
  selected: boolean;
}

interface TaskReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftTasks: DraftTask[];
  onDraftTasksChange: (tasks: DraftTask[]) => void;
  onSave: (tasks: DraftTask[]) => Promise<void>;
  isSaving: boolean;
}

export function TaskReviewModal({
  isOpen,
  onClose,
  draftTasks,
  onDraftTasksChange,
  onSave,
  isSaving,
}: TaskReviewModalProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<DraftTask | null>(null);

  if (!isOpen) return null;

  const handleToggleSelect = (index: number) => {
    const updated = [...draftTasks];
    updated[index].selected = !updated[index].selected;
    onDraftTasksChange(updated);
  };

  const handleDelete = (index: number) => {
    const updated = draftTasks.filter((_, i) => i !== index);
    onDraftTasksChange(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...draftTasks[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editForm) return;
    const updated = [...draftTasks];
    updated[editingIndex] = editForm;
    onDraftTasksChange(updated);
    setEditingIndex(null);
    setEditForm(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const handleEditChange = (field: keyof DraftTask, value: string) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const handlePriorityChange = (priority: Priority | "") => {
    if (!editForm) return;
    setEditForm({ ...editForm, priority: priority as Priority | undefined });
  };

  const handleSelectAll = () => {
    const allSelected = draftTasks.every((t) => t.selected);
    const updated = draftTasks.map((t) => ({ ...t, selected: !allSelected }));
    onDraftTasksChange(updated);
  };

  const selectedCount = draftTasks.filter((t) => t.selected).length;

  const handleSave = async () => {
    const tasksToSave = draftTasks.filter((t) => t.selected);
    if (tasksToSave.length === 0) return;
    await onSave(tasksToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-[#121217] p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">Review Suggested Tasks</h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              {selectedCount} of {draftTasks.length} selected • Edit before saving
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Task List */}
        <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
          {draftTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-black/20 py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-zinc-500 mb-3" />
              <p className="text-sm text-zinc-400">No tasks to review</p>
            </div>
          ) : (
            draftTasks.map((task, index) => (
              <div
                key={index}
                className={`rounded-xl border p-4 transition-colors ${
                  task.selected
                    ? "border-violet-500/30 bg-violet-500/5"
                    : "border-white/5 bg-black/20"
                }`}
              >
                {editingIndex === index ? (
                  <div className="space-y-3">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        value={editForm?.title || ""}
                        onChange={(e) => handleEditChange("title", e.target.value)}
                        className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                        placeholder="What needs to be done?"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                        Description
                      </label>
                      <textarea
                        value={editForm?.description || ""}
                        onChange={(e) => handleEditChange("description", e.target.value)}
                        className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none h-24"
                        placeholder="Additional details..."
                      />
                    </div>

                    {/* Priority & Due Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                          Priority
                        </label>
                        <select
                          value={editForm?.priority || ""}
                          onChange={(e) => handlePriorityChange(e.target.value as Priority | "")}
                          className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                        >
                          <option value="">Default (Medium)</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={editForm?.due_date || ""}
                          onChange={(e) => handleEditChange("due_date", e.target.value)}
                          className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    {/* Edit Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={handleCancelEdit}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => handleToggleSelect(index)}
                          className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                            task.selected
                              ? "border-violet-500 bg-violet-500"
                              : "border-zinc-600 bg-transparent"
                          }`}
                        >
                          {task.selected && <CheckSquare className="h-2.5 w-2.5 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-zinc-100">{task.title}</h4>
                          {task.description && (
                            <p className="mt-1.5 text-sm text-zinc-400">{task.description}</p>
                          )}
                          <div className="mt-2.5 flex items-center gap-3 text-xs">
                            {task.priority && (
                              <span
                                className={`rounded-full px-2 py-0.5 font-medium ${
                                  task.priority === "High"
                                    ? "bg-red-500/10 text-red-300 border border-red-500/20"
                                    : task.priority === "Medium"
                                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                }`}
                              >
                                {task.priority}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center gap-1 text-zinc-400">
                                <Calendar className="h-3 w-3" />
                                {task.due_date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleStartEdit(index)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                          title="Edit task"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-red-400"
                          title="Remove task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            >
              {draftTasks.every((t) => t.selected) ? "Deselect All" : "Select All"}
            </button>
            <span className="text-xs text-zinc-500">
              {selectedCount} tasks selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedCount === 0 || isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckSquare className="h-3.5 w-3.5" />
                  Add {selectedCount} Selected Tasks
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-4 rounded-lg border border-white/5 bg-black/20 p-3 text-xs">
          <p className="font-medium text-zinc-300">📝 Review tips:</p>
          <ul className="mt-1.5 space-y-1 text-zinc-400">
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              Select tasks you want to add to your todo list
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              Edit titles, descriptions, priority, or deadlines as needed
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              Remove any tasks that are not relevant
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}