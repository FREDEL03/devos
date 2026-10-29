"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  FolderGit2,
  Pencil,
  Trash2,
  AlertCircle,
  Sparkles,
  Check,
} from "./icons";
import { WorkLog } from "./types";

interface WorkLogCardProps {
  log: WorkLog;
  onEdit: (log: WorkLog) => void;
  onDelete: (id: string) => Promise<void>;
}

export function WorkLogCard({ log, onEdit, onDelete }: WorkLogCardProps) {
  // Format date readable
  let displayDate = log.entry_date;
  try {
    const parts = log.entry_date.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      displayDate = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  } catch {
    displayDate = log.entry_date;
  }

  return (
    <div className="rounded-xl border border-white/5 bg-[#121217] p-4 sm:p-5 transition-all hover:border-white/10 group">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-white/5">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[11px] font-mono text-violet-300">
              <Calendar className="w-3 h-3 text-violet-400" />
              {displayDate}
            </span>

            {log.project && (
              <span className="flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[11px] font-mono text-blue-300">
                <FolderGit2 className="w-3 h-3 text-blue-400" />
                {log.project.name}
              </span>
            )}

            {log.duration_minutes ? (
              <span className="flex items-center gap-1 rounded-md bg-zinc-800 border border-white/5 px-2 py-0.5 text-[11px] font-mono text-zinc-400">
                <Clock className="w-3 h-3 text-zinc-400" />
                {log.duration_minutes} min
              </span>
            ) : null}
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight pt-1">
            {log.title}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onEdit(log)}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
            title="Edit log"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(log.id)}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body: Completed Work */}
      <div className="mt-3.5 space-y-3 text-xs leading-relaxed">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block mb-1">
            Completed Work
          </span>
          <p className="text-zinc-200 whitespace-pre-wrap">{log.work_summary}</p>
        </div>

        {/* Challenges & Blockers Callout */}
        {log.challenges && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1">
            <span className="text-[11px] font-medium text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Blockers & Technical Challenges
            </span>
            <p className="text-zinc-300 whitespace-pre-wrap pl-5">{log.challenges}</p>
          </div>
        )}

        {/* Lessons Learned Callout */}
        {log.lessons_learned && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
            <span className="text-[11px] font-medium text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Lessons Learned & Engineering Takeaways
            </span>
            <p className="text-zinc-300 whitespace-pre-wrap pl-5">{log.lessons_learned}</p>
          </div>
        )}
      </div>
    </div>
  );
}
