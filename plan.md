# CosHub EdgeOne Pages 重写计划

> 从 Next.js App Router 项目迁移到原生 EdgeOne Pages 全栈项目（静态前端 + Edge Functions + Cloud Functions + Middleware），使 KV 存储可用并消除 Next.js 运行时限制。

---

## 1. 迁移动机

| 问题              | 当前状态                                                      | 迁移后                                                              |
| ----------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| KV 不可用         | EdgeOne KV namespace 无法注入 Next.js Edge Functions 的 `env` | Edge Functions 中 KV 作为全局变量直接可用 ✅                        |
| Settings 只读     | `PUT /api/settings` 返回 503                                  | KV 可读写，Settings 动态可配 ✅                                     |
| Rate-limit 不可靠 | 内存 Map，重启丢失                                            | KV 存储，持久化 ✅                                                  |
| API runtime 受限  | 所有 API 路由必须 `runtime = 'nodejs'`                        | COS 操作用 Cloud Functions (Node.js)；轻量 API 用 Edge Functions ✅ |
| 框架耦合          | Next.js App Router 限制了运行时选择                           | 脱离框架，自由选择 Edge/Cloud/Middleware ✅                         |

---

## 2. 目标架构

```
CosHub/
├── src/                          # 前端源码 (React SPA, Vite 构建)
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── pages/                    # 单入口 index.html
│   └── styles/
├── edge-functions/               # V8 边缘函数 — 无 npm，有 KV
│   └── api/
│       ├── auth/
│       │   ├── login.js          # POST: 密码校验 + JWT + rate-limit (KV)
│       │   ├── check.js          # GET: 验证 JWT session
│       │   └── logout.js         # POST: 清除 session cookie
│       └── settings/
│           └── index.js          # GET/PUT: KV 存取 settings
├── cloud-functions/              # Node.js v20 云端函数 — 有 npm，有 COS SDK
│   └── api/
│       └── [[default]].js        # Express app 统一处理所有 COS API
├── middleware.js                  # 认证守卫：拦截 /api/* 请求验证 JWT
├── edgeone.json                  # EdgeOne Pages 项目配置
├── package.json                  # 前端 + Cloud Functions 共享依赖
├── vite.config.ts                # Vite 构建配置
├── tsconfig.json                 # TypeScript 配置 (前端)
├── tailwind.config.ts            # Tailwind CSS v4 配置
├── postcss.config.mjs
└── public/                       # 静态资源 (favicon 等)
```

### 2.1 三层运行时分工

| 层                  | 运行时      | 职责                                 | 特点                         |
| ------------------- | ----------- | ------------------------------------ | ---------------------------- |
| **Middleware**      | V8 (edge)   | JWT 认证守卫，拦截 `/api/*`          | 超轻量，无需 npm             |
| **Edge Functions**  | V8 (edge)   | Auth CRUD、Settings CRUD、Rate-limit | 有 KV，无 npm，用 Web Crypto |
| **Cloud Functions** | Node.js v20 | COS 全部操作 (SDK + npm)             | 有 npm，120s 超时，6MB body  |

### 2.2 数据流

```
浏览器请求 /api/cos/buckets
  → middleware.js: 读取 cookie → Web Crypto 验证 JWT → 通过则 next()，否则 401
  → cloud-functions/api/[[default]].js: Express 路由处理 → cos SDK 操作 → Response

浏览器请求 /api/auth/login
  → middleware.js: matcher 排除 /api/auth/* → 不拦截
  → edge-functions/api/auth/login.js: 校验密码(KV) → 生成 JWT(Web Crypto) → 设置 cookie

浏览器请求 /api/settings
  → middleware.js: 验证 JWT → 通过
  → edge-functions/api/settings/index.js: KV 读写 settings
```

---

## 3. 技术选型

### 3.1 前端

| 技术                     | 用途     | 说明                                                    |
| ------------------------ | -------- | ------------------------------------------------------- |
| **React 19**             | UI 框架  | 保持现有技术栈                                          |
| **Vite**                 | 构建工具 | 替代 Next.js 构建，SPA 模式                             |
| **TypeScript**           | 类型安全 | strict 模式                                             |
| **Tailwind CSS v4**      | 样式     | 保持现有样式方案                                        |
| **shadcn/ui + Radix**    | 组件库   | 保持现有 UI 组件                                        |
| **TanStack React Query** | 数据获取 | 保持现有数据层                                          |
| **TanStack Virtual**     | 虚拟滚动 | 保持 Grid 虚拟化                                        |
| **nuqs**                 | URL 状态 | 不再需要 NuqsAdapter (非 Next.js)，使用 nuqs 的独立模式 |
| **react-dropzone**       | 文件上传 | 保持现有上传方案                                        |
| **Zod**                  | 校验     | 前端 + Cloud Functions 共用                             |

