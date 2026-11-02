"use client";

import React, { useState, useMemo } from "react";
import { Task, TaskStatus, Project } from "./types";
import { TaskColumn } from "./TaskColumn";
import { updateTask } from "@/app/tasks/actions";
import { toast } from "./Toast";

interface TaskBoardProps {
  tasks: Task[];
  projects: Project[] | { id: string; name: string }[];
  onTasksChange: (tasks: Task[]) => void;
  onOpenTaskDetail: (task: Task) => void;
}

const COLUMNS: { id: TaskStatus; title: string; description: string }[] = [
  {
    id: "todo",
    title: "To Do",
    description: "Tasks that are pending",
  },
  {
    id: "in_progress",
    title: "In Progress",
    description: "Tasks actively being worked on",
  },
  {
    id: "review",
    title: "Review",
    description: "Tasks ready for review",
  },
  {
    id: "completed",
    title: "Done",
    description: "Completed tasks",
  },
];

export function TaskBoard({
  tasks,
  projects,
  onTasksChange,
  onOpenTaskDetail,
}: TaskBoardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Group tasks by status
  const tasksByColumn = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      completed: [],
    };

    tasks.forEach((task) => {
      const status = task.status || "todo";
      // Ensure status is valid TaskStatus
      if (status in groups) {
        groups[status as TaskStatus].push(task);
      } else {
        groups.todo.push(task);
      }
    });

    return groups;
  }, [tasks]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status || "todo";
    if (newStatus === oldStatus) return;

    // Optimistic update
    const updatedTasks = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: newStatus,
            completed: newStatus === "completed",
          }
        : t
    );
    onTasksChange(updatedTasks);

    setIsUpdating(true);
    try {
      const res = await updateTask(taskId, {
        status: newStatus,
        completed: newStatus === "completed",
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      toast.success("Task moved", {
        description: `Moved "${task.title}" to ${COLUMNS.find((c) => c.id === newStatus)?.title}`,
      });
    } catch (err: any) {
      console.error("Failed to update task status:", err);
      // Revert optimistic update
      onTasksChange(tasks);
      toast.error("Move failed", {
        description: err.message || "Could not update task status",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Board Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Task Board</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Click task cards to view details, use buttons to change status
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-violet-400">Note:</span>
            <span>Drag-and-drop requires @dnd-kit installation</span>
          </div>
        </div>
      </div>

      {/* Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {COLUMNS.map((column) => (
          <TaskColumn
            key={column.id}
            id={column.id}
            title={column.title}
            description={column.description}
            tasks={tasksByColumn[column.id]}
            count={tasksByColumn[column.id].length}
            onTaskClick={onOpenTaskDetail}
            isUpdating={isUpdating}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {/* Board Help */}
      <div className="mt-6 pt-4 border-t border-white/5 text-xs text-zinc-500">
        <p>
          💡 <span className="font-medium text-zinc-400">Tip:</span> Click a task
          to view details, or use status buttons to move between columns.
        </p>
      </div>
    </div>
  );
}