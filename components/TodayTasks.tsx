"use client";

import React, { useState } from "react";
import { Check, Plus, Search, Filter } from "./icons";
import { Task, Priority } from "./types";

interface TodayTasksProps {
  tasks: Task[];
  searchQuery: string;
  onToggleTask: (id: string) => void;
  onOpenNewTask: () => void;
}

export function TodayTasks({
  tasks,
  searchQuery,
  onToggleTask,
  onOpenNewTask,
}: TodayTasksProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filteredTasks = tasks.filter((t) => {
    // Search query filter
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.project ? t.project.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (t.description ? t.description.toLowerCase().includes(searchQuery.toLowerCase()) : false);

    // Status filter
    if (filter === "pending") return matchesSearch && !t.completed;
    if (filter === "completed") return matchesSearch && t.completed;
    return matchesSearch;
  });

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

  return (
    <div className="rounded-xl border border-white/5 bg-[#121217] p-5">
      {/* Header with Title and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Today&apos;s Tasks
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs text-violet-400 font-mono">
              {filteredTasks.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-500">Key engineering goals & deliverables</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/5 text-xs">
            {(["all", "pending", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
                  filter === tab
                    ? "bg-violet-600/30 text-violet-200 border border-violet-500/30 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-600/10 px-2.5 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="mt-4 space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 mb-2">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-zinc-400">No tasks found</p>
            <p className="text-xs text-zinc-600 mt-1 max-w-xs">
              {searchQuery
                ? `No tasks matching "${searchQuery}"`
                : "All caught up! Use the button above to add a new task."}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`group flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-all duration-150 ${
                task.completed
                  ? "bg-white/[0.01] border-white/5 opacity-60"
                  : "bg-white/[0.03] border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04]"
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                aria-label={`Mark task ${task.title} as ${task.completed ? "pending" : "complete"}`}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  task.completed
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-zinc-600 bg-zinc-900 group-hover:border-violet-400"
                }`}
              >
                {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-sm font-medium leading-snug transition-colors ${
                      task.completed
                        ? "line-through text-zinc-500"
                        : "text-zinc-200 group-hover:text-white"
                    }`}
                  >
                    {task.title}
                  </p>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  {/* Associated Project */}
                  {task.project && (
                    <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-300 font-mono text-[11px] border border-white/5">
                      {task.project}
                    </span>
                  )}

                  {/* Priority */}
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getPriorityBadge(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>

                  {(task.due_date || task.dueDate) && (
                    <span className="text-zinc-500 text-[11px]">
                      • {task.due_date || task.dueDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
