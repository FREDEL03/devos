"use client";

import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  Copy,
  Check,
  Send,
  X,
  Code2,
  Terminal,
  AlertCircle,
  RotateCcw,
} from "./icons";
import { AITaskType, SUPPORTED_TASK_TYPES } from "@/lib/ai/gemini";
import { toast } from "./Toast";
import { confirmDialog } from "./ConfirmDialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  taskType: AITaskType;
  prompt: string;
  contextCode?: string;
  content: string;
  model?: string;
  timestamp: string;
}

const QUICK_PROMPTS: Record<AITaskType, { label: string; prompt: string; code?: string }[]> = {
  explain_error: [
    {
      label: "TypeError: undefined is not a function",
      prompt: "Why am I getting this TypeError when calling a function on an object?",
      code: "const data = await res.json();\ndata.users.map(u => u.name); // TypeError: Cannot read properties of undefined (reading 'map')",
    },
    {
      label: "PostgreSQL: relation does not exist",
      prompt: "How do I resolve relation does not exist error in Supabase / PostgreSQL?",
      code: "ERROR: 42P01: relation \"tasks\" does not exist\nLINE 1: SELECT * FROM tasks",
    },
  ],
  explain_code: [
    {
      label: "React Debounce Hook",
      prompt: "Explain how this custom React debounce hook works, its lifecycle, and edge cases.",
      code: "export function useDebounce<T>(value: T, delay = 300): T {\n  const [debounced, setDebounced] = React.useState(value);\n  React.useEffect(() => {\n    const handler = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debounced;\n}",
    },
    {
      label: "Exponential Backoff",
      prompt: "Analyze this exponential backoff retry implementation for potential issues.",
      code: "async function fetchRetry(url, retries = 3, delay = 1000) {\n  try {\n    return await fetch(url);\n  } catch (err) {\n    if (retries <= 1) throw err;\n    await new Promise(r => setTimeout(r, delay));\n    return fetchRetry(url, retries - 1, delay * 2);\n  }\n}",
    },
  ],
  debug_steps: [
    {
      label: "CORS Issue in Next.js",
      prompt: "Provide step-by-step diagnostic steps to troubleshoot a CORS preflight failure between Next.js frontend and an external API.",
    },
    {
      label: "Supabase Session Token Refresh Loop",
      prompt: "Give me debugging steps to trace an infinite authentication redirect loop in Next.js middleware.",
    },
  ],
  explain_concept: [
    {
      label: "PostgreSQL Row Level Security (RLS)",
      prompt: "Explain PostgreSQL Row Level Security (RLS), how auth.uid() works, and performance implications on large tables.",
    },
    {
      label: "React 19 Server Actions vs API Routes",
      prompt: "When should I use React Server Actions instead of Next.js Route Handlers in App Router?",
    },
  ],
  improve_git: [
    {
      label: "Format Commit Message",
      prompt: "Improve this into a clean Conventional Commit message and branch name: 'fixed bug where user could submit form twice while saving'",
    },
  ],
  generate_pr: [
    {
      label: "Auth Token Rotation PR",
      prompt: "Generate a structured PR description for adding token rotation in Next.js Edge middleware with unit tests and cookie encryption.",
    },
  ],
  general_query: [
    {
      label: "Best Practice for Tailwind v4 tokens",
      prompt: "What is the recommended method to declare custom CSS color tokens in Tailwind CSS v4 with CSS variables?",
    },
  ],
};

