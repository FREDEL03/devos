"use client";

import React from "react";
import { Check, Calendar } from "./icons";
import { Priority, Task } from "./types";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({
  task,
}: TaskCardProps) {
  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Low":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  const getStatusBadge = (status?: string, completed?: boolean) => {
    if (completed || status === "completed") {
      return {
        label: "Completed",
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      };
    }
    if (status === "in_progress") {
      return {
        label: "In Progress",
        className: "bg-violet-500/10 text-violet-300 border-violet-500/20",
      };
    }
    if (status === "review") {
      return {
        label: "Review",
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      };
    }
    return {
      label: "To Do",
      className: "bg-zinc-800 text-zinc-300 border-zinc-700",
    };
  };

  const statusInfo = getStatusBadge(task.status, task.completed);
  const displayDueDate = task.due_date || task.dueDate;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-150 ${
        task.completed
          ? "border-white/5 bg-[#121217]/50 opacity-75"
          : "border-white/5 bg-[#121217] hover:border-violet-500/30 hover:bg-[#16161d]"
      }`}
    >
      <div>
        <div className="flex items-start gap-3">
          {/* Placeholder for checkbox (no action) */}
          <div
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
              task.completed
                ? "border-violet-500 bg-violet-600"
                : "border-zinc-600 bg-zinc-900"
            }`}
          >
            {task.completed && <Check className="w-3 h-3 stroke-[3] text-white" />}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-medium leading-snug ${
                task.completed
                  ? "line-through text-zinc-500"
                  : "text-zinc-100"
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Badges / Metadata row */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pl-7 text-xs">
          {/* Status badge */}
          <span
            className={`rounded border px-2 py-0.5 text-[10px] font-medium ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>

          {/* Priority badge */}
          <span
            className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getPriorityBadge(
              task.priority
            )}`}
          >
            {task.priority}
          </span>

          {/* Project tag if available */}
          {task.project && (
            <span className="rounded bg-black/40 border border-white/5 px-2 py-0.5 text-[11px] font-mono text-zinc-400">
              {task.project}
            </span>
          )}

          {/* Deadline / Due date */}
          {displayDueDate && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 ml-auto">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{displayDueDate}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
