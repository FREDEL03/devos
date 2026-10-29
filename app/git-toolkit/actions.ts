"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GitTemplate } from "@/components/types";
import { logActivity } from "@/lib/activity/logger";

export interface GitTemplateInput {
  name: string;
  change_type: string;
  branch_prefix?: string;
  commit_template?: string;
  pr_title_template?: string;
  pr_description_template?: string;
}

export async function getGitTemplates(): Promise<GitTemplate[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("git_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching git templates:", error.message);
    return [];
  }

  return (
    data?.map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      name: t.name,
      change_type: t.change_type,
      branch_prefix: t.branch_prefix,
      commit_template: t.commit_template,
      pr_title_template: t.pr_title_template,
      pr_description_template: t.pr_description_template,
      created_at: t.created_at,
      updated_at: t.updated_at,
    })) || []
  );
}

export async function createGitTemplate(input: GitTemplateInput) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const name = input.name?.trim();
  if (!name) {
    return { error: "Template name is required." };
  }

  const change_type = input.change_type?.trim() || "feat";
  const branch_prefix = input.branch_prefix?.trim() || `${change_type}/`;
  const commit_template = input.commit_template?.trim() || "{type}({scope}): {title}";
  const pr_title_template = input.pr_title_template?.trim() || "[{id}] {type}: {title}";
  const pr_description_template = input.pr_description_template?.trim() || "## Summary\n{description}";

  const { data, error } = await supabase
    .from("git_templates")
    .insert({
      user_id: user.id,
      name,
      change_type,
      branch_prefix,
      commit_template,
      pr_title_template,
      pr_description_template,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/git-toolkit");
  revalidatePath("/");

  await logActivity({
    action: "git_template.created",
    entityType: "git_template",
    entityId: data.id,
    description: `Saved git template "${data.name}"`,
    metadata: { templateName: data.name, changeType: data.change_type },
  });

  return { data };
}

export async function updateGitTemplate(id: string, input: Partial<GitTemplateInput>) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) return { error: "Template name cannot be empty." };
    payload.name = trimmed;
  }
  if (input.change_type !== undefined) payload.change_type = input.change_type.trim();
  if (input.branch_prefix !== undefined) payload.branch_prefix = input.branch_prefix.trim();
  if (input.commit_template !== undefined) payload.commit_template = input.commit_template.trim();
  if (input.pr_title_template !== undefined) payload.pr_title_template = input.pr_title_template.trim();
  if (input.pr_description_template !== undefined) payload.pr_description_template = input.pr_description_template.trim();

  const { data, error } = await supabase
    .from("git_templates")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/git-toolkit");
  revalidatePath("/");
  return { data };
}

export async function deleteGitTemplate(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("git_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/git-toolkit");
  revalidatePath("/");

  await logActivity({
    action: "git_template.deleted",
    entityType: "git_template",
    entityId: id,
    description: "Deleted a git template",
  });

  return { success: true };
}
