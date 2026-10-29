import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: "violet" | "emerald" | "amber" | "indigo";
}

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  accentColor = "violet",
}: StatCardProps) {
  const accentStyles = {
    violet: {
      border: "hover:border-violet-500/40",
      iconBg: "bg-violet-600/10 text-violet-400 border-violet-500/20",
      glow: "group-hover:bg-violet-600/5",
    },
    emerald: {
      border: "hover:border-emerald-500/40",
      iconBg: "bg-emerald-600/10 text-emerald-400 border-emerald-500/20",
      glow: "group-hover:bg-emerald-600/5",
    },
    amber: {
      border: "hover:border-amber-500/40",
      iconBg: "bg-amber-600/10 text-amber-400 border-amber-500/20",
      glow: "group-hover:bg-amber-600/5",
    },
    indigo: {
      border: "hover:border-indigo-500/40",
      iconBg: "bg-indigo-600/10 text-indigo-400 border-indigo-500/20",
      glow: "group-hover:bg-indigo-600/5",
    },
  }[accentColor];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-white/5 bg-[#121217] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 ${accentStyles.border}`}
    >
      <div className={`pointer-events-none absolute inset-0 transition-colors ${accentStyles.glow}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {value}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{subtext}</p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${accentStyles.iconBg} transition-transform group-hover:scale-105`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
