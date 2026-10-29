"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Priority, TaskStatus } from "@/components/types";
import { logActivity } from "@/lib/activity/logger";

export interface TaskInput {
  title: string;
  description?: string;
  project_id?: string | null;
  priority?: Priority;
  status?: TaskStatus;
  due_date?: string | null;
}

export async function getTasks() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*, project:projects(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error.message);
    throw new Error(error.message);
  }

  return (
    data?.map((t: any) => ({
      ...t,
      project: t.project?.name || null,
    })) || []
  );
}

export async function createTask(input: TaskInput) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const title = input.title?.trim();
  if (!title) {
    return { error: "Task title is required." };
  }

  const priority = input.priority || "Medium";
  const status = input.status || "todo";
  const completed = status === "completed";

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      description: input.description?.trim() || null,
      project_id: input.project_id || null,
      priority,
      status,
      completed,
      due_date: input.due_date?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/");

  await logActivity({
    action: "task.created",
    entityType: "task",
    entityId: data.id,
    description: `Created task "${data.title}"`,
    metadata: { taskTitle: data.title, priority: data.priority, status: data.status },
  });

  return { data };
}

export async function updateTask(id: string, input: Partial<TaskInput> & { completed?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const updatePayload: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const trimmed = input.title.trim();
    if (!trimmed) {
      return { error: "Task title cannot be empty." };
    }
    updatePayload.title = trimmed;
  }
  if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
  if (input.priority !== undefined) updatePayload.priority = input.priority;
  if (input.project_id !== undefined) updatePayload.project_id = input.project_id || null;
  if (input.due_date !== undefined) updatePayload.due_date = input.due_date?.trim() || null;

  if (input.completed !== undefined) {
    updatePayload.completed = input.completed;
    updatePayload.status = input.completed ? "completed" : "todo";
  } else if (input.status !== undefined) {
    updatePayload.status = input.status;
    updatePayload.completed = input.status === "completed";
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/");

  const isCompleteToggle = input.completed !== undefined;
  const actionStr = isCompleteToggle
    ? input.completed ? "task.completed" : "task.reopened"
    : "task.updated";
  const descStr = isCompleteToggle
    ? input.completed ? `Completed task "${data.title}"` : `Reopened task "${data.title}"`
    : `Updated task "${data.title}"`;
  await logActivity({
    action: actionStr,
    entityType: "task",
    entityId: id,
    description: descStr,
    metadata: { taskTitle: data.title },
  });

  return { data };
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/tasks");
  revalidatePath("/");

  await logActivity({
    action: "task.deleted",
    entityType: "task",
    entityId: id,
    description: "Deleted a task",
  });

  return { success: true };
}
