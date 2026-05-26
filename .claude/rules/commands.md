# 开发命令参考

## 开发

- `pnpm dev` - 启动 Next.js 开发服务器
- `pnpm start` - 启动生产服务器（需先 build）

## 构建

- `pnpm build` - 构建 Next.js 生产包

## 检查

- `pnpm lint` - 运行 ESLint 检查
- `pnpm lint --fix` - 自动修复 lint 问题
- `pnpm typecheck` - 运行 TypeScript 类型检查（tsc --noEmit）
- `pnpm format:check` - 检查 Prettier 格式化
- `pnpm format` - 自动格式化代码（Prettier --write）

## 测试

- 当前无测试框架配置，CI 验证仅依赖 `pnpm lint` 和 `pnpm build`
