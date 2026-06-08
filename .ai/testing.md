# Testing Strategy

目前项目无测试框架。无 vitest / jest 配置，无测试文件，无测试命令。

## Per-change verification

- 任何代码变更：手动验证功能是否正常（`pnpm dev` 启动后检查）。
- 前端变更：`pnpm typecheck && pnpm lint` 确保类型和风格无问题。
- Edge / Cloud Function 变更：手动测试对应 API 端点。

TODO: 项目应引入 vitest + @testing-library/react 作为测试基础设施。
