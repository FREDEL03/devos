"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Project, ProjectStatus } from "@/components/types";

export interface ProjectInput {
  name: string;
  description?: string;
  technology_stack?: string[];
  status?: ProjectStatus;
  progress?: number;
  start_date?: string | null;
  target_date?: string | null;
}

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Fetch user projects
  const { data: projectsData, error: projError } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (projError) {
    console.error("Error fetching projects:", projError.message);
    throw new Error(projError.message);
  }

  // Fetch user tasks to compute project-task associations & progress
  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, project_id, completed");

  const tasks = tasksData || [];

  const projects: Project[] = (projectsData || []).map((p: any) => {
    const tech =
      (p.technology_stack && p.technology_stack.length > 0)
        ? p.technology_stack
        : (p.technologies && p.technologies.length > 0)
        ? p.technologies
        : [];

    const projectTasks = tasks.filter((t: any) => t.project_id === p.id);
    const tasksCount = projectTasks.length;
    const completedTasksCount = projectTasks.filter((t: any) => t.completed).length;

    // Calculate progress using task completion data when appropriate
    let computedProgress = p.progress ?? 0;
    if (tasksCount > 0) {
      computedProgress = Math.round((completedTasksCount / tasksCount) * 100);
    }

    return {
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      description: p.description,
      technologies: tech,
      technology_stack: tech,
      technology: tech,
      progress: computedProgress,
      status: (p.status as ProjectStatus) || "In Progress",
      start_date: p.start_date,
      target_date: p.target_date,
      created_at: p.created_at,
      updated_at: p.updated_at,
      tasks_count: tasksCount,
      completed_tasks_count: completedTasksCount,
    };
  });

  return projects;
}

export async function createProject(input: ProjectInput) {
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
    return { error: "Project name is required." };
  }

  const tech = input.technology_stack || [];
  const status = input.status || "In Progress";
  const progress = Math.min(100, Math.max(0, input.progress ?? 0));

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      description: input.description?.trim() || null,
      technologies: tech,
      technology_stack: tech,
      status,
      progress,
      start_date: input.start_date?.trim() || null,
      target_date: input.target_date?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath("/");
  return { data };
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
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
    if (!trimmed) {
      return { error: "Project name cannot be empty." };
    }
    payload.name = trimmed;
  }
  if (input.description !== undefined) payload.description = input.description?.trim() || null;
  if (input.technology_stack !== undefined) {
    payload.technology_stack = input.technology_stack;
    payload.technologies = input.technology_stack;
  }
  if (input.status !== undefined) payload.status = input.status;
  if (input.progress !== undefined) payload.progress = Math.min(100, Math.max(0, input.progress));
  if (input.start_date !== undefined) payload.start_date = input.start_date?.trim() || null;
  if (input.target_date !== undefined) payload.target_date = input.target_date?.trim() || null;

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath("/");
  return { data };
}

export async function archiveProject(id: string) {
  return await updateProject(id, { status: "Archived" });
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true };
}