### 3.2 后端

| 技术                  | 用途                     | 运行时                           |
| --------------------- | ------------------------ | -------------------------------- |
| **Express**           | Cloud Functions 路由框架 | Node.js                          |
| **cos-nodejs-sdk-v5** | COS SDK                  | Node.js (Cloud Functions)        |
| **Web Crypto API**    | JWT HS256 签发/验证      | V8 (Edge Functions + Middleware) |
| **EdgeOne KV**        | 持久化配置 + rate-limit  | V8 (Edge Functions)              |

### 3.3 不再使用的技术

| 技术            | 原因                                                |
| --------------- | --------------------------------------------------- |
| **Next.js**     | 框架限制了运行时选择，KV 无法注入                   |
| **jose**        | Edge Functions/V8 无法使用 npm，改为 Web Crypto API |
| **next-themes** | 未实际使用，移除                                    |
| **JSZip**       | 未实际使用，移除                                    |
| **NuqsAdapter** | 非 Next.js 项目不需要                               |

---

## 4. 详细实现方案

### 4.1 JWT 认证 — Web Crypto API 实现

Edge Functions 和 Middleware 运行在 V8 环境，无法使用 jose (npm)。使用 Web Crypto API 实现等价功能：

```javascript
// JWT 签发 (Edge Functions)
async function signJWT(payload, secret, expiresInSeconds) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claims = { ...payload, iat: now, exp: now + expiresInSeconds }
  const headerB64 = btoa(JSON.stringify(header))
  const payloadB64 = btoa(JSON.stringify(claims))
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  )
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return `${headerB64}.${payloadB64}.${sigB64}`
}

// JWT 验证 (Middleware + Edge Functions)
async function verifyJWT(token, secret) {
  const [headerB64, payloadB64, sigB64] = token.split('.')
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  const sig = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0))
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    sig,
    encoder.encode(`${headerB64}.${payloadB64}`)
  )
  if (!valid) return null
  const claims = JSON.parse(atob(payloadB64))
  if (claims.exp < Math.floor(Date.now() / 1000)) return null
  return claims
}
```

### 4.2 Middleware — 认证守卫

```javascript
// middleware.js — 项目根目录

export const config = {
  matcher: ['/api/cos/:path*', '/api/settings/:path*'],
  // 排除 /api/auth/* — 这些路由自行处理或无需认证
}

export async function middleware(context) {
  const cookie = context.request.headers.get('cookie') || ''
  const match = cookie.match(/coshub_session=([^;]+)/)
  if (!match) {
    return new Response(JSON.stringify({ success: false, error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const claims = await verifyJWT(match[1], context.env.AUTH_SECRET)
  if (!claims || !claims.authenticated) {
    return new Response(JSON.stringify({ success: false, error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  // 注入认证信息供下游使用
  return context.next({
    headers: { 'x-auth-user': 'authenticated' },
  })
}
```

### 4.3 Edge Functions — Auth + Settings + KV

**login.js** — 密码校验 + JWT 签发 + rate-limit：

```javascript
// edge-functions/api/auth/login.js

export async function onRequestPost(context) {
  const body = await context.request.json()
  const { password } = body
  if (!password) {
    return jsonResponse({ success: false, error: '密码不能为空' }, 400)
  }

  // Rate limit from KV
  const clientIp =
    context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateKey = `rate:login:${clientIp}`
  const rateData = (await coshub_kv.get(rateKey, 'json')) || { count: 0, windowStart: Date.now() }
  const WINDOW = 60_000,
    MAX = 5
  if (Date.now() - rateData.windowStart > WINDOW) {
    rateData = { count: 0, windowStart: Date.now() }
  }
  if (rateData.count >= MAX) {
    return jsonResponse({ success: false, error: '尝试次数过多，请稍后再试' }, 429)
  }

  // Verify password from KV (fallback to env)
  const storedPassword = (await coshub_kv.get('access_password')) || context.env.ACCESS_PASSWORD
  if (password !== storedPassword) {
    rateData.count++
    await coshub_kv.put(rateKey, JSON.stringify(rateData))
    return jsonResponse({ success: false, error: '密码错误' }, 401)
  }

  // Reset rate limit
  await coshub_kv.put(rateKey, JSON.stringify({ count: 0, windowStart: Date.now() }))

  // Sign JWT
  const token = await signJWT({ authenticated: true }, context.env.AUTH_SECRET, 7 * 24 * 3600)

  // Set cookie + respond
  return new Response(JSON.stringify({ success: true, data: { authenticated: true } }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `coshub_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}`,
    },
  })
}
```

