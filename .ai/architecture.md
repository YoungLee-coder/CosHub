# Architecture

## Repository Map

- `src/` — 前端 SPA 源码（React 19 + TypeScript strict）。页面、组件、hooks、features（领域模块）、lib 工具、mock 数据、样式。
- `src/pages/` — 路由级页面组件：login.tsx, dashboard.tsx, setup.tsx。
- `src/components/` — 共享 UI 组件：dashboard-layout, file-table, file-grid, upload-dialog, settings-dialog, breadcrumb-nav, app-sidebar, view-toggle。
- `src/components/ui/` — shadcn/ui 原子组件（Radix 基础，new-york 风格）。
- `src/features/` — 领域驱动的功能模块，每个含 `client/` 子目录用于 API 调用：auth/, cos/, init/, settings/。
- `src/hooks/` — 自定义 React hooks：useObjects（COS 对象数据），use-mobile（响应式检测）。
- `src/lib/` — 共享工具：utils.ts（cn, formatFileSize, formatDate, getFileName）、types.ts（FileItem, BucketInfo, UploadProgress）、thumbnail.ts（缩略图 URL 生成）、http/client.ts（API 请求封装 + mock 支持）。
- `src/mocks/` — 客户端 mock 数据和请求拦截器，通过 VITE_ENABLE_MOCK=true 启用。
- `src/styles/` — globals.css — Tailwind CSS v4 + shadcn/ui 主题 token（亮/暗色模式）。
- `edge-functions/` — EdgeOne Pages 边缘函数（Web API 运行时，无 Node.js SDK）。处理认证、初始化状态、设置读写。
- `edge-functions/api/auth/` — login.js（密码验证 + HMAC-SHA256 JWT 签名 + 限速）、check.js（JWT 验证）、logout.js（清除 HttpOnly cookie）。
- `edge-functions/api/init/` — index.js — 初始化状态端点。
- `edge-functions/api/settings/` — index.js — KV 设置 CRUD（GET/PUT），含 `******` 密钥遮蔽逻辑。
- `cloud-functions/` — EdgeOne Pages 云函数（Node.js 运行时）。Express.js 应用代理所有 `/cos/*` 路由，使用 cos-nodejs-sdk-v5 SDK。
- `cloud-functions/api/[[default]].js` — 单文件 Express 应用，处理 COS 对象的列表、上传、删除、重命名。
- `middleware.js` — JWT 认证门卫，拦截 `/api/cos/*` 和 `/api/settings/*` 请求，注入 COS 凭证头 `x-coshub-cos-secret-id` / `x-coshub-cos-secret-key`。
- `.husky/` — Git hooks（pre-commit 触发 lint-staged）。

入口点：`src/main.tsx` → `HashRouter` → 页面组件。

技术栈：React 19 + react-router-dom v7 (HashRouter) + Vite 8 + TypeScript 6 strict + Tailwind CSS v4 + shadcn/ui + @tanstack/react-query + @tanstack/react-table + @tanstack/react-virtual + nuqs + lucide-react + sonner + react-dropzone + Zod（已安装未使用）。
