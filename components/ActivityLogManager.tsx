"use client";

import React, { useState, useEffect } from "react";
import { ActivityLog } from "@/components/types";
import { getActivityLogs } from "@/app/activity/actions";
import { ActivityLogView } from "@/components/ActivityLogView";
import { Activity } from "@/components/icons";

/**
 * Self-contained wrapper for the SPA dashboard mode.
 * Fetches initial data client-side since we don't have SSR props here.
 */
export function ActivityLogManager() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActivityLogs({ page: 1 }).then((res) => {
      if (res.error) {
        setError(res.error);
      } else {
        setLogs(res.data);
        setHasMore(res.hasMore);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Activity className="w-8 h-8 text-zinc-600 animate-pulse mb-3" />
        <p className="text-xs text-zinc-500">Loading activity log…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
        {error}
      </div>
    );
  }

  return <ActivityLogView initialLogs={logs} initialHasMore={hasMore} />;
}
