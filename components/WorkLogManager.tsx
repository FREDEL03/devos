"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  FolderGit2,
  Plus,
  Search,
  Filter,
  X,
  Sparkles,
} from "./icons";
import { WorkLog, Project } from "./types";
import { WorkLogCard } from "./WorkLogCard";
import { WorkLogModal } from "./WorkLogModal";
import {
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
  WorkLogInput,
} from "@/app/work-logs/actions";

interface WorkLogManagerProps {
  initialLogs: WorkLog[];
  projects: Project[];
}

export function WorkLogManager({ initialLogs, projects }: WorkLogManagerProps) {
  const [logs, setLogs] = useState<WorkLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = log.title.toLowerCase().includes(query);
        const matchesSummary = log.work_summary.toLowerCase().includes(query);
        const matchesChallenges = log.challenges?.toLowerCase().includes(query) ?? false;
        const matchesLessons = log.lessons_learned?.toLowerCase().includes(query) ?? false;
        const matchesProject = log.project?.name.toLowerCase().includes(query) ?? false;
        if (!matchesTitle && !matchesSummary && !matchesChallenges && !matchesLessons && !matchesProject) {
          return false;
        }
      }

      // 2. Project filter
      if (selectedProjectId !== "all") {
        if (selectedProjectId === "none") {
          if (log.project_id) return false;
        } else {
          if (log.project_id !== selectedProjectId) return false;
        }
      }

      // 3. Date filter
      if (selectedDate) {
        if (log.entry_date !== selectedDate) return false;
      }

      return true;
    });
  }, [logs, searchQuery, selectedProjectId, selectedDate]);

  // Statistics
  const totalLoggedMinutes = useMemo(() => {
    return logs.reduce((acc, log) => acc + (log.duration_minutes || 0), 0);
  }, [logs]);

  const totalHours = (totalLoggedMinutes / 60).toFixed(1);

  const todayStr = new Date().toISOString().split("T")[0];
  const hasLoggedToday = logs.some((l) => l.entry_date === todayStr);

  const handleCreateOrUpdate = async (input: WorkLogInput, id?: string) => {
    if (id) {
      // Edit
      const res = await updateWorkLog(id, input);
      if (res.error || !res.data) {
        return { success: false, error: res.error || "Failed to update log" };
      }
      setLogs((prev) => prev.map((item) => (item.id === id ? res.data! : item)));
      return { success: true };
    } else {
      // Create
      const res = await createWorkLog(input);
      if (res.error || !res.data) {
        return { success: false, error: res.error || "Failed to create log" };
      }
      setLogs((prev) => [res.data!, ...prev]);
      return { success: true };
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteWorkLog(id);
    if (res.success) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } else {
      alert(res.error || "Failed to delete log");
    }
  };

  const handleOpenEdit = (log: WorkLog) => {
    setEditingLog(log);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingLog(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Daily Work Logs</span>
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs text-violet-400 font-mono">
              {logs.length} {logs.length === 1 ? "Entry" : "Entries"}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Document deliverables, unblock blockers, and preserve engineering discoveries
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Daily Log</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/5 bg-[#121217] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Logged Entries</span>
            <span className="text-xl font-bold text-white mt-1 block">{logs.length}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121217] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Focus Time</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {totalHours} <span className="text-xs font-normal text-zinc-400">hours</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#121217] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Today&apos;s Status</span>
            <span
              className={`text-xs font-medium mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                hasLoggedToday
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
              }`}
            >
              {hasLoggedToday ? "✓ Logged Today" : "Pending Log Today"}
            </span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-white/5 bg-[#121217] p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs by keyword, tasks, blockers, or insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
              <FolderGit2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Project:</span>
            </div>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-lg bg-zinc-900 border border-white/10 px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
            >
              <option value="all">All Projects</option>
              <option value="none">No Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Date:</span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg bg-zinc-900 border border-white/10 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="text-[11px] text-zinc-400 hover:text-violet-300 font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {(searchQuery || selectedProjectId !== "all" || selectedDate) && (
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-white/5 font-mono">
            <span>
              Showing {filteredLogs.length} of {logs.length} logs
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedProjectId("all");
                setSelectedDate("");
              }}
              className="text-violet-400 hover:text-violet-300 underline text-[11px]"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <WorkLogCard
              key={log.id}
              log={log}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="rounded-xl border border-white/5 bg-[#121217] p-8 sm:p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">
              {logs.length === 0 ? "No Daily Work Logs Yet" : "No Matching Logs Found"}
            </h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              {logs.length === 0
                ? "Record daily completed features, blockers, and architecture insights to keep an auditable engineering diary."
                : "Try adjusting your search query, project filter, or date range to find past entries."}
            </p>
            {logs.length === 0 && (
              <button
                type="button"
                onClick={handleOpenNew}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-violet-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Daily Log</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Work Log Modal */}
      <WorkLogModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLog(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingLog}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
