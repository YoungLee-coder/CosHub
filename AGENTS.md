# CosHub Agent Guide

This file is the shared source of truth for any AI agent working on this repo (Claude Code, Codex, Cursor, etc.). `CLAUDE.md` is a symlink to this file. Put machine-specific or personal overrides in `AGENTS.local.md` / `CLAUDE.local.md`; both are gitignored.

## Project

CosHub is a web management panel for Tencent Cloud COS (Cloud Object Storage), deployed on EdgeOne Pages with a three-tier serverless architecture (middleware → edge functions → cloud functions). The shaping constraint: **auth and COS credential injection run in middleware/edge — any bypass is a security hole**.

## Repository Map

- `src/` — Frontend SPA (React 19 + TypeScript strict). Entry: `src/pages/`. Sub-modules: `features/auth/`, `features/cos/`, `features/init/`, `features/settings/` (each with `client/*.api.ts`), `components/ui/` (shadcn/ui primitives), `hooks/`, `lib/` (shared utils, HTTP client, types), `mocks/` (client-side mock data for dev without backend).
- `edge-functions/` — EdgeOne edge functions (low-latency CDN-edge). Auth endpoints (`api/auth/login.js`, `check.js`, `logout.js`), settings & init CRUD (`api/settings/index.js`, `api/init/index.js`).
- `cloud-functions/` — EdgeOne cloud functions (Node.js Express). `api/[[default]].js` handles all COS operations: bucket listing, object CRUD, signed URL generation, CDN URL.
- `middleware.js` — JWT verification gate for `/api/cos/*` and `/api/settings/*`; reads COS credentials from KV and injects them into request headers.
- `public/` — Static assets (SVG icons).
- `index.html` — SPA entry (lang="zh-CN").

## Commands

```bash
pnpm dev            # Full-stack local dev (edgeone pages dev)
pnpm dev:frontend   # Frontend only (vite)
pnpm build          # Production build (vite build)
pnpm lint           # Lint (eslint src/)
pnpm typecheck      # Type check (tsc --noEmit)
pnpm format         # Format write (prettier --write .)
pnpm format:check   # Format check (prettier --check .)
```

No test suite is configured yet — no `pnpm test` command exists.

Env vars: `.env.local` holds `ACCESS_PASSWORD`, `AUTH_SECRET`, `VITE_ENABLE_MOCK`. Never commit `.env.local`.

## Critical Safety Rules

- Never bypass `middleware.js` JWT verification for COS or settings routes — all requests must pass through the middleware auth gate.
- COS credentials (`SecretId`, `SecretKey`) must only be read from KV by middleware and injected via request headers; never expose them in client-side code or API responses.
- Object delete and batch delete operations are irreversible — always confirm destructive actions on the frontend and never add unguarded delete endpoints.
- `ACCESS_PASSWORD` and `AUTH_SECRET` are the root secrets — never log them, never include them in debug output, never hardcode them.

## Working Rules

- Use Zod schemas for all API input validation — never trust raw request bodies.
- Frontend components: use shadcn/ui primitives from `src/components/ui/` — never re-implement button, card, dialog, etc. from scratch.
- Scoped imports: `@/features/` for domain modules, `@/lib/` for shared utilities, `@/components/ui/` for shadcn primitives — no cross-feature imports without going through `@/lib/`.
- API calls live in `features/*/client/*.api.ts` — never scatter fetch logic in pages or components.
- TypeScript strict mode (`strict: true` in tsconfig) — no implicit any, no unchecked assertions.
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## Verification

- Frontend changes: run `pnpm typecheck` then `pnpm lint`.
- All changes: run `pnpm format:check` before committing.
- Serverless function changes: manually test via `pnpm dev` (full-stack) — no automated test coverage exists yet.
- Documentation-only changes: check that commands and paths referenced still exist.