**settings/index.js** — KV 存取配置：

```javascript
// edge-functions/api/settings/index.js

export async function onRequestGet(context) {
  const password = (await coshub_kv.get('access_password')) || context.env.ACCESS_PASSWORD || ''
  const cdnDomain = (await coshub_kv.get('cos_cdn_domain')) || context.env.COS_CDN_DOMAIN || ''
  return jsonResponse({
    success: true,
    data: {
      accessPassword: password ? '******' : '',
      cdnDomain,
      kvAvailable: true,
      source: 'kv',
    },
  })
}

export async function onRequestPut(context) {
  const body = await context.request.json()
  const updates = {}
  if (body.accessPassword && body.accessPassword !== '******') {
    await coshub_kv.put('access_password', body.accessPassword)
    updates.accessPassword = '******'
  }
  if (body.cdnDomain !== undefined) {
    await coshub_kv.put('cos_cdn_domain', body.cdnDomain)
    updates.cdnDomain = body.cdnDomain
  }
  return jsonResponse({ success: true, data: updates })
}
```

### 4.4 Cloud Functions — Express + COS SDK

```javascript
// cloud-functions/api/[[default]].js — Express 统一处理所有 COS API

import express from 'express'
import COS from 'cos-nodejs-sdk-v5'

const app = express()
app.use(express.json())

// COS 客户端工厂 — 从 env 创建
function createCosClient(env) {
  return new COS({
    SecretId: env.COS_SECRET_ID,
    SecretKey: env.COS_SECRET_KEY,
  })
}

// GET /api/cos/buckets — 列出所有桶
app.get('/cos/buckets', async (req, res) => {
  try {
    const cos = createCosClient(process.env)
    const result = await cos.getService()
    const buckets =
      result.Buckets?.map((b) => ({
        name: b.Name,
        region: b.Location,
        creationDate: b.CreationDate,
      })) || []
    res.json({ success: true, data: { buckets } })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取桶列表失败' })
  }
})

// GET /api/cos/cdn-domain
app.get('/cos/cdn-domain', async (req, res) => {
  const cdnDomain = process.env.COS_CDN_DOMAIN || ''
  res.json({ success: true, data: { cdnDomain } })
})

// GET /api/cos/objects?bucket=X&prefix=Y
app.get('/cos/objects', async (req, res) => {
  /* ... */
})

// DELETE /api/cos/objects — 批量删除
app.delete('/cos/objects', async (req, res) => {
  /* ... */
})

// PUT /api/cos/objects — 重命名
app.put('/cos/objects', async (req, res) => {
  /* ... */
})

// POST /api/cos/objects — 创建文件夹
app.post('/cos/objects', async (req, res) => {
  /* ... */
})

// GET /api/cos/url?bucket=X&key=Y&method=GET|PUT — 预签名 URL
app.get('/cos/url', async (req, res) => {
  /* ... */
})

// POST /api/cos/url — CDN URL 构建
app.post('/cos/url', async (req, res) => {
  /* ... */
})

export default app
```

**环境变量在 Cloud Functions 中的获取方式**：

- Node.js Cloud Functions 通过 `process.env` 获取环境变量
- Express 中间件可将 env 挂载到 `req` 上，便于每个路由使用

### 4.5 前端 SPA — Vite + React

#### 4.5.1 入口文件

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CosHub - COS 管理面板</title>
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### 4.5.2 路由方案

使用 React Router 替代 Next.js App Router：

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './app'

const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
```

```tsx
// src/app.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/login'
import { DashboardPage } from './pages/dashboard'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

#### 4.5.3 认证状态管理

