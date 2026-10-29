"use client";

import React from "react";
import { Plus, Code2, GitBranch, Bot, Sparkles } from "./icons";

interface QuickActionsProps {
  onCreateTask: () => void;
  onSaveSnippet: () => void;
  onGenerateGitMessage: () => void;
  onOpenAIAssistant: () => void;
}

export function QuickActions({
  onCreateTask,
  onSaveSnippet,
  onGenerateGitMessage,
  onOpenAIAssistant,
}: QuickActionsProps) {
  const actions = [
    {
      title: "Create Task",
      description: "Log priority work & assign project",
      icon: Plus,
      onClick: onCreateTask,
      badge: "Fast",
      accent: "violet",
    },
    {
      title: "Save Code Snippet",
      description: "Store reusable utility or hook",
      icon: Code2,
      onClick: onSaveSnippet,
      badge: "Library",
      accent: "indigo",
    },
    {
      title: "Generate Git Message",
      description: "Conventional commit formatter",
      icon: GitBranch,
      onClick: onGenerateGitMessage,
      badge: "CLI",
      accent: "emerald",
    },
    {
      title: "Open AI Assistant",
      description: "Ask queries & refactor code",
      icon: Bot,
      onClick: onOpenAIAssistant,
      badge: "Prompt",
      accent: "amber",
    },
  ];

  return (
    <div className="rounded-xl border border-white/5 bg-[#121217] p-5">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Quick Actions
            <Sparkles className="w-4 h-4 text-violet-400" />
          </h2>
          <p className="text-xs text-zinc-500">Accelerate everyday developer workflows</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              onClick={act.onClick}
              className="group text-left rounded-lg border border-white/5 bg-white/[0.02] p-3.5 transition-all duration-150 hover:border-violet-500/40 hover:bg-white/[0.04] hover:-translate-y-0.5 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-white/5 text-violet-400 group-hover:bg-violet-600/15 group-hover:border-violet-500/30 group-hover:scale-105 transition-all">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 group-hover:text-violet-300">
                  {act.badge}
                </span>
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                  {act.title}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                  {act.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