export function AIAssistant() {
  const [taskType, setTaskType] = useState<AITaskType>("explain_error");
  const [prompt, setPrompt] = useState("");
  const [contextCode, setContextCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard", { description: "AI response copied." });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy", { description: "Clipboard permission denied." });
      console.error("Copy failed:", err);
    }
  };

  const handleClearSession = async () => {
    const confirmed = await confirmDialog({
      title: "Clear AI session history?",
      description: "All messages in this session will be cleared.",
      confirmText: "Clear History",
      cancelText: "Keep",
      variant: "warning",
    });
    if (confirmed) {
      setMessages([]);
      toast.info("Session cleared");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;

    const userPrompt = prompt.trim();
    const userCode = contextCode.trim() || undefined;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      taskType,
      prompt: userPrompt,
      contextCode: userCode,
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType,
          prompt: userPrompt,
          contextCode: userCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to get response`);
      }

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        taskType,
        prompt: userPrompt,
        content: data.content,
        model: data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to communicate with AI Assistant.";
      setError(msg);
      toast.error("AI Assistant Error", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyQuickPrompt = (qp: { prompt: string; code?: string }) => {
    setPrompt(qp.prompt);
    if (qp.code) {
      setContextCode(qp.code);
      setShowCodeInput(true);
    }
  };

  const activeTaskObj = SUPPORTED_TASK_TYPES.find((t) => t.type === taskType);
  const currentQuickPrompts = QUICK_PROMPTS[taskType] || [];
  const charCount = (prompt + contextCode).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>DevOS AI Assistant</span>
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs text-violet-400 font-mono">
              Powered by Google Gemini
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Error diagnostics, code breakdown, debugging roadmaps, and Conventional Git generation
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearSession}
            className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Session</span>
          </button>
        )}
      </div>

      {/* Task Mode Selector */}
      <div className="rounded-xl border border-white/5 bg-[#121217] p-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {SUPPORTED_TASK_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => {
                setTaskType(t.type);
                if (t.type === "explain_code" || t.type === "explain_error") {
                  setShowCodeInput(true);
                }
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                taskType === t.type
                  ? "bg-violet-600/25 border border-violet-500/40 text-violet-200 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeTaskObj && (
          <p className="mt-2 text-[11px] text-zinc-500 px-1 font-mono">
            Mode: {activeTaskObj.description}
          </p>
        )}
      </div>

      {/* Quick Prompt Suggestions */}
      {currentQuickPrompts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-violet-400" />
            Templates:
          </span>
          {currentQuickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyQuickPrompt(qp)}
              className="rounded-lg bg-zinc-900/80 border border-white/5 px-2.5 py-1 text-xs text-zinc-300 hover:border-violet-500/30 hover:text-violet-300 hover:bg-zinc-800 transition-all text-left truncate max-w-xs"
            >
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>AI Request Failed</span>
          </div>
          <p className="pl-6 text-zinc-300">{error}</p>
          {error.includes("GEMINI_API_KEY") && (
            <div className="pl-6 pt-1 text-[11px] text-rose-300/80 font-mono">
              Tip: Set <span className="bg-black/40 px-1 py-0.5 rounded text-white">GEMINI_API_KEY=your_key</span> in <span className="underline">.env.local</span> and restart next dev.
            </div>
          )}
        </div>
      )}

      {/* Messages Thread */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl border p-4 sm:p-5 transition-all ${
              msg.role === "user"
                ? "bg-zinc-900/60 border-white/10"
                : "bg-[#121217] border-white/5"
            }`}
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <div
                  className={`h-6 w-6 rounded-md flex items-center justify-center ${
                    msg.role === "user"
                      ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                      : "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {msg.role === "user" ? "You" : <Bot className="w-3.5 h-3.5" />}
                </div>
                <span className="font-semibold text-zinc-200">
                  {msg.role === "user" ? "Your Inquiry" : "Gemini Engineering Assistant"}
                </span>
                {msg.model && (
                  <span className="rounded bg-black/40 border border-white/5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                    {msg.model}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-500">{msg.timestamp}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(msg.content, msg.id)}
                  className="flex items-center gap-1 rounded border border-white/10 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300 hover:text-white hover:border-violet-500/30 transition-colors"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Context code if user provided any */}
            {msg.role === "user" && msg.contextCode && (
              <div className="mt-3 rounded-lg border border-white/5 bg-black/60 p-3 overflow-x-auto text-xs font-mono text-zinc-300">
                <pre>{msg.contextCode}</pre>
              </div>
            )}

            {/* Content Body */}
            <div className="mt-3 text-xs text-zinc-200 leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-600/5 p-4 text-xs text-violet-300 animate-pulse">
            <div className="h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
            <div className="space-y-0.5">
              <span className="font-semibold">Gemini is reasoning and compiling resolution...</span>
              <p className="text-[11px] text-zinc-500">Analyzing syntax trees, confirmed error causes, and engineering trade-offs</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Composer Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-white/5 bg-[#121217] p-4 sm:p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Prompt / Question <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 font-mono"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showCodeInput ? "Hide Code Input" : "Attach Code / Log"}</span>
            </button>
          </div>
          <textarea
            rows={3}
            required
            placeholder="e.g. Why is this PostgreSQL query failing, and how do I optimize the index?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full rounded-lg bg-zinc-900 border border-white/10 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-all leading-relaxed"
          />
        </div>

        {showCodeInput && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Code Snippet / Error Stack Trace (optional)
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">Monospace editor</span>
            </div>
            <textarea
              rows={5}
              placeholder="Paste stack trace, function, query, or configuration..."
              value={contextCode}
              onChange={(e) => setContextCode(e.target.value)}
              className="w-full font-mono text-xs rounded-lg bg-black/60 border border-white/10 p-3 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500 leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
            <span>{charCount} / 8000 characters</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Gemini</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Safety Disclaimer Banner */}
      <div className="rounded-lg bg-black/40 border border-white/5 p-3 text-[11px] text-zinc-500 flex items-start gap-2 leading-relaxed">
        <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-zinc-400 font-medium">Engineering Notice:</strong> AI responses are generated using Google Gemini. Suggestions, code snippets, and error resolutions should be verified, linted, and tested against local test suites before committing to production.
        </p>
      </div>
    </div>
  );
}
