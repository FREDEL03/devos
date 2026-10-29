"use server";

import { createClient } from "@/lib/supabase/server";

export interface LogActivityInput {
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Server-side activity logger. User identity is always derived from the
 * authenticated session — never from client-supplied input.
 *
 * Failures are swallowed so logging never blocks or breaks business operations.
 * Sensitive values (passwords, tokens, API keys) must never appear in metadata.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return; // not authenticated — skip silently

    const { error } = await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: input.action,
      entity_type: input.entityType ?? "",
      entity_id: input.entityId ?? null,
      description: input.description,
      metadata: input.metadata ?? null,
    });

    if (error) {
      // Log to server console for diagnostics but don't surface to caller
      console.warn("[activity] Failed to log activity:", error.message);
    }
  } catch (err) {
    console.warn("[activity] Unexpected error logging activity:", err);
  }
}
