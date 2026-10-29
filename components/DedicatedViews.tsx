"use client";

import React, { useState } from "react";
import { NavTab, Task, Project, CodeSnippet } from "./types";
import {
  Code2,
  GitBranch,
  Bot,
  Clock,
  GraduationCap,
  Settings,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Plus,
} from "./icons";

interface DedicatedViewsProps {
  activeTab: NavTab;
  tasks: Task[];
  projects: Project[];
  snippets: CodeSnippet[];
  onOpenNewTask: () => void;
  onOpenSnippetModal: () => void;
  onOpenGitModal: () => void;
}

export function DedicatedViews({
  activeTab,
  tasks,
  projects,
  snippets,
  onOpenNewTask,
  onOpenSnippetModal,
  onOpenGitModal,
}: DedicatedViewsProps) {
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponses, setAiResponses] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([
    {
      role: "assistant",
      text: "Hello Mark! DevOS AI assistant ready. Ask for regex generation, TypeScript types, query optimization, or architecture reviews.",
    },
  ]);

  const handleCopySnippet = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleSendAiPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userText = aiPrompt.trim();
    setAiResponses((prev) => [
      ...prev,
      { role: "user", text: userText },
      {
        role: "assistant",
        text: `Analysis for "${userText}": Use Next.js React Server Components with streaming boundary (<Suspense>) for optimal Time to First Byte. Keep database connections inside a connection pool.`,
      },
    ]);
    setAiPrompt("");
  };

  if (activeTab === "Code Snippets") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Saved Code Snippets</h2>
            <p className="text-xs text-zinc-500">
              Reusable code templates, hooks, and helpers
            </p>
          </div>
          <button
            onClick={onOpenSnippetModal}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Snippet
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {snippets.map((snip) => (
            <div
              key={snip.id}
              className="rounded-xl border border-white/5 bg-[#121217] p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 text-[11px] font-mono uppercase">
                      {snip.language}
                    </span>
                    <h3 className="text-sm font-semibold text-zinc-200">
                      {snip.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleCopySnippet(snip.id, snip.code)}
                    className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/5"
                    title="Copy code"
                  >
                    {copiedSnippetId === snip.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-black/50 p-3 font-mono text-xs text-zinc-300 border border-white/5 max-h-48">
                  <code>{snip.code}</code>
                </pre>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                {(snip.tags || []).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "Git Toolkit") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Git Toolkit</h2>
            <p className="text-xs text-zinc-500">
              Interactive commit builder and quick git aliases
            </p>
          </div>
          <button
            onClick={onOpenGitModal}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Open Commit Builder
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/5 bg-[#121217] p-5">
            <h3 className="text-sm font-semibold text-white mb-2">
              Essential Branch Commands
            </h3>
            <div className="space-y-2 text-xs font-mono">
              {[
                { cmd: "git checkout -b feature/auth-guard", desc: "Create branch" },
                { cmd: "git fetch origin && git rebase origin/main", desc: "Sync branch" },
                { cmd: "git log --oneline -n 5", desc: "Recent commits" },
                { cmd: "git diff --stat origin/main", desc: "Inspect diff" },
              ].map((c) => (
                <div
                  key={c.cmd}
                  className="flex items-center justify-between rounded bg-black/40 border border-white/5 p-2.5"
                >
                  <span className="text-violet-300">{c.cmd}</span>
                  <span className="text-[11px] text-zinc-500 font-sans">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#121217] p-5">
            <h3 className="text-sm font-semibold text-white mb-2">
              Active Repositories Status
            </h3>
            <div className="space-y-2.5 text-xs">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded bg-black/40 border border-white/5 p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-medium text-zinc-200">{p.name}</span>
                  </div>
                  <span className="font-mono text-zinc-400 text-[11px]">
                    branch: master
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "AI Assistant") {
    return (
      <div className="rounded-xl border border-white/5 bg-[#121217] p-5 flex flex-col h-[650px]">
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <div className="h-8 w-8 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">DevOS AI Copilot</h2>
            <p className="text-xs text-zinc-500">Pair programming & debugging workspace</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
          {aiResponses.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-lg bg-violet-600/30 border border-violet-500/30 flex items-center justify-center shrink-0 text-violet-300">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-xl rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-white/[0.04] border border-white/5 text-zinc-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendAiPrompt} className="pt-3 border-t border-white/5 flex gap-2">
          <input
            type="text"
            placeholder="Ask AI Copilot for syntax, refactoring, or tests..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="flex-1 rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500"
          >
            Send
          </button>
        </form>
      </div>
    );
  }

  if (activeTab === "Work Logs") {
    return (
      <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Daily Engineering Logs</h2>
          <p className="text-xs text-zinc-500">Track focus sessions, PRs merged, and standup notes</p>
        </div>
        <div className="space-y-3 text-xs">
          {[
            { time: "09:30 AM", event: "Merged PR #42: Dark theme palette and tokens", cat: "GitHub" },
            { time: "11:15 AM", event: "Profiling memory footprint in Go gateway proxy", cat: "Perf" },
            { time: "02:00 PM", event: "Sprint roadmap review with engineering leads", cat: "Meeting" },
            { time: "04:45 PM", event: "Configured zero-downtime database rollout scripts", cat: "Infra" },
          ].map((log) => (
            <div
              key={log.time}
              className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-violet-400">{log.time}</span>
                <span className="text-zinc-200">{log.event}</span>
              </div>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                {log.cat}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "Learning Tracker") {
    return (
      <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Learning & Tech Radar</h2>
          <p className="text-xs text-zinc-500">Topics, research whitepapers, and skill progressions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { topic: "Rust Tokio & Async I/O", progress: 65, level: "Advanced" },
            { topic: "Distributed Consensus (Raft)", progress: 40, level: "Intermediate" },
            { topic: "WebAssembly SIMD Intrinsics", progress: 25, level: "Exploratory" },
          ].map((item) => (
            <div
              key={item.topic}
              className="rounded-lg bg-white/[0.02] border border-white/5 p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{item.topic}</span>
                <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">
                  {item.level}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Mastery</span>
                <span className="font-mono">{item.progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "Settings") {
    return (
      <div className="rounded-xl border border-white/5 bg-[#121217] p-5 space-y-4 max-w-2xl">
        <div>
          <h2 className="text-base font-semibold text-white">Workspace Settings</h2>
          <p className="text-xs text-zinc-500">Configure theme, keyboard shortcuts, and local storage</p>
        </div>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="font-medium text-zinc-200">Theme Preference</p>
              <p className="text-[11px] text-zinc-500">Dark violet SaaS aesthetic</p>
            </div>
            <span className="rounded bg-violet-600/20 border border-violet-500/30 px-2 py-1 text-violet-300 font-mono">
              Dark Mode (Active)
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="font-medium text-zinc-200">Database Connection</p>
              <p className="text-[11px] text-zinc-500">Mock Data / In-memory state</p>
            </div>
            <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-1 text-amber-300 font-mono">
              Offline Mock Mode
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
