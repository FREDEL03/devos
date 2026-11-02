"use client";

import React, { useState, useTransition } from "react";
import {
  Plus,
  Image as ImageIcon,
} from "./icons";
import { Priority, Task, TaskStatus, Project } from "./types";
import { TaskModal } from "./TaskModal";
import { TaskBoard } from "./TaskBoard";
import { TaskDetailModal } from "./TaskDetailModal";
import { ScreenshotUploadModal } from "./ScreenshotUploadModal";
import { TaskReviewModal, DraftTask } from "./TaskReviewModal";
import { toast } from "./Toast";
import { confirmDialog } from "./ConfirmDialog";
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

  // Screenshot import state
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingTasks, setIsSavingTasks] = useState(false);

  // Task detail modal
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isPending, startTransition] = useTransition();

  const syncTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    onTasksChange?.(newTasks);
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
        toast.error("Failed to update task", { description: res.error });
        // revert
        syncTasks(tasks);
        return { error: res.error };
      }
      toast.success("Task updated", { description: `Changes to "${data.title}" were saved.` });
    } else {
      // Server create
      const res = await createTask(data);
      if (res?.error) {
        toast.error("Failed to create task", { description: res.error });
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
        toast.success("Task created", { description: `"${created.title}" added to your workspace.` });
      }
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
        toast.error("Failed to update task", { description: res.error });
        // revert
        syncTasks(tasks);
      } else {
        toast.info(nextCompleted ? "Task marked completed" : "Task reopened");
      }
    });
  };

  const handleDeleteTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    const confirmed = await confirmDialog({
      title: target ? `Delete "${target.title}"?` : "Delete task?",
      description: "This task will be permanently removed from your workspace. This action cannot be undone.",
      confirmText: "Delete Task",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        const res = await deleteTask(id);
        if (res?.error) {
          throw new Error(res.error);
        }
      },
    });

    if (confirmed) {
      syncTasks(tasks.filter((t) => t.id !== id));
      toast.success("Task deleted", { description: "The task was successfully removed." });
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // Task detail functions
  const handleOpenTaskDetail = (task: Task) => {
    setDetailTask(task);
    setIsDetailModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    onTasksChange?.(
      tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  const handleTaskDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    onTasksChange?.(tasks.filter((t) => t.id !== id));
  };

  // Screenshot import functions
  const handleOpenScreenshotImport = () => {
    setIsScreenshotModalOpen(true);
  };

  const handleAnalyzeScreenshot = async (file: File) => {
    setIsAnalyzing(true);
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/ai/screenshot-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          imageMimeType: file.type,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze screenshot");
      }

      // Convert to draft tasks
      const drafts: DraftTask[] = data.tasks.map((task: any) => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.due_date,
        selected: true,
      }));

      if (drafts.length === 0) {
        toast.info("No tasks detected", {
          description: "The AI couldn't find clear tasks in this screenshot. Try a clearer image.",
        });
        setIsScreenshotModalOpen(false);
        return;
      }

      setDraftTasks(drafts);
      setIsScreenshotModalOpen(false);
      setIsReviewModalOpen(true);
      toast.success("Screenshot analyzed", {
        description: `Found ${drafts.length} potential tasks`,
      });
    } catch (err: any) {
      console.error("Screenshot analysis error:", err);
      toast.error("Analysis failed", {
        description: err.message || "Could not process screenshot",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDraftTasks = async (tasksToSave: DraftTask[]) => {
    setIsSavingTasks(true);
    try {
      const createdTasks: Task[] = [];
      for (const draft of tasksToSave) {
        const input: TaskInput = {
          title: draft.title,
          description: draft.description,
          priority: draft.priority,
          due_date: draft.due_date,
        };
        const res = await createTask(input);
        if (res?.error) {
          throw new Error(`Failed to create task "${draft.title}": ${res.error}`);
        }
        if (res?.data) {
          const task: Task = {
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
          createdTasks.push(task);
        }
      }

      // Update local task list
      syncTasks([...createdTasks, ...tasks]);

      toast.success("Tasks imported", {
        description: `Added ${createdTasks.length} tasks to your list`,
      });

      setIsReviewModalOpen(false);
      setDraftTasks([]);
    } catch (err: any) {
      console.error("Failed to save tasks:", err);
      toast.error("Import failed", {
        description: err.message || "Some tasks could not be saved",
      });
    } finally {
      setIsSavingTasks(false);
    }
  };

  // Statistics counters
  const totalCount = tasks.length;

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

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleOpenScreenshotImport}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Import from Screenshot</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>


      {/* Task Display */}
      <TaskBoard
        tasks={tasks}
        projects={projects}
        onTasksChange={setTasks}
        onOpenTaskDetail={handleOpenTaskDetail}
        onEditTask={handleOpenEdit}
        onDeleteTask={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
      />

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

      {/* Screenshot upload modal */}
      <ScreenshotUploadModal
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        onAnalyze={handleAnalyzeScreenshot}
        isAnalyzing={isAnalyzing}
      />

      {/* Task review modal */}
      <TaskReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        draftTasks={draftTasks}
        onDraftTasksChange={setDraftTasks}
        onSave={handleSaveDraftTasks}
        isSaving={isSavingTasks}
      />

      {/* Task detail modal */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        task={detailTask}
        projects={projects}
        onClose={() => setIsDetailModalOpen(false)}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />
    </div>
  );
}