使用 React Query + Context 替代 Next.js Server Component 的认证检查：

```tsx
// src/features/auth/auth-guard.tsx
import { useQuery } from '@tanstack/react-query'
import { checkAuth } from './auth.api'
import { Navigate } from 'react-router-dom'

export function AuthGuard({ children }) {
  const { data, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: checkAuth,
    staleTime: 5 * 60_000,
  })
  if (isLoading) return <LoadingSkeleton />
  if (!data?.authenticated) return <Navigate to="/login" replace />
  return children
}
```

#### 4.5.4 URL 状态 (nuqs)

非 Next.js 项目使用 nuqs 的 `parseAsString` 等独立 API：

```tsx
// src/pages/dashboard.tsx
import { useQueryState } from 'nuqs'

export function DashboardPage() {
  const [bucket, setBucket] = useQueryState('bucket')
  const [prefix, setPrefix] = useQueryState('prefix', { defaultValue: '' })
  // ...
}
```

> 注意：nuqs 在非 Next.js 项目中不需要 NuqsAdapter，可直接使用 `useQueryState`。

#### 4.5.5 组件迁移清单

现有组件全部可复用，仅需以下调整：

| 组件                   | 调整内容                                    |
| ---------------------- | ------------------------------------------- |
| `providers.tsx`        | 移除 NuqsAdapter，改用 BrowserRouter        |
| `dashboard-layout.tsx` | 无变化 (nuqs API 不变)                      |
| `app-sidebar.tsx`      | 无变化                                      |
| `file-table.tsx`       | 无变化                                      |
| `file-grid.tsx`        | 无变化                                      |
| `upload-dialog.tsx`    | 无变化                                      |
| `settings-dialog.tsx`  | **变为可编辑** — PUT 调用现在成功 (KV 可用) |
| `breadcrumb-nav.tsx`   | 无变化                                      |
| `view-toggle.tsx`      | 无变化                                      |
| `ui/**`                | 全部无变化 (shadcn/ui 独立于 Next.js)       |

#### 4.5.6 fetch 封装调整

```tsx
// src/lib/http/client.ts — 移除 Next.js 特有逻辑
export class ApiRequestError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiRequestError(body.error || res.statusText, res.status)
  }
  return res.json()
}
```

移除：

- `requestEnvelope` — 不再使用 Next.js 特有的 `no-store` header
- `createRequestContext` / `requestId` — 简化，不加 `x-request-id`

保留：

- `ApiRequestError` 类
- `requestJson<T>` 泛型 fetch

### 4.6 API 响应格式统一

所有 API (Edge + Cloud) 统一使用：

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

```json
{
  "success": false,
  "data": null,
  "error": "ERROR_CODE"
}
```

---

## 5. KV 绑定配置

### 5.1 控制台步骤

1. 登录 EdgeOne Pages 控制台
2. 进入 "KV 存储" → "Apply Now" 启用
3. 创建 namespace，命名为 `coshub_kv`
4. 绑定到项目，设置全局变量名：`coshub_kv`
5. 在环境变量中设置 `AUTH_SECRET`、`COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_REGION`

### 5.2 KV 键名设计

| 键名              | 值                            | 说明                  |
| ----------------- | ----------------------------- | --------------------- |
| `access_password` | string                        | 登录密码 (优先于 env) |
| `cos_cdn_domain`  | string                        | CDN 域名 (优先于 env) |
| `rate:login:{ip}` | JSON `{ count, windowStart }` | 登录频率限制          |

---

## 6. 环境变量

| 变量              | 必填 | 使用位置                         | 说明                         |
| ----------------- | ---- | -------------------------------- | ---------------------------- |
| `COS_SECRET_ID`   | Yes  | Cloud Functions                  | 腾讯云 SecretId              |
| `COS_SECRET_KEY`  | Yes  | Cloud Functions                  | 腾讯云 SecretKey             |
| `COS_REGION`      | Yes  | Cloud Functions                  | COS 区域 (默认 ap-guangzhou) |
| `COS_CDN_DOMAIN`  | No   | Cloud Functions + Edge Functions | CDN 域名 (KV 优先)           |
| `ACCESS_PASSWORD` | Yes  | Edge Functions                   | 登录密码 (KV 优先)           |
| `AUTH_SECRET`     | Yes  | Middleware + Edge Functions      | JWT 签名密钥 (≥32字符)       |

