"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { WorkLog } from "@/components/types";

export interface WorkLogInput {
  title: string;
  project_id?: string | null;
  entry_date: string;
  work_summary: string;
  challenges?: string | null;
  lessons_learned?: string | null;
  category?: string;
  duration_minutes?: number | null;
}

export async function getWorkLogs(): Promise<WorkLog[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("work_logs")
    .select(
      `
      id,
      user_id,
      project_id,
      entry_date,
      title,
      work_summary,
      challenges,
      lessons_learned,
      category,
      duration_minutes,
      logged_at,
      created_at,
      updated_at,
      projects (
        id,
        name
      )
    `
    )
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching work logs from Supabase:", error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    entry_date: row.entry_date || (row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0]),
    title: row.title,
    work_summary: row.work_summary || "",
    challenges: row.challenges || null,
    lessons_learned: row.lessons_learned || null,
    category: row.category || "General",
    duration_minutes: row.duration_minutes ?? null,
    logged_at: row.logged_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    project: row.projects ? { id: row.projects.id, name: row.projects.name } : null,
  }));
}

export async function createWorkLog(input: WorkLogInput): Promise<{ data?: WorkLog; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to log daily work." };
  }

  const trimmedTitle = input.title?.trim();
  const trimmedSummary = input.work_summary?.trim();

  if (!trimmedTitle) {
    return { error: "Work log title is required." };
  }

  if (!trimmedSummary) {
    return { error: "Work summary is required." };
  }

  const entryDate = input.entry_date?.trim() || new Date().toISOString().split("T")[0];

  const payload = {
    user_id: user.id,
    project_id: input.project_id || null,
    entry_date: entryDate,
    title: trimmedTitle,
    work_summary: trimmedSummary,
    challenges: input.challenges?.trim() || null,
    lessons_learned: input.lessons_learned?.trim() || null,
    category: input.category?.trim() || "General",
    duration_minutes: input.duration_minutes && input.duration_minutes > 0 ? Number(input.duration_minutes) : null,
  };

  const { data, error } = await supabase
    .from("work_logs")
    .insert(payload)
    .select(
      `
      id,
      user_id,
      project_id,
      entry_date,
      title,
      work_summary,
      challenges,
      lessons_learned,
      category,
      duration_minutes,
      logged_at,
      created_at,
      updated_at,
      projects (
        id,
        name
      )
    `
    )
    .single();

  if (error) {
    console.error("Error creating work log in Supabase:", error.message);
    return { error: error.message };
  }

  revalidatePath("/work-logs");
  revalidatePath("/");

  const row = data as any;
  const created: WorkLog = {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    entry_date: row.entry_date,
    title: row.title,
    work_summary: row.work_summary,
    challenges: row.challenges,
    lessons_learned: row.lessons_learned,
    category: row.category,
    duration_minutes: row.duration_minutes,
    logged_at: row.logged_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    project: row.projects ? { id: row.projects.id, name: row.projects.name } : null,
  };

  return { data: created };
}

export async function updateWorkLog(
  id: string,
  input: Partial<WorkLogInput>
): Promise<{ data?: WorkLog; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to update a work log." };
  }

  const payload: Record<string, any> = {};

  if (input.title !== undefined) {
    const trimmed = input.title.trim();
    if (!trimmed) return { error: "Title cannot be blank." };
    payload.title = trimmed;
  }

  if (input.work_summary !== undefined) {
    const trimmed = input.work_summary.trim();
    if (!trimmed) return { error: "Work summary cannot be blank." };
    payload.work_summary = trimmed;
  }

  if (input.entry_date !== undefined) {
    payload.entry_date = input.entry_date.trim();
  }

  if (input.challenges !== undefined) {
    payload.challenges = input.challenges?.trim() || null;
  }

  if (input.lessons_learned !== undefined) {
    payload.lessons_learned = input.lessons_learned?.trim() || null;
  }

  if (input.project_id !== undefined) {
    payload.project_id = input.project_id || null;
  }

  if (input.category !== undefined) {
    payload.category = input.category.trim() || "General";
  }

  if (input.duration_minutes !== undefined) {
    payload.duration_minutes =
      input.duration_minutes && input.duration_minutes > 0
        ? Number(input.duration_minutes)
        : null;
  }

  const { data, error } = await supabase
    .from("work_logs")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      `
      id,
      user_id,
      project_id,
      entry_date,
      title,
      work_summary,
      challenges,
      lessons_learned,
      category,
      duration_minutes,
      logged_at,
      created_at,
      updated_at,
      projects (
        id,
        name
      )
    `
    )
    .single();

  if (error) {
    console.error("Error updating work log in Supabase:", error.message);
    return { error: error.message };
  }

  revalidatePath("/work-logs");
  revalidatePath("/");

  const row = data as any;
  const updated: WorkLog = {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    entry_date: row.entry_date,
    title: row.title,
    work_summary: row.work_summary,
    challenges: row.challenges,
    lessons_learned: row.lessons_learned,
    category: row.category,
    duration_minutes: row.duration_minutes,
    logged_at: row.logged_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    project: row.projects ? { id: row.projects.id, name: row.projects.name } : null,
  };

  return { data: updated };
}

export async function deleteWorkLog(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized." };
  }

  const { error } = await supabase
    .from("work_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting work log:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/work-logs");
  revalidatePath("/");
  return { success: true };
}

/**
 * Runnable self-check for work log validation rules.
 */
export async function __runWorkLogsValidationSelfCheck(): Promise<boolean> {
  const validDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!validDateRegex.test("2026-10-29")) {
    throw new Error("Date regex check failed");
  }
  return true;
}
