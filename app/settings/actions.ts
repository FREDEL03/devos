"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UserSettings, UserDataStats, DEFAULT_USER_SETTINGS } from "@/components/types";
import { verifyGeminiConnection } from "@/lib/ai/gemini";
import { logActivity } from "@/lib/activity/logger";

/**
 * Get the current authenticated user's settings.
 * Returns default settings if no record exists yet or if the table is pending migration.
 */
export async function getUserSettings(): Promise<UserSettings> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in to view settings.");
  }

  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("Could not load user_settings from DB (falling back to defaults):", error.message);
      return { ...DEFAULT_USER_SETTINGS, user_id: user.id };
    }

    if (!data) {
      return { ...DEFAULT_USER_SETTINGS, user_id: user.id };
    }

    return {
      user_id: data.user_id,
      theme: data.theme || DEFAULT_USER_SETTINGS.theme,
      accent_color: data.accent_color || DEFAULT_USER_SETTINGS.accent_color,
      date_format: data.date_format || DEFAULT_USER_SETTINGS.date_format,
      time_format: data.time_format || DEFAULT_USER_SETTINGS.time_format,
      preferred_language: data.preferred_language || DEFAULT_USER_SETTINGS.preferred_language,
      default_task_priority: data.default_task_priority || DEFAULT_USER_SETTINGS.default_task_priority,
      default_task_view: data.default_task_view || DEFAULT_USER_SETTINGS.default_task_view,
      default_task_sort: data.default_task_sort || DEFAULT_USER_SETTINGS.default_task_sort,
      default_landing: data.default_landing || DEFAULT_USER_SETTINGS.default_landing,
      response_style: data.response_style || DEFAULT_USER_SETTINGS.response_style,
      sidebar_collapsed: Boolean(data.sidebar_collapsed),
      compact_density: Boolean(data.compact_density),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.warn("Settings fetch fallback:", err);
    return { ...DEFAULT_USER_SETTINGS, user_id: user.id };
  }
}

/**
 * Update or insert the current user's settings.
 */
export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<{ success?: boolean; data?: UserSettings; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized. Please log in." };
  }

  // Validate allowed values
  const validThemes = ["dark", "light", "system"];
  const validAccents = ["violet", "indigo", "emerald", "blue", "amber", "rose"];
  const validDateFormats = ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"];
  const validTimeFormats = ["12h", "24h"];
  const validPriorities = ["Low", "Medium", "High"];
  const validViews = ["List", "Grid"];
  const validSorts = ["priority", "due_date", "created_at", "title"];
  const validStyles = ["concise", "balanced", "detailed"];

  if (settings.theme && !validThemes.includes(settings.theme)) {
    return { error: `Invalid theme: "${settings.theme}"` };
  }
  if (settings.accent_color && !validAccents.includes(settings.accent_color)) {
    return { error: `Invalid accent color: "${settings.accent_color}"` };
  }
  if (settings.date_format && !validDateFormats.includes(settings.date_format)) {
    return { error: `Invalid date format: "${settings.date_format}"` };
  }
  if (settings.time_format && !validTimeFormats.includes(settings.time_format)) {
    return { error: `Invalid time format: "${settings.time_format}"` };
  }
  if (settings.default_task_priority && !validPriorities.includes(settings.default_task_priority)) {
    return { error: `Invalid default priority: "${settings.default_task_priority}"` };
  }
  if (settings.default_task_view && !validViews.includes(settings.default_task_view)) {
    return { error: `Invalid default task view: "${settings.default_task_view}"` };
  }
  if (settings.default_task_sort && !validSorts.includes(settings.default_task_sort)) {
    return { error: `Invalid task sort option: "${settings.default_task_sort}"` };
  }
  if (settings.response_style && !validStyles.includes(settings.response_style)) {
    return { error: `Invalid AI response style: "${settings.response_style}"` };
  }

  try {
    const payload = {
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_settings")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("Failed to update user_settings:", error.message);
      return { error: `Failed to persist settings: ${error.message}` };
    }

    revalidatePath("/settings");
    revalidatePath("/");

    await logActivity({
      action: "settings.updated",
      entityType: "settings",
      description: "Updated settings",
      // ponytail: only log key names, not values — some settings (theme, accent) are safe but we keep it minimal
      metadata: { changedKeys: Object.keys(settings).filter((k) => k !== "user_id") },
    });

    return { success: true, data: data as UserSettings };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error while saving settings";
    return { error: msg };
  }
}