> KV 值优先于 env 值。首次部署时从 env 读取，之后可通过 Settings API 写入 KV 覆盖。

---

## 7. 项目配置文件

### 7.1 edgeone.json

```json
{
  "build": {
    "command": "pnpm build",
    "outputDirectory": "dist"
  }
}
```

> `dist` 是 Vite 默认输出目录。

### 7.2 vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
  },
})
```

### 7.3 tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] },
    "baseUrl": "."
  },
  "include": ["src"]
}
```

### 7.4 package.json 关键依赖

```json
{
  "name": "coshub",
  "version": "0.2.0",
  "type": "module",
  "scripts": {
    "dev": "edgeone pages dev",
    "dev:frontend": "vite",
    "build": "vite build",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write src/"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.x",
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-virtual": "^3.x",
    "nuqs": "^2.x",
    "zod": "^3.x",
    "cos-nodejs-sdk-v5": "^2.x",
    "express": "^4.x",
    "react-dropzone": "^14.x",
    "lucide-react": "^0.x",
    "class-variance-authority": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-tooltip": "latest",
    "@radix-ui/react-separator": "latest",
    "@radix-ui/react-label": "latest",
    "@radix-ui/react-slot": "latest",
    "sonner": "latest"
  },
  "devDependencies": {
    "vite": "^6.x",
    "@vitejs/plugin-react": "^4.x",
    "@tailwindcss/vite": "^4.x",
    "tailwindcss": "^4.x",
    "typescript": "^5.x",
    "@types/react": "^19.x",
    "@types/react-dom": "^19.x",
    "eslint": "^9.x",
    "prettier": "^3.x"
  }
}
```

---

## 8. 逐步实现顺序（AI Agent 执行指南）

> 按此顺序实现可确保每一步都可验证，不依赖未完成的部分。

### Phase 0: 项目初始化

**步骤 0.1** — 清空当前项目，创建新骨架

- 删除 `src/app/` (Next.js App Router)
- 删除 `next.config.ts`
- 删除 `next-env.d.ts`
- 删除 `src/components/providers.tsx` (将重写)
- 删除 `src/lib/kv.ts` (KV 逻辑转移到 Edge Functions)
- 删除 `src/lib/server/` (服务器日志)
- 删除 `src/lib/http/response.ts`、`validate.ts` (Cloud Functions 用 Zod 内联)
- 删除 `src/features/auth/server/` (改用 Edge Functions)
- 删除 `src/features/cos/server/` (改用 Cloud Functions)
- 删除 `src/features/settings/` (改用 Edge Functions)
- 删除 `src/app/login/page.tsx` (改为 SPA 路由)
- 删除 `src/app/page.tsx`、`src/app/layout.tsx` (改为 SPA)

**步骤 0.2** — 创建配置文件

- 创建 `vite.config.ts` (如 §7.2)
- 更新 `tsconfig.json` (如 §7.3)
- 更新 `package.json` — 移除 Next.js 依赖，添加 Vite/React Router/Express
- 创建 `edgeone.json` (如 §7.1)
- 创建 `index.html` 入口 (如 §4.5.1)
- 更新 `postcss.config.mjs` (Vite + Tailwind v4)

**步骤 0.3** — 安装依赖

```bash
pnpm install
```

**验证**：`pnpm build` 可运行 (Vite 构建空项目)

---

### Phase 1: 前端骨架

**步骤 1.1** — 创建 SPA 入口

- `src/main.tsx` — React + BrowserRouter + QueryClientProvider (如 §4.5.2)
- `src/app.tsx` — 路由定义 (如 §4.5.3)
- `src/styles/globals.css` — 移入 `src/app/globals.css` 的 Tailwind v4 内容

**步骤 1.2** — 创建页面组件

- `src/pages/dashboard.tsx` — AuthGuard 包裹 + DashboardLayout (如 §4.5.4)
- `src/pages/login.tsx` — 登录页面 (复用现有逻辑，改用 react-router-dom Navigate)

**步骤 1.3** — 创建 AuthGuard

- `src/features/auth/auth-guard.tsx` — 客户端认证守卫 (如 §4.5.3)

**步骤 1.4** — 移动并调整现有组件

