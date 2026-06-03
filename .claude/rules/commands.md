# 开发命令参考

## 开发

- `pnpm dev` - 启动 EdgeOne Pages 本地开发服务器
- `pnpm dev:frontend` - 启动 Vite 前端开发服务器（仅前端）

## 构建

- `pnpm build` - Vite 生产构建（输出到 dist/）

## 检查

- `pnpm lint` - 运行 ESLint 检查（src/）
- `pnpm typecheck` - 运行 TypeScript 类型检查（tsc --noEmit）
- `pnpm format:check` - 检查 Prettier 格式化
- `pnpm format` - 自动格式化代码（Prettier --write）

## 测试

- 当前无测试框架配置，CI 验证仅依赖 `pnpm lint` 和 `pnpm build`
