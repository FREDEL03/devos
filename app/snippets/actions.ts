"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CodeSnippet } from "@/components/types";

export interface SnippetInput {
  title: string;
  description?: string | null;
  code: string;
  language?: string;
  tags?: string[];
}

export async function getSnippets(): Promise<CodeSnippet[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("code_snippets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching code snippets:", error.message);
    throw new Error(error.message);
  }

  return (
    data?.map((s: any) => ({
      id: s.id,
      user_id: s.user_id,
      title: s.title,
      description: s.description || null,
      code: s.code,
      language: s.language || "typescript",
      tags: s.tags || [],
      created_at: s.created_at,
      updated_at: s.updated_at,
    })) || []
  );
}

export async function createSnippet(input: SnippetInput) {
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
    return { error: "Snippet title is required." };
  }

  const code = input.code?.trim();
  if (!code) {
    return { error: "Snippet code is required." };
  }

  const language = (input.language?.trim() || "typescript").toLowerCase();
  const tags = (input.tags || []).map((t) => t.trim()).filter(Boolean);

  const { data, error } = await supabase
    .from("code_snippets")
    .insert({
      user_id: user.id,
      title,
      description: input.description?.trim() || null,
      code,
      language,
      tags,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/snippets");
  revalidatePath("/");
  return { data };
}

export async function updateSnippet(id: string, input: Partial<SnippetInput>) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) {
    const trimmedTitle = input.title.trim();
    if (!trimmedTitle) {
      return { error: "Snippet title cannot be empty." };
    }
    payload.title = trimmedTitle;
  }

  if (input.code !== undefined) {
    const trimmedCode = input.code.trim();
    if (!trimmedCode) {
      return { error: "Snippet code cannot be empty." };
    }
    payload.code = trimmedCode;
  }

  if (input.description !== undefined) {
    payload.description = input.description?.trim() || null;
  }

  if (input.language !== undefined) {
    payload.language = input.language.trim().toLowerCase() || "typescript";
  }

  if (input.tags !== undefined) {
    payload.tags = input.tags.map((t) => t.trim()).filter(Boolean);
  }

  const { data, error } = await supabase
    .from("code_snippets")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/snippets");
  revalidatePath("/");
  return { data };
}

export async function deleteSnippet(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("code_snippets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/snippets");
  revalidatePath("/");
  return { success: true };
}
