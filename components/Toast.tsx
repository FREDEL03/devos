"use client";

import React, { useSyncExternalStore } from "react";
import { Check, AlertCircle, AlertTriangle, Info, X } from "./icons";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  id?: string;
  description?: React.ReactNode;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: React.ReactNode;
  description?: React.ReactNode;
  duration: number;
  persistent?: boolean;
  createdAt: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EMPTY_TOASTS: ToastItem[] = [];
let toasts: ToastItem[] = EMPTY_TOASTS;
const listeners = new Set<() => void>();
let counter = 0;

function notify() {
  listeners.forEach((listener) => listener());
}

const recentCalls = new Map<string, number>();

function addToast(type: ToastType, title: React.ReactNode, options?: ToastOptions): string {
  const now = Date.now();
  const id = options?.id || `toast-${++counter}-${now}`;
  const duration = options?.persistent ? 0 : options?.duration !== undefined ? options?.duration : 4000;

  // Deduplicate identical calls fired within 1000ms
  const key = `${type}:${String(title)}:${String(options?.description || "")}`;
  const lastTime = recentCalls.get(key);
  if (lastTime && now - lastTime < 1000 && !options?.id) {
    return id;
  }
  recentCalls.set(key, now);

  // If explicit id already present, replace it
  const existingIndex = toasts.findIndex((t) => t.id === id);
  const newToast: ToastItem = {
    id,
    type,
    title,
    description: options?.description,
    duration,
    persistent: options?.persistent || duration === 0,
    createdAt: now,
    action: options?.action,
  };

  if (existingIndex > -1) {
    toasts = [...toasts.slice(0, existingIndex), newToast, ...toasts.slice(existingIndex + 1)];
  } else {
    // Keep max 5 notifications active
    toasts = [newToast, ...toasts].slice(0, 5);
  }

  notify();

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

export function dismissToast(id: string) {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length !== toasts.length) {
    toasts = next;
    notify();
  }
}

export function clearToasts() {
  if (toasts.length > 0) {
    toasts = [];
    notify();
  }
}

export function getToasts(): ToastItem[] {
  return toasts;
}

export const toast = Object.assign(
  (title: React.ReactNode, options?: ToastOptions) => addToast("info", title, options),
  {
    success: (title: React.ReactNode, options?: ToastOptions) => addToast("success", title, options),
    error: (title: React.ReactNode, options?: ToastOptions) => addToast("error", title, options),
    warning: (title: React.ReactNode, options?: ToastOptions) => addToast("warning", title, options),
    info: (title: React.ReactNode, options?: ToastOptions) => addToast("info", title, options),
    dismiss: (id: string) => dismissToast(id),
    clear: () => clearToasts(),
  }
);

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return toasts;
}

const getServerSnapshot = () => EMPTY_TOASTS;

export function ToastContainer() {
  const activeToasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (activeToasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-96"
    >
      {activeToasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => dismissToast(item.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const configs: Record<
    ToastType,
    {
      icon: React.ComponentType<{ className?: string }>;
      iconBox: string;
      accentBorder: string;
      role: "alert" | "status";
    }
  > = {
    success: {
      icon: Check,
      iconBox: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      accentBorder: "hover:border-emerald-500/40",
      role: "status",
    },
    error: {
      icon: AlertCircle,
      iconBox: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      accentBorder: "hover:border-rose-500/40",
      role: "alert",
    },
    warning: {
      icon: AlertTriangle,
      iconBox: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      accentBorder: "hover:border-amber-500/40",
      role: "status",
    },
    info: {
      icon: Info,
      iconBox: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      accentBorder: "hover:border-violet-500/40",
      role: "status",
    },
  };

  const config = configs[item.type];
  const Icon = config.icon;

  return (
    <div
      role={config.role}
      aria-live={item.type === "error" ? "assertive" : "polite"}
      className={`pointer-events-auto group relative flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-2 sm:slide-in-from-right-2 ${config.accentBorder} bg-[#141418]/95 border-white/10 text-zinc-100 shadow-black/80 [.light_&]:bg-white/95 [.light_&]:border-black/10 [.light_&]:text-zinc-900 [.light_&]:shadow-zinc-400/40`}
    >
      {/* Icon badge */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${config.iconBox}`}
      >
        <Icon className="w-4 h-4 stroke-[2.2]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-xs font-semibold tracking-tight text-zinc-100 [.light_&]:text-zinc-900 leading-tight">
          {item.title}
        </div>
        {item.description && (
          <div className="mt-1 text-[11px] text-zinc-400 [.light_&]:text-zinc-600 leading-relaxed break-words">
            {item.description}
          </div>
        )}
        {item.action && (
          <button
            onClick={() => {
              item.action?.onClick();
              onDismiss();
            }}
            className="mt-2 text-[11px] font-medium text-violet-400 hover:text-violet-300 [.light_&]:text-violet-600 [.light_&]:hover:text-violet-700 underline underline-offset-2 transition-colors"
          >
            {item.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        aria-label="Close notification"
        className="shrink-0 rounded-md p-1 text-zinc-400 hover:text-zinc-200 [.light_&]:text-zinc-500 [.light_&]:hover:text-zinc-800 hover:bg-white/5 [.light_&]:hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
