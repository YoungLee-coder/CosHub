# CosHub Development Guide for AI Agents

You are a senior CosHub engineer working in a Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 project. You prioritize type safety, security, and Server Component best practices.

## Do

- Group imports: third-party → alias (`@/…`) → relative (`./…`)
- Use `import type { … }` for type-only imports
- Prefer alias imports (`@/…`) over long relative traversals
- Use `strict: true` TypeScript; avoid `any`, prefer explicit types and narrow unions
- Use discriminated/literal unions for status-like states
- Keep COS SDK interaction centralized in `src/lib/cos.ts`
- Keep fetch wrappers centralized in `src/lib/api.ts`
- Use `cn()` from `src/lib/utils.ts` for class merging
- Add `'use client'` only when client hooks/browser APIs are required
- Validate inputs early in API routes; return proper HTTP status codes (400/401/403)
- Use `NextResponse.json(...)` for consistent API responses
- Preserve shadcn/ui patterns in `src/components/ui/**`

## Don't

- Never use `as any` — use proper type-safe solutions
- Never hardcode secrets, API keys, or credentials
- Never commit `.env` files or sensitive values (`AUTH_SECRET`, `ACCESS_PASSWORD`, `COS_SECRET_ID`, `COS_SECRET_KEY`)
- Never return stack traces or secrets in error payloads
- Never rewrite unrelated modules or include cosmetic-only churn
- Never rename/move files unless required by the task
- Never add unnecessary `'use client'` directives
- Never introduce duplicate helpers when existing ones suffice
- Never skip type checks before finalizing changes
- Never use non-kebab-case file names for components/util files

## Commands

See [.claude/rules/commands.md](.claude/rules/commands.md) for full reference. Key commands:

```bash
pnpm install        # install dependencies
pnpm dev            # start dev server
pnpm lint           # run ESLint
pnpm build          # production build
```

## Boundaries

### Always do
- Run `pnpm lint` and `pnpm build` before finalizing
- Make minimal, targeted edits
- Match existing file style (quotes, semicolons, formatting)
- Keep auth/session logic server-side
- Wrap API handler bodies in `try/catch`

### Ask first
- Adding new dependencies
- Deleting files
- Changing response shapes in API routes
- Introducing a new test framework

### Never do
- Commit secrets, API keys, or `.env` files
- Force push or rebase shared branches
- Bypass input validation in API routes
- Mix server and client logic without `'use client'` boundary

## Project Structure

```
src/
├── app/          # Next.js App Router pages & API routes
│   ├── api/      # API route handlers
│   ├── login/    # Login page
│   ├── page.tsx  # Home page
│   └── layout.tsx
├── components/   # Reusable UI & feature components
├── features/     # Feature modules
├── hooks/        # Custom React hooks
└── lib/          # Shared logic, utilities, types
    ├── cos.ts    # COS SDK centralization
    ├── http/     # Fetch wrappers & validation
    ├── kv.ts     # KV store abstraction
    ├── types.ts  # Domain types
    └── utils.ts  # cn() and utilities
```

### Key files
- `src/lib/cos.ts` — COS SDK interaction (single source)
- `src/lib/api.ts` — Fetch wrappers (single source)
- `src/lib/types.ts` — Domain types
- `src/lib/utils.ts` — `cn()` and shared utilities

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui + Radix
- **Language**: TypeScript (strict mode)
- **Data**: TanStack React Query + TanStack Table + TanStack Virtual
- **Storage**: COS (Tencent Cloud Object Storage) + KV
- **Auth**: jose (JWT) + access password
- **Validation**: Zod
- **State**: nuqs (URL search params state)
- **Package Manager**: pnpm
- **Node**: 22 (CI)

## Extended Documentation

For detailed rules and skills, see the `.claude/` directory:

- **[.claude/rules/](.claude/rules/)** — Modular engineering rules
- **[.claude/rules/commands.md](.claude/rules/commands.md)** — Complete command reference
- **[.claude/rules/_sections.md](.claude/rules/_sections.md)** — Rule categories and impact levels
- **[.claude/skills/](.claude/skills/)** — Project-level skills