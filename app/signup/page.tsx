"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Flame, ArrowUpRight, Check } from "@/components/icons";
import { signup } from "@/app/auth/actions";
import { toast } from "@/components/Toast";

export default function SignupPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password.length < 6) {
      const err = "Password must be at least 6 characters.";
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    if (password !== confirmPassword) {
      const err = "Passwords do not match.";
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    startTransition(async () => {
      const res = await signup(formData);
      if (res?.error) {
        setErrorMessage(res.error);
        toast.error("Registration failed", { description: res.error });
      } else if (res?.success) {
        setSuccessMessage(res.success);
        toast.success("Account created", { description: res.success });
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 mb-3 shadow-lg shadow-violet-900/20">
            <Flame className="w-6 h-6 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create DevOS Account
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Personal developer dashboard & cloud PostgreSQL workspace
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#121217] p-6 sm:p-8 shadow-2xl shadow-black/80">
          {errorMessage && (
            <div className="mb-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
              <span className="font-semibold shrink-0">Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Verification Sent</h3>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  {successMessage}
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
              >
                Proceed to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="e.g. Alex Turing"
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Work Email <span className="text-rose-400">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="developer@example.com"
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Password (min 6 characters) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-zinc-900 border border-white/10 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-700/30 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Register Account</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-0.5 ml-1 transition-colors"
            >
              Sign In
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
