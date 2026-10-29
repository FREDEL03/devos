import React from "react";
import { Project } from "./types";
import { FolderGit2, ArrowUpRight } from "./icons";

interface RecentProjectsProps {
  projects: Project[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "Planning":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "In Progress":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "Completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Review":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Archived":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#121217] p-5">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Recent Projects
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs text-violet-400 font-mono">
              {projects.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-500">Active repositories and shipping roadmap</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 mb-2">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No projects yet</p>
          <p className="text-xs text-zinc-600 mt-1 max-w-xs">
            Create your first project in the Project Tracker to start tracking repositories and tasks.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-all duration-150 hover:border-violet-500/30 hover:bg-white/[0.04]"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-colors">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        {project.name}
                      </h3>
                    </div>
                  </div>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${getStatusBadge(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {project.description}
                </p>

                {/* Technology badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(project.technology_stack || project.technologies || project.technology || []).map((tech) => (
                    <span
                      key={tech}
                      className="rounded bg-black/40 border border-white/5 px-2 py-0.5 text-[11px] font-mono text-zinc-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                  <span className="text-[11px] text-zinc-500">Progress</span>
                  <span className="font-mono text-[11px] text-zinc-300 font-medium">
                    {project.progress}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
