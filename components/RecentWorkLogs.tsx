import React from "react";
import { WorkLog } from "./types";
import { Calendar, Clock, FolderGit2 } from "./icons";

const MAX_VISIBLE = 5;

export function RecentWorkLogs({ logs }: { logs: WorkLog[] }) {
  const recent = [...logs]
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
    .slice(0, MAX_VISIBLE);

  return (
    <div className="rounded-xl border border-white/5 bg-[#121217] p-5">
      <div className="pb-4 border-b border-white/5">
        <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
          Recent Work Logs
          <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs text-violet-400 font-mono">
            {logs.length}
          </span>
        </h2>
        <p className="text-xs text-zinc-500">What you shipped lately</p>
      </div>

      {recent.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No work logs yet.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {recent.map((log) => (
            <li
              key={log.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-3.5"
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1 text-violet-300">
                  <Calendar className="w-3 h-3" />
                  {log.entry_date}
                </span>
                {log.project && (
                  <span className="flex items-center gap-1 text-blue-300">
                    <FolderGit2 className="w-3 h-3" />
                    {log.project.name}
                  </span>
                )}
                {log.duration_minutes ? (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.duration_minutes} min
                  </span>
                ) : null}
              </div>
              <h3 className="mt-1.5 text-sm font-medium text-zinc-200">{log.title}</h3>
              <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{log.work_summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
