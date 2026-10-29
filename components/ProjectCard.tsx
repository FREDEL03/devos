"use client";

import React, { useState } from "react";
import {
  FolderGit2,
  Pencil,
  Trash2,
  Archive,
  Calendar,
  CheckSquare,
} from "./icons";
import { Project, ProjectStatus } from "./types";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({
  project,
  onEdit,
  onArchive,
  onDelete,
}: ProjectCardProps) {
  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case "Planning":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "In Progress":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Review":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Archived":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const stack =
    project.technology_stack ||
    project.technologies ||
    project.technology ||
    [];

  const hasTasks = typeof project.tasks_count === "number" && project.tasks_count > 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-[#121217] p-5 transition-all duration-150 hover:border-violet-500/30 hover:bg-[#16161d]">
      <div>
        {/* Top row: Icon, Name, Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-colors">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                {project.name}
              </h3>
              {/* Task count metadata */}
              {hasTasks ? (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                  <CheckSquare className="w-3 h-3 text-violet-400" />
                  <span>
                    {project.completed_tasks_count} / {project.tasks_count} tasks completed
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500 mt-0.5">No tasks assigned</p>
              )}
            </div>
          </div>

          <span
            className={`rounded border px-2 py-0.5 text-[10px] font-medium shrink-0 ${getStatusBadge(
              project.status
            )}`}
          >
            {project.status}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="mt-3 text-xs text-zinc-400 leading-relaxed line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Tech stack badges */}
        {stack.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {stack.map((tech) => (
              <span
                key={tech}
                className="rounded bg-black/40 border border-white/5 px-2 py-0.5 text-[11px] font-mono text-zinc-400"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Timeline Dates */}
        {(project.start_date || project.target_date) && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {project.start_date ? project.start_date : "Started"} →{" "}
              {project.target_date ? project.target_date : "Ongoing"}
            </span>
          </div>
        )}
      </div>

      {/* Bottom section: Progress Bar & Actions */}
      <div className="mt-4 pt-3.5 border-t border-white/5 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="text-[11px] text-zinc-500">
              {hasTasks ? "Task Completion" : "Estimated Progress"}
            </span>
            <span className="font-mono text-[11px] text-zinc-300 font-medium">
              {project.progress}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                project.status === "Completed"
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-violet-600 to-indigo-500"
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-end gap-1 text-xs">
          <button
            onClick={() => onEdit(project)}
            className="flex items-center gap-1 rounded px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
            title="Edit project"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          {project.status !== "Archived" && (
            <button
              onClick={() => onArchive(project.id)}
              className="flex items-center gap-1 rounded px-2 py-1 text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
              title="Archive project"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
          )}

          <button
            onClick={() => onDelete(project.id)}
            className="flex items-center gap-1 rounded px-2 py-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