- `src/components/providers.tsx` → 重写为 SPA 版 (移除 NuqsAdapter)
- `src/components/ui/**` → 保持不变
- `src/components/app-sidebar.tsx` → 保持不变
- `src/components/dashboard-layout.tsx` → 保持不变 (nuqs 用法不变)
- `src/components/file-table.tsx` → 保持不变
- `src/components/file-grid.tsx` → 保持不变
- `src/components/upload-dialog.tsx` → 保持不变
- `src/components/breadcrumb-nav.tsx` → 保持不变
- `src/components/view-toggle.tsx` → 保持不变
- `src/components/settings-dialog.tsx` → **修改为可编辑** (PUT 不再 503)
- `src/components/file-grid.tsx` → 保持不变

**步骤 1.5** — 移动并调整 hooks/lib

- `src/hooks/useObjects.ts` → 保持不变
- `src/hooks/use-mobile.ts` → 保持不变
- `src/lib/utils.ts` → 保持不变
- `src/lib/types.ts` → 保持不变
- `src/lib/thumbnail.ts` → 保持不变
- `src/lib/http/client.ts` → 简化 (如 §4.5.6)
- `src/features/auth/client/auth.api.ts` → 保持不变 (fetch 调用不变)
- `src/features/cos/client/cos.api.ts` → 保持不变
- `src/features/cos/types.ts` → 保持不变

**验证**：`pnpm build` 成功，SPA 可在浏览器加载 (无 API 功能但有骨架 UI)

---

### Phase 2: Middleware

**步骤 2.1** — 创建 `middleware.js`

- JWT 验证逻辑 (Web Crypto API)
- matcher 配置排除 `/api/auth/*`
- 401 响应返回标准格式

**验证**：`edgeone pages dev` 启动后，无 cookie 访问 `/api/cos/buckets` 返回 401

---

### Phase 3: Edge Functions — Auth

**步骤 3.1** — 创建 `edge-functions/api/auth/check.js`

- 读取 cookie，验证 JWT，返回 `{ authenticated: true/false }`

**步骤 3.2** — 创建 `edge-functions/api/auth/login.js`

- Zod 等价的手动校验 (V8 无 npm)
- KV rate-limit
- KV 密码校验 (fallback env)
- Web Crypto JWT 签发
- Set-Cookie

**步骤 3.3** — 创建 `edge-functions/api/auth/logout.js`

- 清除 cookie

**验证**：登录流程完整可用 — 密码校验 → JWT → cookie → check 返回 authenticated

---

### Phase 4: Edge Functions — Settings

**步骤 4.1** — 创建 `edge-functions/api/settings/index.js`

- onRequestGet: KV 读取 + env fallback
- onRequestPut: KV 写入

**验证**：GET 返回配置，PUT 可修改并生效

---

### Phase 5: Cloud Functions — COS API

**步骤 5.1** — 创建 `cloud-functions/api/[[default]].js`

Express app 完整实现以下路由：

| 路由              | 方法   | 实现要点                                            |
| ----------------- | ------ | --------------------------------------------------- |
| `/cos/buckets`    | GET    | `cos.getService()` → BucketItem[]                   |
| `/cos/cdn-domain` | GET    | 读取 `process.env.COS_CDN_DOMAIN`                   |
| `/cos/objects`    | GET    | `cos.getBucket()` → 文件/文件夹列表                 |
| `/cos/objects`    | DELETE | `cos.deleteMultipleObject()` 批量删除               |
| `/cos/objects`    | PUT    | `cos.putObjectCopy()` + `cos.deleteObject()` 重命名 |
| `/cos/objects`    | POST   | `cos.putObject()` 创建文件夹                        |
| `/cos/url`        | GET    | `cos.getObjectUrl()` 预签名 URL                     |
| `/cos/url`        | POST   | CDN URL 拼接                                        |

每个路由：

- 从 `process.env` 创建 COS 客户端
- Zod 校验请求参数 (在 Express 中间件或路由内)
- try/catch 包裹
- 返回统一 `{ success, data, error }` 格式

**步骤 5.2** — 确保依赖安装

- `cos-nodejs-sdk-v5` 在 `package.json` 中
- `express` 在 `package.json` 中
- `pnpm install`

**验证**：完整 COS 操作流程 — 列桶 → 列文件 → 上传 → 下载 → 重命名 → 删除

---

### Phase 6: 前端整合 + Settings 增强

**步骤 6.1** — 更新 Settings Dialog

