"use client";

import React from "react";
import { Task, TaskStatus } from "./types";
import { TaskCard } from "./TaskCard";
import { Plus, Loader2, ChevronDown, ChevronUp } from "./icons";

interface TaskColumnProps {
  id: TaskStatus;
  title: string;
  description: string;
  tasks: Task[];
  count: number;
  onTaskClick: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string, currentCompleted: boolean) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  isUpdating: boolean;
}

export function TaskColumn({
  id,
  title,
  description,
  tasks,
  count,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  onStatusChange,
  isUpdating,
}: TaskColumnProps) {
  const getColumnColor = (columnId: TaskStatus) => {
    switch (columnId) {
      case "todo":
        return "border-zinc-700 bg-zinc-900/30";
      case "in_progress":
        return "border-violet-700/30 bg-violet-900/10";
      case "review":
        return "border-amber-700/30 bg-amber-900/10";
      case "completed":
        return "border-emerald-700/30 bg-emerald-900/10";
      default:
        return "border-zinc-700 bg-zinc-900/30";
    }
  };

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case "todo":
        return "in_progress";
      case "in_progress":
        return "review";
      case "review":
        return "completed";
      default:
        return null;
    }
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    switch (current) {
      case "in_progress":
        return "todo";
      case "review":
        return "in_progress";
      case "completed":
        return "review";
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col rounded-xl border-2 ${getColumnColor(id)}`}>
      {/* Column Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{title}</h3>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-zinc-300">
                {count}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{description}</p>
          </div>
          {isUpdating && id === "todo" && (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-white/10 bg-white/5">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                <Plus className="h-4 w-4 text-zinc-500" />
              </div>
              <p className="text-xs text-zinc-400">No tasks</p>
              <p className="mt-1 text-[11px] text-zinc-500">Click "Add Task" below</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="group relative">
                {/* Status Change Buttons */}
                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {getPrevStatus(id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, getPrevStatus(id)!);
                      }}
                      className="p-1 rounded bg-black/60 border border-white/10 hover:bg-black/80"
                      title={`Move to ${getPrevStatus(id)}`}
                    >
                      <ChevronUp className="w-3 h-3 text-zinc-300 rotate-270" />
                    </button>
                  )}
                  {getNextStatus(id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, getNextStatus(id)!);
                      }}
                      className="p-1 rounded bg-black/60 border border-white/10 hover:bg-black/80"
                      title={`Move to ${getNextStatus(id)}`}
                    >
                      <ChevronUp className="w-3 h-3 text-zinc-300 rotate-90" />
                    </button>
                  )}
                </div>
                <div onClick={() => onTaskClick(task)}>
                  <TaskCard
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Column Footer */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => {
            // Open task creation modal with pre-selected status
            // This will be handled by parent
            console.log("Add task to column:", id);
          }}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/5 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
}