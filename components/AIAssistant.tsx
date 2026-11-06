"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Sparkles, Copy, Check, Send, Code2, AlertCircle, RotateCcw } from "./icons";
import { AITaskType, SUPPORTED_TASK_TYPES } from "@/lib/ai/gemini";
import { toast } from "./Toast";
import { confirmDialog } from "./ConfirmDialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  contextCode?: string;
  model?: string;
  timestamp: string;
}

const STARTERS: { label: string; type: AITaskType; prompt: string }[] = [
  { label: "Explain an error", type: "explain_error", prompt: "Help me understand this error: " },
  { label: "Explain code", type: "explain_code", prompt: "Explain what this code does: " },
  { label: "Debug a problem", type: "debug_steps", prompt: "Give me debugging steps for: " },
  { label: "Write a commit message", type: "improve_git", prompt: "Improve this into a Conventional Commit: " },
];

// Mode chips: everything except screenshot analysis (that lives in Tasks).
const MODES = SUPPORTED_TASK_TYPES.filter((t) => t.type !== "analyze_screenshot");

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Render text, turning ```fenced``` blocks into code boxes. */
function MessageBody({ text }: { text: string }) {
  return (
    <>
      {text.split(/```/).map((part, i) =>
        i % 2 === 1 ? (
          <pre
            key={i}
            className="my-2 overflow-x-auto rounded-lg border border-white/5 bg-black/60 p-3 font-mono text-xs text-zinc-200"
          >
            {part.replace(/^\w*\n/, "")}
          </pre>
        ) : (
          <span key={i} className="whitespace-pre-wrap">
            {part}
          </span>
        )
      )}
    </>
  );
}

export function AIAssistant() {
  const [taskType, setTaskType] = useState<AITaskType>("general_query");
  const [prompt, setPrompt] = useState("");
  const [contextCode, setContextCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy", { description: "Clipboard permission denied." });
    }
  };

  const handleClear = async () => {
    const confirmed = await confirmDialog({
      title: "Clear conversation?",
      description: "All messages in this chat will be removed.",
      confirmText: "Clear",
      cancelText: "Keep",
      variant: "warning",
    });
    if (confirmed) {
      setMessages([]);
      setError(null);
    }
  };

  const send = async (text = prompt, type = taskType) => {
    const userPrompt = text.trim();
    if (!userPrompt || loading) return;
    const userCode = contextCode.trim() || undefined;

    // Prior turns as Gemini history (code attachments folded into the text).
    const history = messages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      text: m.contextCode ? `${m.content}\n\n\`\`\`\n${m.contextCode}\n\`\`\`` : m.content,
    }));

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: userPrompt, contextCode: userCode, timestamp: now() },
    ]);
    setPrompt("");
    setContextCode("");
    setShowCodeInput(false);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType: type, prompt: userPrompt, contextCode: userCode, history }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}: Failed to get response`);

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: data.content, model: data.model, timestamp: now() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to communicate with AI Assistant.";
      setError(msg);
      toast.error("AI Assistant Error", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const activeMode = MODES.find((t) => t.type === taskType);

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] min-h-[480px] max-w-4xl flex-col rounded-xl border border-white/5 bg-[#121217]">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-600/20 text-violet-300">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">DevOS AI Assistant</h2>
            <p className="font-mono text-[10px] text-zinc-500">Powered by Google Gemini</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New chat
          </button>
        )}
      </div>

      {/* Conversation */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Sparkles className="h-8 w-8 text-violet-400" />
            <div>
              <p className="text-sm font-medium text-zinc-200">How can I help you today?</p>
              <p className="mt-1 text-xs text-zinc-500">
                Error diagnostics, code breakdown, debugging, and Conventional Git help.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setTaskType(s.type);
                    setPrompt(s.prompt);
                  }}
                  className="rounded-lg border border-white/5 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 transition-all hover:border-violet-500/30 hover:bg-zinc-800 hover:text-violet-300"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[10px] ${
                m.role === "user"
                  ? "border-violet-500/30 bg-violet-600/20 text-violet-300"
                  : "border-emerald-500/30 bg-emerald-600/20 text-emerald-300"
              }`}
            >
              {m.role === "user" ? "You" : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div className={`group max-w-[85%] ${m.role === "user" ? "items-end" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed text-zinc-100 ${
                  m.role === "user"
                    ? "rounded-tr-sm bg-violet-600/25 border border-violet-500/20"
                    : "rounded-tl-sm bg-zinc-900/70 border border-white/5"
                }`}
              >
                <MessageBody text={m.content} />
                {m.contextCode && (
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-white/5 bg-black/60 p-3 font-mono text-xs text-zinc-300">
                    {m.contextCode}
                  </pre>
                )}
              </div>
              <div
                className={`mt-1 flex items-center gap-2 text-[10px] text-zinc-500 ${
                  m.role === "user" ? "justify-end" : ""
                }`}
              >
                <span className="font-mono">{m.timestamp}</span>
                {m.model && <span className="font-mono">{m.model}</span>}
                {m.role === "assistant" && (
                  <button
                    type="button"
                    onClick={() => handleCopy(m.content, m.id)}
                    className="flex items-center gap-1 hover:text-zinc-200"
                  >
                    {copiedId === m.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedId === m.id ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-violet-300">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-600/20">
              <Bot className="h-3.5 w-3.5 text-emerald-300" />
            </div>
            <div className="flex gap-1 rounded-2xl rounded-tl-sm border border-white/5 bg-zinc-900/70 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              AI request failed
            </div>
            <p className="mt-1 pl-6 text-zinc-300">{error}</p>
            {error.includes("GEMINI_API_KEY") && (
              <p className="pl-6 pt-1 font-mono text-[11px] text-rose-300/80">
                Tip: set GEMINI_API_KEY in .env.local and restart next dev.
              </p>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="space-y-2 border-t border-white/5 p-3"
      >
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {MODES.map((t) => (
            <button
              key={t.type}
              type="button"
              title={t.description}
              onClick={() => setTaskType(t.type)}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                taskType === t.type
                  ? "border border-violet-500/40 bg-violet-600/25 text-violet-200"
                  : "border border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showCodeInput && (
          <textarea
            rows={4}
            placeholder="Paste stack trace, function, query, or configuration..."
            value={contextCode}
            onChange={(e) => setContextCode(e.target.value)}
            spellCheck={false}
            className="w-full resize-y rounded-lg border border-white/10 bg-black/60 p-3 font-mono text-xs leading-relaxed text-zinc-200 placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
          />
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowCodeInput((v) => !v)}
            title="Attach code / log"
            className={`rounded-lg border p-2.5 transition-colors ${
              showCodeInput || contextCode
                ? "border-violet-500/40 bg-violet-600/20 text-violet-300"
                : "border-white/10 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Code2 className="h-4 w-4" />
          </button>
          <textarea
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Message DevOS AI — ${activeMode?.label ?? "General Query"} mode (Enter to send, Shift+Enter for new line)`}
            className="max-h-40 min-h-[40px] flex-1 resize-none rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-xs leading-relaxed text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="rounded-lg bg-violet-600 p-2.5 text-white shadow-sm shadow-violet-700/30 transition-all hover:bg-violet-500 disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-600">
          AI responses should be verified and tested before production use. Max 8000 characters per message.
        </p>
      </form>
    </div>
  );
}
