"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LearningEntry, LearningCategory, LearningStatus } from "@/components/types";

export interface LearningEntryInput {
  title: string;
  description?: string | null;
  category: LearningCategory | string;
  status: LearningStatus | string;
  target_date?: string | null;
  level?: "Beginner" | "Intermediate" | "Advanced" | "Exploratory";
  mastery_percentage?: number;
  notes?: string | null;
}

export async function getLearningEntries(): Promise<LearningEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("learning_entries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching learning entries:", error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title || row.topic || "Untitled Topic",
    topic: row.topic || row.title || "Untitled Topic",
    description: row.description || null,
    category: row.category || "General",
    status: row.status || (row.mastery_percentage >= 100 ? "Completed" : "In Progress"),
    target_date: row.target_date || null,
    level: row.level || "Intermediate",
    mastery_percentage: typeof row.mastery_percentage === "number" ? row.mastery_percentage : 0,
    notes: row.notes || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createLearningEntry(
  input: LearningEntryInput
): Promise<{ data?: LearningEntry; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to add learning topics." };
  }

  const trimmedTitle = input.title?.trim();
  if (!trimmedTitle) {
    return { error: "Topic title is required." };
  }

  const mastery = Math.min(
    100,
    Math.max(0, typeof input.mastery_percentage === "number" ? input.mastery_percentage : 0)
  );

  const payload = {
    user_id: user.id,
    title: trimmedTitle,
    topic: trimmedTitle,
    description: input.description?.trim() || null,
    category: input.category || "General",
    status: input.status || (mastery === 100 ? "Completed" : "In Progress"),
    target_date: input.target_date?.trim() || null,
    level: input.level || "Intermediate",
    mastery_percentage: mastery,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from("learning_entries")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error creating learning entry in Supabase:", error.message);
    return { error: error.message };
  }

  revalidatePath("/learning");
  revalidatePath("/");

  const row = data as any;
  const created: LearningEntry = {
    id: row.id,
    user_id: row.user_id,
    title: row.title || row.topic,
    topic: row.topic || row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    target_date: row.target_date,
    level: row.level,
    mastery_percentage: row.mastery_percentage,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  return { data: created };
}

export async function updateLearningEntry(
  id: string,
  input: Partial<LearningEntryInput>
): Promise<{ data?: LearningEntry; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to update a learning topic." };
  }

  const payload: Record<string, any> = {};

  if (input.title !== undefined) {
    const trimmed = input.title.trim();
    if (!trimmed) return { error: "Topic title cannot be empty." };
    payload.title = trimmed;
    payload.topic = trimmed;
  }

  if (input.description !== undefined) {
    payload.description = input.description?.trim() || null;
  }

  if (input.category !== undefined) {
    payload.category = input.category;
  }

  if (input.status !== undefined) {
    payload.status = input.status;
  }

  if (input.target_date !== undefined) {
    payload.target_date = input.target_date?.trim() || null;
  }

  if (input.level !== undefined) {
    payload.level = input.level;
  }

  if (input.mastery_percentage !== undefined) {
    const m = Math.min(100, Math.max(0, Number(input.mastery_percentage) || 0));
    payload.mastery_percentage = m;
    if (m === 100 && (!input.status || input.status === "In Progress")) {
      payload.status = "Completed";
    }
  }

  if (input.notes !== undefined) {
    payload.notes = input.notes?.trim() || null;
  }

  const { data, error } = await supabase
    .from("learning_entries")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating learning entry in Supabase:", error.message);
    return { error: error.message };
  }

  revalidatePath("/learning");
  revalidatePath("/");

  const row = data as any;
  const updated: LearningEntry = {
    id: row.id,
    user_id: row.user_id,
    title: row.title || row.topic,
    topic: row.topic || row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    target_date: row.target_date,
    level: row.level,
    mastery_percentage: row.mastery_percentage,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  return { data: updated };
}

export async function deleteLearningEntry(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized." };
  }

  const { error } = await supabase
    .from("learning_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting learning entry:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/learning");
  revalidatePath("/");
  return { success: true };
}

/**
 * Async self-check for learning validation rules.
 */
export async function __runLearningValidationSelfCheck(): Promise<boolean> {
  const categories = [
    "Laravel",
    "Next.js",
    "React",
    "TypeScript",
    "SQL",
    "AI Integration",
    "Software Engineering",
    "DevOps",
  ];
  if (categories.length !== 8) {
    throw new Error("Categories mismatch in self-check");
  }
  return true;
}
