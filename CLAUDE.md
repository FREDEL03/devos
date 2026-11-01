# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                 # Next development server: http://localhost:3000
npm run build               # Production build
npm run start               # Serve the production build
npm run lint                # ESLint
npm run test                # tests/critical-checks.ts via tsx
npx tsx tests/activity-self-check.ts
npx tsc --noEmit            # Type-check without emitting
```

The repository uses Next.js `16.4.3`, whose APIs and conventions may differ from familiar Next.js versions. Before changing Next.js code, read the relevant guide under `node_modules/next/dist/docs/`. The generated Next.js guidance in `AGENTS.md` is intentional; do not remove its block.

## Architecture

- **Framework:** Next.js App Router with TypeScript, React 19, Tailwind CSS 4. `app/` defines routes; `public/` contains static assets. The `@/*` TypeScript alias maps to the repository root.
- **Route flow:** `app/*/page.tsx` files are server components. Protected pages create the server Supabase client, call `auth.getUser()`, redirect unauthenticated users to `/login`, load initial data, then render a matching `components/*PageClient.tsx` client component. `app/page.tsx` is the dashboard and loads several domains in parallel. `/work-logs` intentionally redirects to `/activity`.
- **UI layer:** `components/` contains the interactive client pages, domain managers/cards/modals, shared navigation (`Sidebar`, `Header`), global toast and confirmation providers, and shared domain types in `types.ts`. Client boundaries are marked with `'use client'`; keep server-only code out of their import graph.
- **Mutations and data loading:** Each domain keeps server actions beside its route (`app/tasks/actions.ts`, `projects`, `snippets`, `learning`, `work-logs`, `git-toolkit`, `activity`, `settings`, and `auth`). Actions authenticate from the server session, validate input, query Supabase, call `revalidatePath`, and usually record an activity event. Reuse these actions rather than querying Supabase from UI components.
- **Supabase:** `lib/supabase/server.ts` wraps `createServerClient` with `next/headers` cookies; `lib/supabase/client.ts` is for browser code; `lib/supabase/middleware.ts` refreshes sessions and protects routes, wired through root `middleware.ts`. Shared generated-ish table types live in `lib/supabase/types.ts`. User identity must come from `supabase.auth.getUser()` rather than client input.
- **Authentication:** `app/auth/actions.ts` implements login, signup, and signout. `app/auth/callback/route.ts` exchanges an OAuth/confirmation code for a session. Login/signup UI lives under `app/login` and `app/signup`; authenticated auth routes redirect to `/` through middleware.
- **Activity logging:** `lib/activity/logger.ts` is the best-effort server logger used by mutations; `app/activity/actions.ts` provides authenticated, paginated/filterable reads and copy-event logging. Do not put credentials or secrets in activity metadata.
- **AI:** `app/api/ai/assistant/route.ts` authenticates requests, reads response settings, and calls the server-only Gemini integration in `lib/ai/gemini.ts`. `GEMINI_API_KEY` must remain server-side; `GEMINI_MODEL` is optional. Prompt/task validation and API-key redaction are covered by the critical self-checks.
- **Screenshot-to-Todo:** `app/api/ai/screenshot-analyze/route.ts` analyzes uploaded screenshots using Gemini vision capabilities, extracts tasks, and returns structured JSON. Integrated into TaskManager via `Import from Screenshot` button. Requires Gemini 2.5 or later for image support.
- **Configuration and environment:** Supabase uses `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Local environment files are ignored by Git. `next.config.ts` enables the repository's Next.js experimental features and Tailwind Turbopack rules; preserve the existing config unless the relevant Next.js 16 docs support a change.
- **Checks:** `tests/critical-checks.ts` is a dependency-free assert-style regression check covering Git generators, Gemini guards, input boundaries, redaction, settings enums, toast behavior, and confirmation-dialog behavior. `tests/activity-self-check.ts` checks activity action naming and metadata restrictions. No test framework is configured.
