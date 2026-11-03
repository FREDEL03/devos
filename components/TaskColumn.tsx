"use client";

import React from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task, TaskStatus } from "./types";
import { TaskCard } from "./TaskCard";
import { Plus, Loader2, ChevronDown, ChevronUp } from "./icons";

interface DraggableTaskProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  columnId: TaskStatus;
  getPrevStatus: (current: TaskStatus) => TaskStatus | null;
  getNextStatus: (current: TaskStatus) => TaskStatus | null;
}

function DraggableTask({
  task,
  onTaskClick,
  onStatusChange,
  columnId,
  getPrevStatus,
  getNextStatus,
}: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      {/* Status Change Buttons */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {getPrevStatus(columnId) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, getPrevStatus(columnId)!);
            }}
            className="p-1 rounded bg-black/60 border border-white/10 hover:bg-black/80"
            title={`Move to ${getPrevStatus(columnId)}`}
          >
            <ChevronUp className="w-3 h-3 text-zinc-300 rotate-270" />
          </button>
        )}
        {getNextStatus(columnId) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, getNextStatus(columnId)!);
            }}
            className="p-1 rounded bg-black/60 border border-white/10 hover:bg-black/80"
            title={`Move to ${getNextStatus(columnId)}`}
          >
            <ChevronUp className="w-3 h-3 text-zinc-300 rotate-90" />
          </button>
        )}
      </div>
      <div onClick={() => onTaskClick(task)}>
        <TaskCard task={task} />
      </div>
    </div>
  );
}

interface TaskColumnProps {
  id: TaskStatus;
  title: string;
  description: string;
  tasks: Task[];
  count: number;
  onTaskClick: (task: Task) => void;
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
  onStatusChange,
  isUpdating,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

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
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border-2 ${getColumnColor(id)} ${isOver ? "ring-2 ring-violet-500 ring-inset" : ""}`}
    >
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
            </div>
          ) : (
            tasks.map((task) => (
              <DraggableTask
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
                onStatusChange={onStatusChange}
                columnId={id}
                getPrevStatus={getPrevStatus}
                getNextStatus={getNextStatus}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
