# Development Workflow

## Commands

```bash
pnpm dev              # 全栈开发（EdgeOne Pages dev + middleware + edge/cloud functions）
pnpm dev:frontend     # 仅前端开发（Vite SPA，无后端）
pnpm build            # vite build
pnpm lint             # eslint src/
pnpm typecheck        # tsc --noEmit
pnpm format           # prettier --write .
pnpm format:check     # prettier --check .
```

开发需要 `.env.local` 文件（含 ACCESS_PASSWORD, AUTH_SECRET, COS 凭证等），`.env*` 已在 .gitignore 中排除。

## Verification

- 前端组件变更：`pnpm typecheck && pnpm lint`
- API / 业务逻辑变更：`pnpm typecheck && pnpm lint`（目前无自动化测试）
- 格式问题：`pnpm format:check`
- Edge / Cloud Function 变更：手动验证（JS 文件不在 TypeScript 类型检查范围内）
- 仅文档变更：检查链接和命令引用