- 支持编辑密码和 CDN 域名
- PUT 请求不再 503
- 显示"配置来源: KV"而非"不可用"

**步骤 6.2** — 验证全流程

- 登录 → 浏览桶 → 导航文件夹 → 上传 → 下载 → 预览 → 重命名 → 删除 → 修改配置 → 登出

**步骤 6.3** — 添加 404 页面

- `src/pages/not-found.tsx` — SPA 404

---

### Phase 7: 优化 + 收尾

**步骤 7.1** — 性能优化

- Vite 构建配置：代码分割、压缩
- 静态资源缓存 (EdgeOne Pages CDN 自动)
- TanStack Virtual 调优

**步骤 7.2** — 安全加固

- CSP header (可通过 middleware 添加)
- CORS 配置 (Express 中间件)
- 输入校验完善 (Zod schemas 在 Cloud Functions)

**步骤 7.3** — 清理

- 移除未使用依赖 (next-themes, JSZip, next 相关)
- 移除未使用文件
- 添加 `.env.example`

**步骤 7.4** — 文档更新

- 更新 README (部署步骤、环境变量、KV 配置)

**步骤 7.5** — 最终验证

```bash
pnpm lint
pnpm typecheck
pnpm build
edgeone pages dev   # 本地验证全流程
```

---

## 9. 关键注意事项

### 9.1 Edge Functions 约束

| 约束                     | 影响                                           |
| ------------------------ | ---------------------------------------------- |
| 无 npm 包                | Auth 不用 jose，改用 Web Crypto API            |
| 无 Node.js built-ins     | 不用 `crypto` (Node)，用 `crypto.subtle` (Web) |
| 代码 ≤ 5MB               | Auth + Settings 逻辑足够轻量                   |
| CPU ≤ 200ms              | Auth/Settings 操作都在毫秒级                   |
| `Response.json()` 不可用 | 必须用 `new Response(JSON.stringify(...))`     |

### 9.2 Cloud Functions 约束

| 约束              | 影响                                     |
| ----------------- | ---------------------------------------- |
| Node.js v20       | COS SDK 兼容 ✅                          |
| body ≤ 6MB        | 上传预签名 URL 方案不受限 (上传直连 COS) |
| wall clock ≤ 120s | COS 操作足够快 ✅                        |
| 无 KV             | COS 操作不需要 KV ✅                     |

### 9.3 Middleware 约束

| 约束               | 影响                                 |
| ------------------ | ------------------------------------ |
| V8 runtime         | 同 Edge Functions，只能用 Web Crypto |
| 必须轻量           | 只做 JWT 验证，不做业务逻辑 ✅       |
| Next.js 项目不能用 | 我们已脱离 Next.js ✅                |

### 9.4 前端特有注意事项

- **SPA 没有 SSR** — 首屏加载需 JS 执行，SEO 不重要 (管理面板)
- **无 Server Component** — 认证检查改用客户端 AuthGuard
- **Cookie domain** — SPA 和 API 同域，cookie 无跨域问题
- **路由** — React Router 替代 Next.js App Router
- **nuqs** — 独立模式，不需要 NuqsAdapter

---

## 10. 与现有项目的差异对照

| 方面         | Next.js 版                    | EdgeOne Pages 版                     |
| ------------ | ----------------------------- | ------------------------------------ |
| 构建工具     | Next.js built-in              | Vite                                 |
| 路由         | App Router (Server Component) | React Router (SPA)                   |
| 认证检查     | Server Component 读 cookie    | Middleware 拦截 + 客户端 AuthGuard   |
| Auth API     | Next.js API Route (Node.js)   | Edge Function (V8 + KV + Web Crypto) |
| COS API      | Next.js API Route (Node.js)   | Cloud Function (Express + COS SDK)   |
| Settings API | Next.js API Route (503)       | Edge Function (KV 可读写) ✅         |
| Rate-limit   | 内存 Map                      | KV 存储 ✅                           |
| JWT 库       | jose (npm)                    | Web Crypto API (内置)                |
| KV 访问      | ❌ 不可用                     | ✅ Edge Functions 全局变量           |
| URL 状态     | nuqs + NuqsAdapter            | nuqs 独立模式                        |
| 静态资源     | Next.js SSR/ISR               | Vite SPA (纯静态)                    |

---

## 11. 文件迁移映射

