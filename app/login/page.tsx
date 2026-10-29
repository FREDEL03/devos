"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Flame, ArrowUpRight } from "@/components/icons";
import { login } from "@/app/auth/actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");

  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await login(formData);
      if (res?.error) {
        setErrorMessage(res.error);
      }
    });
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 mb-3 shadow-lg shadow-violet-900/20">
          <Flame className="w-6 h-6 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Welcome back to DevOS
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Sign in to access your developer productivity dashboard
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Work Email
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
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-zinc-300"
              >
                Password
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
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
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In to DevOS</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-0.5 ml-1 transition-colors"
          >
            Create Account
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-zinc-500 text-xs">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
