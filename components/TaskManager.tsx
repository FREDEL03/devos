"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  CheckSquare,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  X,
  Check,
} from "./icons";
import { Priority, Task, TaskStatus, Project } from "./types";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import {
  createTask,
  updateTask,
  deleteTask,
  TaskInput,
} from "@/app/tasks/actions";

interface TaskManagerProps {
  initialTasks: Task[];
  projects?: { id: string; name: string }[] | Project[];
  onTasksChange?: (updatedTasks: Task[]) => void;
}

export function TaskManager({
  initialTasks,
  projects = [],
  onTasksChange,
}: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "deadline" | "priority">("newest");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  const syncTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    onTasksChange?.(newTasks);
  };

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Handlers
  const handleCreateOrUpdateTask = async (data: TaskInput) => {
    if (editingTask) {
      // Optimistic update
      const updatedList = tasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: data.title,
              description: data.description,
              priority: data.priority || t.priority,
              status: data.status || t.status,
              completed: data.status === "completed",
              due_date: data.due_date,
              dueDate: data.due_date || undefined,
            }
          : t
      );
      syncTasks(updatedList);

      const res = await updateTask(editingTask.id, data);
      if (res?.error) {
        showNotification("error", res.error);
        // revert
        syncTasks(tasks);
        return { error: res.error };
      }
      showNotification("success", "Task updated successfully.");
    } else {
      // Server create
      const res = await createTask(data);
      if (res?.error) {
        showNotification("error", res.error);
        return { error: res.error };
      }
      if (res?.data) {
        const created: Task = {
          id: res.data.id,
          user_id: res.data.user_id,
          title: res.data.title,
          description: res.data.description,
          priority: res.data.priority as Priority,
          status: res.data.status as TaskStatus,
          completed: res.data.completed,
          due_date: res.data.due_date,
          dueDate: res.data.due_date || undefined,
          created_at: res.data.created_at,
          updated_at: res.data.updated_at,
        };
        syncTasks([created, ...tasks]);
      }
      showNotification("success", "Task created in Supabase.");
    }
  };

  const handleToggleComplete = async (id: string, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted;
    const nextStatus: TaskStatus = nextCompleted ? "completed" : "todo";

    // Optimistic update
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: nextCompleted, status: nextStatus } : t
    );
    syncTasks(updated);

    startTransition(async () => {
      const res = await updateTask(id, { completed: nextCompleted, status: nextStatus });
      if (res?.error) {
        showNotification("error", `Failed to update task: ${res.error}`);
        // revert
        syncTasks(tasks);
      }
    });
  };

  const handleDeleteTask = async (id: string) => {
    // Optimistic delete
    const previous = tasks;
    syncTasks(tasks.filter((t) => t.id !== id));

    startTransition(async () => {
      const res = await deleteTask(id);
      if (res?.error) {
        showNotification("error", `Failed to delete task: ${res.error}`);
        syncTasks(previous);
      } else {
        showNotification("success", "Task deleted.");
      }
    });
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // Filter & Sort
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.project && t.project.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && (t.completed || t.status === "completed")) ||
        (statusFilter === "in_progress" && t.status === "in_progress" && !t.completed) ||
        (statusFilter === "todo" && !t.completed && t.status !== "in_progress");

      const matchesPriority =
        priorityFilter === "all" || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === "oldest") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      }
      if (sortBy === "deadline") {
        const dA = a.due_date || a.dueDate || "zz";
        const dB = b.due_date || b.dueDate || "zz";
        return dA.localeCompare(dB);
      }
      if (sortBy === "priority") {
        const pOrder: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      return 0;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy]);

  // Statistics counters
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress" && !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed || t.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Task Management</span>
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs text-violet-400 font-mono">
              {totalCount} total
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time PostgreSQL tasks synchronized with Supabase
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Notification toast */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-xs transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <X className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Controls Bar: Search, Filters, Sorting */}
      <div className="rounded-xl border border-white/5 bg-[#121217] p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search tasks by title, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick status tabs */}
          <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/5 text-xs self-start md:self-auto overflow-x-auto max-w-full">
            {[
              { id: "all", label: `All (${totalCount})` },
              { id: "todo", label: `To Do (${pendingCount - inProgressCount})` },
              { id: "in_progress", label: `In Progress (${inProgressCount})` },
              { id: "completed", label: `Done (${completedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs transition-colors ${
                  statusFilter === tab.id
                    ? "bg-violet-600/30 text-violet-200 border border-violet-500/30 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Second row: Priority Filter & Sort Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] text-zinc-500">Priority:</span>
            <div className="flex items-center gap-1">
              {["all", "High", "Medium", "Low"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                    priorityFilter === p
                      ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                      : "bg-white/[0.02] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {p === "all" ? "All Priorities" : p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] text-zinc-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg bg-zinc-900 border border-white/10 px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="deadline">By Deadline</option>
              <option value="priority">By Priority (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Grid */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#121217] py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-zinc-500 mb-3">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">No tasks found</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "No tasks match your search and filter criteria. Try resetting filters."
                : "You don't have any tasks in Supabase yet. Click 'New Task' to create your first deliverable."}
            </p>
            {(searchQuery || statusFilter !== "all" || priorityFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
                className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-4"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal dialog for create/edit */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        initialTask={editingTask}
        projects={projects}
      />
    </div>
  );
}
