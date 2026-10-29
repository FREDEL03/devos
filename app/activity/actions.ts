"use server";

import { createClient } from "@/lib/supabase/server";
import { ActivityLog } from "@/components/types";
export type { ActivityLog };

export interface GetActivityLogsOptions {
  page?: number;
  pageSize?: number;
  entityType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

const PAGE_SIZE = 25;

export async function getActivityLogs(
  opts: GetActivityLogsOptions = {}
): Promise<{ data: ActivityLog[]; hasMore: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: [], hasMore: false, error: "Unauthorized" };
  }

  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize; // fetch one extra to determine hasMore

  let query = supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.entityType) {
    query = query.eq("entity_type", opts.entityType);
  }

  if (opts.search) {
    // ponytail: ilike search — add full-text index if table grows large
    query = query.ilike("description", `%${opts.search}%`);
  }

  if (opts.dateFrom) {
    query = query.gte("created_at", opts.dateFrom);
  }

  if (opts.dateTo) {
    // Include the full day
    query = query.lte("created_at", opts.dateTo + "T23:59:59.999Z");
  }

  const { data, error } = await query;

  if (error) {
    console.error("[activity] getActivityLogs error:", error.message);
    return { data: [], hasMore: false, error: error.message };
  }

  const rows = (data ?? []) as ActivityLog[];
  const hasMore = rows.length > pageSize;
  return { data: rows.slice(0, pageSize), hasMore };
}

/**
 * Server action for client-side copy events (snippet copy, git copy).
 * Identity is derived from session — client cannot spoof user_id.
 */
export async function logCopyActivity(
  entityType: string,
  entityId: string | null,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: `${entityType}.copied`,
    entity_type: entityType,
    entity_id: entityId ?? null,
    description,
    metadata: metadata ?? null,
  });
  // Failures intentionally ignored — copy logging is best-effort
}
