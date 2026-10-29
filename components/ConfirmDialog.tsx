"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { AlertCircle, AlertTriangle, Info, Loader2, X } from "./icons";

export type ConfirmVariant = "normal" | "warning" | "destructive";

export interface ConfirmDialogOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: React.ComponentType<{ className?: string }>;
  onConfirm?: () => Promise<boolean | void | { error?: string }> | boolean | void | { error?: string };
}

interface ActiveConfirmDialog extends ConfirmDialogOptions {
  id: string;
  resolve: (value: boolean) => void;
}

let activeDialog: ActiveConfirmDialog | null = null;
const dialogListeners = new Set<() => void>();

function notifyDialog() {
  dialogListeners.forEach((fn) => fn());
}

export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    activeDialog = {
      ...options,
      id: `dialog-${Date.now()}`,
      resolve,
    };
    notifyDialog();
  });
}

export function getActiveDialog() {
  return activeDialog;
}

export function closeConfirmDialog(result = false) {
  if (activeDialog) {
    const cb = activeDialog.resolve;
    activeDialog = null;
    notifyDialog();
    cb(result);
  }
}

function subscribeDialog(callback: () => void) {
  dialogListeners.add(callback);
  return () => {
    dialogListeners.delete(callback);
  };
}

function getDialogSnapshot() {
  return activeDialog;
}

export function ConfirmDialogContainer() {
  const current = useSyncExternalStore(subscribeDialog, getDialogSnapshot, () => null);

  if (!current) return null;

  return (
    <ConfirmDialogModal
      key={current.id}
      dialog={current}
      onClose={() => closeConfirmDialog(false)}
      onSuccess={() => closeConfirmDialog(true)}
    />
  );
}

function ConfirmDialogModal({
  dialog,
  onClose,
  onSuccess,
}: {
  dialog: ActiveConfirmDialog;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const variant = dialog.variant || "normal";

  useEffect(() => {
    confirmButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose]);

  const handleConfirm = async () => {
    if (loading) return;
    setErrorMessage(null);

    if (!dialog.onConfirm) {
      onSuccess();
      return;
    }

    try {
      setLoading(true);
      const res = await dialog.onConfirm();

      if (res && typeof res === "object" && "error" in res && res.error) {
        setErrorMessage(res.error);
        setLoading(false);
        return;
      }

      if (res === false) {
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
    } catch (err: unknown) {
      // Next.js redirect() throws internally — let it propagate
      if (err instanceof Error && (err as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw err;
      setErrorMessage(err instanceof Error ? err.message : "Action failed. Please try again.");
      setLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: AlertCircle,
          iconBox: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          button:
            "bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-900/30 focus:ring-rose-500",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconBox: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          button:
            "bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-900/30 focus:ring-amber-500",
        };
      case "normal":
      default:
        return {
          icon: Info,
          iconBox: "bg-violet-500/10 text-violet-400 border-violet-500/20",
          button:
            "bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-900/30 focus:ring-violet-500",
        };
    }
  };

  const variantConfig = getVariantStyles();
  const IconComponent = dialog.icon || variantConfig.icon;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Dialog card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#121217] p-6 text-zinc-100 shadow-2xl shadow-black/90 [.light_&]:bg-white [.light_&]:border-black/10 [.light_&]:text-zinc-900 [.light_&]:shadow-zinc-400/50 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${variantConfig.iconBox}`}
          >
            <IconComponent className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold tracking-tight text-white [.light_&]:text-zinc-900"
            >
              {dialog.title}
            </h2>
            {dialog.description && (
              <p
                id="confirm-dialog-description"
                className="mt-1.5 text-xs text-zinc-400 [.light_&]:text-zinc-600 leading-relaxed"
              >
                {dialog.description}
              </p>
            )}

            {errorMessage && (
              <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 [.light_&]:text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-zinc-400 hover:text-white [.light_&]:text-zinc-500 [.light_&]:hover:text-zinc-900 hover:bg-white/5 [.light_&]:hover:bg-black/5 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-white/5 [.light_&]:border-black/5 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/5 [.light_&]:border-black/10 [.light_&]:bg-black/5 [.light_&]:text-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 [.light_&]:hover:bg-black/10 hover:text-white [.light_&]:hover:text-zinc-900 transition-colors disabled:opacity-50"
          >
            {dialog.cancelText || "Cancel"}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121217] [.light_&]:focus:ring-offset-white disabled:opacity-50 ${variantConfig.button}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{dialog.confirmText || "Confirm"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean | void | { error?: string }> | boolean | void | { error?: string };
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: React.ComponentType<{ className?: string }>;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "normal",
  icon,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <ConfirmDialogModal
      dialog={{
        id: "declarative-confirm-dialog",
        title,
        description,
        confirmText,
        cancelText,
        variant,
        icon,
        onConfirm,
        resolve: () => {},
      }}
      onClose={onClose}
      onSuccess={onClose}
    />
  );
}
