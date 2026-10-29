"use client";

import React, { useState, useCallback, useTransition } from "react";
import { ActivityLog } from "@/components/types";
import { getActivityLogs } from "@/app/activity/actions";
import {
  Activity,
  CheckSquare,
  FolderGit2,
  Code2,
  GitBranch,
  GraduationCap,
  Settings,
  Bot,
  LogOut,
  Trash2,
  Copy,
  Plus,
  Pencil,
  RotateCcw,
  Search,
  X,
} from "@/components/icons";

// ---- icon map ---------------------------------------------------------------
function getActionIcon(action: string): React.ReactNode {
  const cls = "w-4 h-4";
  if (action.startsWith("task.")) return <CheckSquare className={cls} />;
  if (action.startsWith("project.")) return <FolderGit2 className={cls} />;
  if (action.startsWith("snippet.")) return <Code2 className={cls} />;
  if (action.startsWith("git_template.") || action.startsWith("git.")) return <GitBranch className={cls} />;
  if (action.startsWith("learning.")) return <GraduationCap className={cls} />;
  if (action.startsWith("settings.") || action.startsWith("profile.")) return <Settings className={cls} />;
  if (action.startsWith("auth.")) return <LogOut className={cls} />;
  if (action.startsWith("ai.")) return <Bot className={cls} />;
  if (action.includes("copied")) return <Copy className={cls} />;
  if (action.includes("deleted")) return <Trash2 className={cls} />;
  if (action.includes("created")) return <Plus className={cls} />;
  if (action.includes("updated")) return <Pencil className={cls} />;
  return <Activity className={cls} />;
}

function getEntityColor(entityType: string): string {
  switch (entityType) {
    case "task": return "text-violet-400 bg-violet-500/10 border-violet-500/20";
    case "project": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "snippet": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "git_template": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "learning": return "text-teal-400 bg-teal-500/10 border-teal-500/20";
    case "settings":
    case "profile": return "text-zinc-300 bg-zinc-500/10 border-zinc-500/20";
    case "auth": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    default: return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
  }
}