/**
 * Update user profile details (display name and avatar).
 * Email updates are explicitly restricted to Supabase Auth official flow.
 */
export async function updateUserProfile(
  fullName: string,
  avatarUrl?: string
): Promise<{ success?: boolean; error?: string }> {
  const trimmedName = fullName?.trim();
  if (!trimmedName) {
    return { error: "Display name cannot be empty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized." };
  }

  // 1. Update auth.users metadata
  const { error: userError } = await (supabase.auth as any).updateUser({
    data: {
      full_name: trimmedName,
      avatar_url: avatarUrl?.trim() || null,
    },
  });

  if (userError) {
    return { error: userError.message };
  }

  // 2. Sync to public.profiles table
  await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,
      full_name: trimmedName,
      avatar_url: avatarUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .catch((err: unknown) => {
      console.warn("Could not sync to profiles table:", err);
    });

  revalidatePath("/", "layout");

  await logActivity({
    action: "profile.updated",
    entityType: "profile",
    description: "Updated profile information",
    metadata: { hasAvatarUrl: Boolean(avatarUrl?.trim()) },
  });

  return { success: true };
} using official Supabase Auth.
 */
export async function changePassword(
  newPassword: string,
  confirmPassword: string
): Promise<{ success?: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { error: "New password must be at least 6 characters long." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized. Please log in again." };
  }

  const { error } = await (supabase.auth as any).updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Retrieve counts of user records across all DevOS modules.
 */
export async function getUserDataStats(): Promise<UserDataStats> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      tasksCount: 0,
      projectsCount: 0,
      snippetsCount: 0,
      workLogsCount: 0,
      learningEntriesCount: 0,
    };
  }

  const [tasksRes, projectsRes, snippetsRes, logsRes, learningRes] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("code_snippets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("work_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("learning_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return {
    tasksCount: tasksRes.count ?? 0,
    projectsCount: projectsRes.count ?? 0,
    snippetsCount: snippetsRes.count ?? 0,
    workLogsCount: logsRes.count ?? 0,
    learningEntriesCount: learningRes.count ?? 0,
  };
}

/**
 * Export all personal records belonging strictly to the authenticated user.
 */
export async function exportUserData(): Promise<{
  exportDate: string;
  user: { id: string; email?: string };
  settings: UserSettings;
  tasks: unknown[];
  projects: unknown[];
  snippets: unknown[];
  workLogs: unknown[];
  learningEntries: unknown[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized.");
  }

  const [settings, tasksRes, projectsRes, snippetsRes, logsRes, learningRes] = await Promise.all([
    getUserSettings().catch(() => DEFAULT_USER_SETTINGS),
    supabase.from("tasks").select("*").eq("user_id", user.id),
    supabase.from("projects").select("*").eq("user_id", user.id),
    supabase.from("code_snippets").select("*").eq("user_id", user.id),
    supabase.from("work_logs").select("*").eq("user_id", user.id),
    supabase.from("learning_entries").select("*").eq("user_id", user.id),
  ]);

  return {
    exportDate: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    settings,
    tasks: tasksRes.data || [],
    projects: projectsRes.data || [],
    snippets: snippetsRes.data || [],
    workLogs: logsRes.data || [],
    learningEntries: learningRes.data || [],
  };
}

/**
 * Clear specific personal data collections for the authenticated user.
 */
export async function clearUserCollection(
  collection: "tasks" | "projects" | "code_snippets" | "work_logs" | "learning_entries"
): Promise<{ success?: boolean; error?: string; count?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized." };
  }

  const allowed = ["tasks", "projects", "code_snippets", "work_logs", "learning_entries"];
  if (!allowed.includes(collection)) {
    return { error: `Invalid collection: ${collection}` };
  }

  const { error } = await supabase
    .from(collection)
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Safe server-side AI status verification for Gemini.
 * Never leaks the API key to the client.
 */
export async function getAISettingsStatus(): Promise<{
  provider: string;
  model: string;
  configured: boolean;
  error?: string;
}> {
  return await verifyGeminiConnection();
}
