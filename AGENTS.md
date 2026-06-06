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
- EdgeOne Pages 构建环境限制：Node ≥22.11 但 <22.12 时不能使用 Vite 8+（缺少 Rolldown native bindings）；锁定 Vite 6 + plugin-react 5 组合；pnpm 版本需兼容 EdgeOne build env 的 Node 版本（当前 10.12.1 对 Node 22.11）。修改 Vite/pnpm/Node 版本前先查 EdgeOne Pages build env 的实际 Node 版本。

## Hotspot Ownership

- `src/components/ui/sidebar.tsx` — shadcn/ui 生成的 sidebar 原语系统（20+ 可组合子组件 + `useSidebar` hook）。**不要手动拆分或重构** — 通过 `npx shadcn@latest diff sidebar` 检查与 registry 的偏差。修改该文件会破坏 shadcn 更新契约。触碰时运行 `pnpm typecheck`。
- `src/components/file-grid.tsx` — 文件网格视图（虚拟滚动 + 卡片布局 + 缩略图 + 删除/重命名/预览对话框）。与 `file-table.tsx` 共享约 70-80% 的 mutation/handler/dialog 逻辑。**稳定边界**：`FileGridProps` 接口（`{ bucket, prefix, onNavigate }`）、`useObjects` hook 依赖、`cos.api` mutation 契约。建议将共享的 mutation/handler/dialog 抽取到 `src/features/cos/hooks/` 和 `src/features/cos/components/`，网格布局和虚拟滚动部分保留在本文件。触碰时运行 `pnpm typecheck`，手动验证网格视图。
- `src/components/file-table.tsx` — 文件表格视图（tanstack/react-table 排序筛选 + 行选择 + 操作菜单）。与 `file-grid.tsx` 共享约 70-80% 的 mutation/handler/dialog 逻辑。**稳定边界**：`FileTableProps` 接口（同 FileGrid）、表格列结构（name, size, lastModified, actions）。同样建议将共享逻辑抽取后，仅保留 tanstack/react-table 配置和表格 JSX 渲染。触碰时运行 `pnpm typecheck`，手动验证表格视图。
- `cloud-functions/api/[[default]].js` — Express 云函数，所有 COS 操作的单一后端入口（7 个路由：bucket 列表、对象列表、删除、重命名、创建文件夹、签名 URL、CDN URL）。**稳定边界**：路由路径（`/cos/buckets`、`/cos/cdn-domain`、`/cos/objects`、`/cos/url`）、响应信封 `{ success, data, error }`、header 凭据传递模式（`x-coshub-cos-*`）。该文件为纯 JS，`pnpm typecheck` 不覆盖；触碰时通过 `pnpm dev` 手动测试对应 API。

## Verification

- Frontend changes: run `pnpm typecheck` then `pnpm lint`.
- All changes: run `pnpm format:check` before committing.
- Serverless function changes: manually test via `pnpm dev` (full-stack) — no automated test coverage exists yet.
- Documentation-only changes: check that commands and paths referenced still exist.