// ---- date grouping ----------------------------------------------------------
function groupByDate(logs: ActivityLog[]): { label: string; items: ActivityLog[] }[] {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayStr = new Date(now.getTime() - 86400000).toDateString();

  const groups: Record<string, ActivityLog[]> = {};
  for (const log of logs) {
    const d = new Date(log.created_at);
    const ds = d.toDateString();
    const label = ds === todayStr ? "Today" : ds === yesterdayStr ? "Yesterday" : d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    (groups[label] = groups[label] || []).push(log);
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// ---- entity type filter options ---------------------------------------------
const ENTITY_TYPES = [
  { value: "", label: "All" },
  { value: "task", label: "Tasks" },
  { value: "project", label: "Projects" },
  { value: "snippet", label: "Snippets" },
  { value: "git_template", label: "Git Toolkit" },
  { value: "learning", label: "Learning" },
  { value: "settings", label: "Settings" },
  { value: "auth", label: "Auth" },
];

// ---- main component ---------------------------------------------------------
interface ActivityLogViewProps {
  initialLogs: ActivityLog[];
  initialHasMore: boolean;
}

export function ActivityLogView({ initialLogs, initialHasMore }: ActivityLogViewProps) {
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const reload = useCallback(
    async (opts: { search: string; entityType: string; dateFrom: string; dateTo: string; page: number; reset: boolean }) => {
      const res = await getActivityLogs({
        page: opts.page,
        search: opts.search || undefined,
        entityType: opts.entityType || undefined,
        dateFrom: opts.dateFrom || undefined,
        dateTo: opts.dateTo || undefined,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setError(null);
      if (opts.reset) {
        setLogs(res.data);
      } else {
        setLogs((prev) => [...prev, ...res.data]);
      }
      setHasMore(res.hasMore);
    },
    []
  );

  const applyFilters = useCallback(
    (newSearch: string, newType: string, newFrom: string, newTo: string) => {
      setSearch(newSearch);
      setEntityType(newType);
      setDateFrom(newFrom);
      setDateTo(newTo);
      setPage(1);
      startTransition(() => {
        reload({ search: newSearch, entityType: newType, dateFrom: newFrom, dateTo: newTo, page: 1, reset: true });
      });
    },
    [reload]
  );

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    startTransition(() => {
      reload({ search, entityType, dateFrom, dateTo, page: next, reset: false });
    });
  };

  const clearFilters = () => applyFilters("", "", "", "");

  const groups = groupByDate(logs);
  const hasActiveFilters = search || entityType || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Activity Log
          </h2>
        </div>
        <p className="text-xs text-zinc-400 max-w-xl">
          DevOS automatically records your important actions — tasks, projects, snippets, git activity, learning progress, and more.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => applyFilters(e.target.value, entityType, dateFrom, dateTo)}
            placeholder="Search activities…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#121217] border border-white/8 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Entity type filter */}
        <select
          value={entityType}
          onChange={(e) => applyFilters(search, e.target.value, dateFrom, dateTo)}
          className="rounded-lg bg-[#121217] border border-white/8 text-xs text-zinc-200 px-2.5 py-2 focus:outline-none focus:border-violet-500/50"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => applyFilters(search, entityType, e.target.value, dateTo)}
          className="rounded-lg bg-[#121217] border border-white/8 text-xs text-zinc-200 px-2.5 py-2 focus:outline-none focus:border-violet-500/50"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => applyFilters(search, entityType, dateFrom, e.target.value)}
          className="rounded-lg bg-[#121217] border border-white/8 text-xs text-zinc-200 px-2.5 py-2 focus:outline-none focus:border-violet-500/50"
          title="To date"
        />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 border border-white/8 hover:bg-white/5 transition-colors"
            title="Clear filters"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {logs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Activity className="w-10 h-10 text-zinc-600 mb-4" />
          <p className="text-sm font-medium text-zinc-300">
            {hasActiveFilters ? "No activities match your filters" : "No activity recorded yet"}
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs">
            {hasActiveFilters
              ? "Try adjusting your search or filter criteria."
              : "Start creating tasks, projects, or snippets and your actions will appear here automatically."}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-4 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Grouped list */}
      {groups.length > 0 && (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 px-1">{label}</p>
              <div className="space-y-1.5">
                {items.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const colorCls = getEntityColor(log.entity_type);
                  return (
                    <div
                      key={log.id}
                      className="rounded-xl border border-white/5 bg-[#121217] hover:border-white/10 transition-colors"
                    >
                      <button
                        className="w-full flex items-start gap-3 px-4 py-3 text-left"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        aria-expanded={isExpanded}
                      >
                        {/* Icon */}
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border mt-0.5 ${colorCls}`}>
                          {getActionIcon(log.action)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-100 leading-snug">{log.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-zinc-500 font-mono">{formatTime(log.created_at)}</span>
                            {log.entity_type && (
                              <span className={`text-[10px] rounded border px-1.5 py-0.5 ${colorCls}`}>
                                {log.entity_type.replace("_", " ")}
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-600 font-mono">{log.action}</span>
                          </div>
                        </div>

                        {/* Expand indicator */}
                        {log.metadata && (
                          <RotateCcw className={`w-3.5 h-3.5 shrink-0 mt-1.5 text-zinc-600 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        )}
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-4 pb-3 ml-10 border-t border-white/5 pt-3">
                          <div className="rounded-lg bg-black/30 border border-white/5 p-3 space-y-1.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Details</p>
                            <DetailRow label="Action" value={log.action} />
                            {log.entity_type && <DetailRow label="Type" value={log.entity_type} />}
                            {log.entity_id && <DetailRow label="Resource ID" value={log.entity_id} mono />}
                            <DetailRow label="Time" value={new Date(log.created_at).toLocaleString()} />
                            {log.metadata && Object.entries(log.metadata).map(([k, v]) => (
                              <DetailRow key={k} label={k} value={String(v)} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-[#121217] text-xs text-zinc-300 hover:border-violet-500/40 hover:text-zinc-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className="text-zinc-500 w-24 shrink-0 capitalize">{label}</span>
      <span className={`text-zinc-200 break-all ${mono ? "font-mono text-[10px]" : ""}`}>{value}</span>
    </div>
  );
}
