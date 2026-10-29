"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Calendar,
  Pencil,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "./icons";
import { LearningEntry } from "./types";

interface LearningCardProps {
  entry: LearningEntry;
  onEdit: (entry: LearningEntry) => void;
  onDelete: (id: string) => Promise<void>;
  onQuickToggleComplete: (entry: LearningEntry) => Promise<void>;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Laravel: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  "Next.js": { bg: "bg-zinc-800", text: "text-zinc-200", border: "border-white/10" },
  React: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  TypeScript: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  SQL: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  "AI Integration": { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  "Software Engineering": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  DevOps: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Completed: { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/30" },
  "In Progress": { bg: "bg-indigo-500/15", text: "text-indigo-300", border: "border-indigo-500/30" },
  Reviewing: { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/30" },
  "To Learn": { bg: "bg-zinc-800", text: "text-zinc-400", border: "border-white/5" },
};

export function LearningCard({
  entry,
  onEdit,
  onDelete,
  onQuickToggleComplete,
}: LearningCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const catStyle = CATEGORY_COLORS[entry.category] || {
    bg: "bg-zinc-800",
    text: "text-zinc-300",
    border: "border-white/5",
  };

  const statusStyle = STATUS_CONFIG[entry.status] || STATUS_CONFIG["In Progress"];
  const mastery = entry.mastery_percentage ?? 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#121217] p-4 sm:p-5 flex flex-col justify-between hover:border-white/10 transition-all group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-mono border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
            >
              {entry.category}
            </span>

            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {entry.status}
            </span>

            {entry.level && (
              <span className="rounded bg-black/40 border border-white/5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                {entry.level}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {showConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg p-1">
                <span className="text-[11px] text-rose-300 font-medium">Delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded bg-rose-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {isDeleting ? "..." : "Yes"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded px-1.5 py-0.5 text-[11px] text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onQuickToggleComplete(entry)}
                  className={`rounded-lg p-1.5 transition-colors ${
                    entry.status === "Completed"
                      ? "text-emerald-400 hover:bg-emerald-500/10"
                      : "text-zinc-500 hover:text-emerald-400 hover:bg-white/5"
                  }`}
                  title={entry.status === "Completed" ? "Mark as In Progress" : "Mark as Completed"}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                  title="Edit topic"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete topic"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title and Description */}
        <div className="mt-3">
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
            {entry.title}
          </h3>
          {entry.description && (
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed line-clamp-2">
              {entry.description}
            </p>
          )}
        </div>

        {/* Target Date */}
        {entry.target_date && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span>Target: {entry.target_date}</span>
          </div>
        )}

        {/* Mastery Progress */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500">Mastery Progress</span>
            <span className="text-indigo-400 font-semibold">{mastery}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                entry.status === "Completed" ? "bg-emerald-500" : "bg-indigo-500"
              }`}
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>

        {/* Notes & Resources Dropdown */}
        {entry.notes && (
          <div className="mt-3 pt-2.5 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center justify-between w-full text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors font-mono"
            >
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Resources & Notes
              </span>
              {showNotes ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showNotes && (
              <div className="mt-2 rounded-lg bg-black/50 border border-white/5 p-2.5 text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {entry.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