| 原文件                                 | 新位置/状态                            | 说明                           |
| -------------------------------------- | -------------------------------------- | ------------------------------ |
| `src/app/layout.tsx`                   | `src/main.tsx`                         | 根组件重写                     |
| `src/app/page.tsx`                     | `src/pages/dashboard.tsx`              | 改为 SPA 页面 + AuthGuard      |
| `src/app/login/page.tsx`               | `src/pages/login.tsx`                  | 改为 SPA 页面                  |
| `src/app/globals.css`                  | `src/styles/globals.css`               | 移动位置                       |
| `src/app/api/auth/*/route.ts`          | `edge-functions/api/auth/*.js`         | 改用 Edge Functions            |
| `src/app/api/cos/*/route.ts`           | `cloud-functions/api/[[default]].js`   | 改用 Express                   |
| `src/app/api/settings/route.ts`        | `edge-functions/api/settings/index.js` | 改用 Edge Functions + KV       |
| `src/components/providers.tsx`         | 重写                                   | 移除 NuqsAdapter               |
| `src/components/dashboard-layout.tsx`  | 保持                                   | nuqs 用法不变                  |
| `src/components/settings-dialog.tsx`   | 修改                                   | 可编辑状态                     |
| `src/components/ui/**`                 | 保持                                   | 全部不变                       |
| `src/features/auth/server/*`           | 删除                                   | 改用 Edge Functions            |
| `src/features/auth/client/auth.api.ts` | 保持                                   | fetch 调用不变                 |
| `src/features/cos/server/*`            | 删除                                   | 改用 Cloud Functions           |
| `src/features/cos/client/cos.api.ts`   | 保持                                   | fetch 调用不变                 |
| `src/features/cos/types.ts`            | 保持                                   | 类型定义不变                   |
| `src/features/settings/*`              | 删除                                   | 改用 Edge Functions            |
| `src/lib/cos.ts`                       | 删除                                   | COS 逻辑转移到 Cloud Functions |
| `src/lib/kv.ts`                        | 删除                                   | KV 逻辑转移到 Edge Functions   |
| `src/lib/types.ts`                     | 保持                                   | 类型不变                       |
| `src/lib/utils.ts`                     | 保持                                   | 工具函数不变                   |
| `src/lib/thumbnail.ts`                 | 保持                                   | 缩略图逻辑不变                 |
| `src/lib/http/client.ts`               | 简化                                   | 移除 Next.js 特有逻辑          |
| `src/lib/http/response.ts`             | 删除                                   | 不再需要                       |
| `src/lib/http/validate.ts`             | 删除                                   | Cloud Functions 内联 Zod       |
| `src/lib/server/logger.ts`             | 删除                                   | 不再需要                       |
| `src/hooks/useObjects.ts`              | 保持                                   | 不变                           |
| `src/hooks/use-mobile.ts`              | 保持                                   | 不变                           |
| `next.config.ts`                       | 删除                                   | 不再用 Next.js                 |
| `middleware.js`                        | 新建                                   | EdgeOne Pages Middleware       |

---

## 12. 验证清单

完成所有 Phase 后，逐项验证：

- [ ] `pnpm build` 成功 (Vite 构建 dist/)
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过
- [ ] `edgeone pages dev` 启动成功
- [ ] 登录页面可访问
- [ ] 输入密码可登录，JWT cookie 设置成功
- [ ] 未登录访问主页重定向到 /login
- [ ] 未登录访问 /api/cos/\* 返回 401
- [ ] 已登录可列出桶列表
- [ ] 已登录可浏览文件夹
- [ ] 已登录可上传文件 (预签名 PUT)
- [ ] 已登录可下载文件 (预签名 GET)
- [ ] 已登录可预览图片/视频
- [ ] 已登录可重命名文件
- [ ] 已登录可删除文件 (单个/批量)
- [ ] 已登录可创建文件夹
- [ ] 已登录可查看 Settings
- [ ] 已登录可修改 Settings (密码、CDN)
- [ ] 修改密码后新密码生效
- [ ] 修改 CDN 域名后链接使用新域名
- [ ] 登出后 cookie 清除
- [ ] Grid 视图虚拟滚动正常
- [ ] Table 视图排序/筛选正常
- [ ] URL 状态 (bucket, prefix) 刷新后保留
- [ ] 移动端响应式正常
