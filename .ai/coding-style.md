# Coding Style & Conventions

- 使用 `@/` 路径别名引用内部模块，不要用相对路径跨目录引用。
- API 调用走 `src/features/<domain>/client/<domain>.api.ts`，不要直接在组件里写 fetch。
- API 响应使用统一信封 `{ success, data, error }`，客户端用 `requestEnvelope<T>()` 或 `requestJson<T>()` 解析（来自 `src/lib/http/client.ts`）。
- 格式化：Prettier（`semi: false`, `singleQuote: true`, `trailingComma: es5`, `printWidth: 100`）。
- 提交消息：中文描述，conventional commits 格式（`feat:`, `fix:`, `chore:` 等）。
- UI 字符串使用中文（提示、按钮文本、错误消息）。
- 新表单验证优先使用 Zod（已安装未使用），不要手写校验逻辑。
- Mock 模式：开发时设置 `VITE_ENABLE_MOCK=true` 拦截 API 调用，修改 API 格式时需同步更新 mock 数据。
- Vite 手动分块策略：`vendor`（react/react-dom/react-router-dom）、`query`（tanstack 系列）、`ui`（Radix 系列）——修改分块时参考 `vite.config.ts`。
- `'use client'` 指令目前无实际作用（纯 SPA），但保留以备未来迁移。
