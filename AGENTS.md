# AGENTS.md

This document is for coding agents working in this repository.
Follow these repo-specific commands and conventions.

## Project Snapshot

- Stack: Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4.
- Package manager: pnpm (lockfile: `pnpm-lock.yaml`).
- Node version in CI: Node 22.
- Lint config: `eslint.config.mjs` with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- Path alias: `@/*` -> `src/*` (from `tsconfig.json`).
- CI currently runs lint and build only.

## Rule Files (Cursor/Copilot)

- `.cursorrules`: not found.
- `.cursor/rules/`: not found.
- `.github/copilot-instructions.md`: not found.
- If any of these files are added later, treat them as mandatory project rules.

## Install / Run Commands

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Build production bundle: `pnpm build`
- Start production server: `pnpm start`
- Run lint: `pnpm lint`
- Auto-fix lint issues when possible: `pnpm lint --fix`

## Test and Verification Commands

- There is currently **no test runner configured** in `package.json`.
- There are currently no `*.test.*` / `*.spec.*` files in the repo.
- CI verification is currently:
  - `pnpm lint`
  - `pnpm build`

### Single-test guidance (important)

- A true "run one test" command is **not available yet** because no test script exists.
- If a test runner is introduced, add a `test` script and document single-test usage here.
- Suggested future pattern (Vitest example):
  - All tests: `pnpm test`
  - Single file: `pnpm test -- src/path/to/file.test.ts`
  - Single test name: `pnpm test -- -t "test name"`

## Recommended Local Agent Workflow

1. `pnpm install`
2. Make the smallest safe code change.
3. Run targeted lint on touched files when possible.
4. Run `pnpm lint`.
5. Run `pnpm build` before finalizing.

## Source Layout

- App routes and API routes: `src/app/**`
- Reusable UI and feature components: `src/components/**`
- Hooks: `src/hooks/**`
- Shared logic/utilities/types: `src/lib/**`
- Static assets: `public/**`

## Code Style Guidelines

### Imports

- Prefer import grouping in this order:
  1. framework / third-party packages,
  2. internal alias imports (`@/...`),
  3. relative imports (`./...`).
- Keep type-only imports explicit with `import type { ... }` when practical.
- Prefer alias imports (`@/...`) over long relative traversals.
- Avoid unused imports; keep files lint-clean.

### Formatting

- Follow existing file style instead of reformatting entire files.
- Current codebase has mixed quote styles (single and double) across files.
- Match the local style of the file you edit.
- Use semicolon style consistent with surrounding code (mostly no semicolons in app code).
- Keep functions and JSX readable; avoid unnecessary one-liners for complex logic.
- Keep diffs focused; do not include cosmetic-only churn.

### TypeScript and Types

- `strict: true` is enabled; preserve strict typing.
- Avoid `any`; prefer explicit interfaces/types and narrow unions.
- Type public function inputs/outputs, especially in `src/lib/**` and hooks.
- For optional values from env/query/body, validate and narrow before use.
- Prefer domain types from `src/lib/types.ts` or nearby feature types.
- Use discriminated unions or literal unions for status-like states.

### Naming Conventions

- Components: PascalCase (`FileTable`, `DashboardLayout`).
- Hooks: camelCase with `use` prefix (`useObjects`, `useMobile`).
- Utility functions/variables: camelCase.
- Constants: UPPER_SNAKE_CASE for true constants (`SESSION_COOKIE_NAME`).
- Route handlers in `route.ts`: exported uppercase HTTP method names (`GET`, `POST`, etc.).
- Keep file names kebab-case for components/util files where already used.

### React / Next.js Patterns

- Add `'use client'` only when client hooks/browser APIs are required.
- Prefer server route handlers for sensitive operations and secrets.
- Keep API route responses consistent via `NextResponse.json(...)`.
- In App Router pages/layouts, keep metadata in `export const metadata` when relevant.
- Preserve shadcn/ui patterns in `src/components/ui/**`.

### Error Handling

- In API routes:
  - Validate inputs early and return 400/401/403 as appropriate.
  - Wrap handler bodies in `try/catch` for operational failures.
  - Log server-side errors with context (`console.error('Action error:', error)`).
  - Return safe error payloads (no secrets, no stack traces).
- In client code:
  - Catch async failures for user-triggered actions.
  - Show user feedback (existing pattern uses `sonner` toasts).
  - Throw on non-OK responses in API helper functions when callers should handle errors.

### Environment and Security

- Required env vars are documented in `README.md` and `.env.local.example`.
- Never hardcode secrets or credentials.
- Treat `AUTH_SECRET`, `ACCESS_PASSWORD`, `COS_SECRET_ID`, and `COS_SECRET_KEY` as sensitive.
- Keep auth/session logic server-side when possible.

### API and Data Access

- Keep COS SDK interaction centralized in `src/lib/cos.ts`.
- Keep fetch wrappers centralized in `src/lib/api.ts`.
- Reuse existing helpers before introducing duplicates.
- Preserve current response shapes unless coordinated refactors require updates.

### UI and Styling

- Use Tailwind utility classes and existing component primitives.
- Reuse `cn()` from `src/lib/utils.ts` for class merging.
- Prefer existing design tokens and neutral palette conventions already in use.
- Keep accessibility basics: button semantics, labels, and keyboard-safe interactions.

## Lint/Build Expectations for PRs

- Minimum local gate before handoff:
  - `pnpm lint`
  - `pnpm build`
- If you cannot run commands locally, explicitly state what was not verified.

## Change Scope Guidance

- Make minimal, targeted edits.
- Do not rewrite unrelated modules.
- Do not rename/move files unless required by the task.
- Update this file when tooling or conventions change.
