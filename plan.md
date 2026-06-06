# PicHub 架构升级计划

> CosHub → PicHub：从腾讯云 COS 管理面板升级为 COS + 阿里云 OSS 对象存储管理平台

---

## 一、目标与范围

### 当前状态

CosHub 是一个基于 EdgeOne Pages 的腾讯云 COS 对象存储管理 SPA，当前能力包括：

- 桶列表浏览与切换
- 文件/文件夹浏览，支持表格视图和网格视图
- 上传、下载、删除、重命名、新建文件夹
- 预签名 URL 直传
- CDN 域名访问和 COS CI 缩略图
- JWT 密码认证
- EdgeOne KV 存储 COS 凭证

### 本轮目标

本轮升级只做两件事：

1. 把现有 COS 逻辑抽象成 Provider Adapter 架构，保持 COS 功能不退化。
2. 新增阿里云 OSS Provider，支持与 COS 尽量一致的核心对象管理能力。

### 暂不纳入本轮范围

以下 Provider 只作为后续候选，不进入本轮实现：

| Provider              | 状态     | 原因                                             |
| --------------------- | -------- | ------------------------------------------------ |
| AWS S3                | 后续候选 | 适合下一阶段验证 S3-compatible 体系              |
| MinIO / S3-compatible | 后续候选 | 可复用 S3 Adapter，暂不影响 OSS 优先目标         |
| Azure Blob            | 后续候选 | 上传 headers、container 语义、大文件策略差异较大 |
| Google Cloud Storage  | 后续候选 | Signed URL、服务账号、XML API endpoint 细节较多  |

### 成功标准

- COS 现有功能全部可用。
- OSS 可完成：列 bucket、列对象、上传、下载、删除、重命名、新建文件夹、CDN URL、图片缩略图。
- 前端只调用统一的 `/api/storage/*`，不再直接感知 COS 或 OSS 的 SDK 差异。
- 设置页可以在 COS 与 OSS 之间切换活跃 Provider，并动态显示对应凭证字段。
- 本轮结束后，再新增 S3/MinIO 时只需要新增 Adapter 和 Provider 注册项，不需要重写核心 API。

---

## 二、推荐路线

本项目不建议一开始直接实现六个云厂商。正确路线是先把抽象层做扎实，再用 OSS 作为第一个新增 Provider 验证抽象质量。

### 推荐实施顺序

1. **抽象但不扩张**：先把 COS 从路由入口中抽出来，成为 `CosAdapter`。
2. **统一 API**：把 `/api/cos/*` 改为 `/api/storage/*`。
3. **统一设置模型**：用 Provider Registry 驱动设置页和 KV 存储。
4. **只新增 OSS**：实现 `OssAdapter`，验证第二个 Provider 是否能复用统一接口。
5. **稳定后再考虑 S3/MinIO**：等 COS + OSS 跑稳后，再根据真实需求进入下一阶段。

### 为什么先 OSS

- 用户场景更接近当前 COS 用户群。
- OSS 支持签名 URL，和当前上传/下载模型接近。
- OSS 支持图片处理参数，可以延续缩略图体验。
- 不会像 Azure/GCS 那样过早拉高上传策略复杂度。

---

## 三、目标架构

### 当前架构

```text
Browser ─► /api/cos/* ─► Middleware 注入 COS 凭证 ─► Cloud Function 直接调用 COS SDK
Browser ─► /api/settings ─► Edge Function 读写 KV 中的 COS 配置
```

当前问题：

- API 路径、类型、设置页和 Cloud Function 都硬绑定 COS。
- 新增 Provider 时会侵入多处前端和后端代码。
- 缩略图、上传、CDN 等策略目前默认都按 COS 处理。

### 目标架构

```text
Browser ─► /api/storage/* ─► Middleware 注入 activeProvider + credentials
                                      │
                                      ▼
                              Cloud Function Router
                                      │
                                      ▼
                              Storage Adapter Factory
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                    CosAdapter                 OssAdapter
```

核心原则：

- 前端面向统一 storage API。
- Cloud Function 面向统一 `StorageProvider` 接口。
- Provider 差异封装在 Adapter 内部。
- COS 是默认 Provider，OSS 是本轮唯一新增 Provider。

---

## 四、统一 Provider 接口

### Provider ID

```typescript
type StorageProviderId = 'cos' | 'oss'
```

后续如果新增 S3/MinIO/Azure/GCS，再扩展这个联合类型。

### 前端 Provider 配置

```typescript
interface StorageProviderConfig {
  id: StorageProviderId
  label: string
  credentialFields: CredentialField[]
  hasThumbnail: boolean
  hasCdn: boolean
}

interface CredentialField {
  key: string
  label: string
  type: 'text' | 'password' | 'select'
  placeholder?: string
  options?: { value: string; label: string }[]
  required: boolean
  mask?: boolean
}
```

### 后端统一操作接口

```javascript
// cloud-functions/lib/storage-provider.js

export class StorageProvider {
  constructor(credentials) {
    this.credentials = credentials
  }

  async listBuckets() {
    throw new Error('Not implemented')
  }

  async listObjects(bucket, prefix, options = {}) {
    throw new Error('Not implemented')
  }

  async deleteObjects(bucket, keys) {
    throw new Error('Not implemented')
  }

  async renameObject(bucket, oldKey, newKey) {
    throw new Error('Not implemented')
  }

  async createFolder(bucket, path) {
    throw new Error('Not implemented')
  }

  async getSignedUrl(bucket, key, method, options = {}) {
    throw new Error('Not implemented')
  }

  getCdnUrl(key, cdnDomain) {
    if (!cdnDomain || !key) return ''
    const normalizedDomain = cdnDomain.startsWith('http') ? cdnDomain : `https://${cdnDomain}`
    return normalizedDomain.endsWith('/')
      ? `${normalizedDomain}${encodeURIComponent(key)}`
      : `${normalizedDomain}/${encodeURIComponent(key)}`
  }
}
```

### 统一返回类型

前端和后端都使用 camelCase，避免继续暴露 COS SDK 的 PascalCase 字段。

```typescript
interface BucketInfo {
  name: string
  region: string
  creationDate: string
}

interface FileItem {
  key: string
  name: string
  size: number
  lastModified: string
  isFolder: boolean
  etag?: string
}

interface FolderItem {
  prefix: string
}

interface ObjectsResult {
  files: FileItem[]
  folders: FolderItem[]
}
```

---

## 五、API 路由设计

### 新 API 路径

| 路径                           | 方法   | 操作                                                     |
| ------------------------------ | ------ | -------------------------------------------------------- |
| `/api/storage/providers`       | GET    | 获取支持的 Provider 列表和字段配置                       |
| `/api/storage/active-provider` | GET    | 获取当前活跃 Provider                                    |
| `/api/storage/buckets`         | GET    | 列出 bucket                                              |
| `/api/storage/objects`         | GET    | 列出对象，query: `bucket`, `prefix`                      |
| `/api/storage/objects`         | DELETE | 删除对象，body: `bucket`, `keys`                         |
| `/api/storage/objects`         | PUT    | 重命名对象，body: `bucket`, `oldKey`, `newKey`           |
| `/api/storage/objects`         | POST   | 新建文件夹，body: `bucket`, `path`                       |
| `/api/storage/url`             | GET    | 获取上传或下载签名 URL，query: `bucket`, `key`, `method` |
| `/api/storage/url`             | POST   | 获取 CDN URL，body: `key`                                |
| `/api/storage/cdn-domain`      | GET    | 获取当前 Provider 的 CDN 域名                            |

### 兼容策略

为了降低迁移风险，建议本轮保留旧 `/api/cos/*` 到新 `/api/storage/*` 的短期兼容：

- 前端全部改用 `/api/storage/*`。
- 后端可以保留 `/cos/*` 路由代理到同一 handler 一段时间。
- README 标注 `/api/cos/*` 已废弃。
- 下一次大版本再删除旧路径。

---

## 六、KV 存储模型

### 当前模型

```text
cos_secret_id
cos_secret_key
cos_region
cos_cdn_domain
```

### 目标模型

```text
pichub_active_provider → "cos" | "oss"

pichub_provider_cos_secret_id
pichub_provider_cos_secret_key
pichub_provider_cos_region
pichub_provider_cos_cdn_domain

pichub_provider_oss_access_key_id
pichub_provider_oss_access_key_secret
pichub_provider_oss_region
pichub_provider_oss_cdn_domain
```

### 迁移策略

为保护现有用户，不能直接丢弃旧 COS 配置。

推荐实现：

1. Settings 或 Init 首次读取时，如果新 key 不存在但旧 `cos_*` 存在，则自动迁移到 `pichub_provider_cos_*`。
2. `pichub_active_provider` 缺失时默认设置为 `cos`。
3. 迁移成功后可保留旧 key，不强制删除，避免误伤。

### KV 绑定名

本轮建议先继续使用现有 `coshub_kv` 绑定名，降低部署风险。

品牌重命名到 `pichub_kv` 可以作为后续独立任务处理。若本轮同时改绑定名，会要求用户在 EdgeOne 控制台重新绑定 KV，容易把架构升级和部署迁移搅在一起。

---

## 七、Middleware 设计

### 匹配范围

```javascript
export const config = {
  matcher: ['/api/storage/:path*', '/api/settings/:path*'],
}
```

如保留旧路径兼容，可临时加入：

```javascript
matcher: ['/api/storage/:path*', '/api/cos/:path*', '/api/settings/:path*']
```

### 凭证注入

推荐注入 JSON 凭证，避免每个 Provider 都增加一组 header。

```javascript
return context.next({
  headers: {
    'x-auth-user': 'authenticated',
    'x-pichub-provider': activeProvider,
    'x-pichub-credentials': JSON.stringify(credentials),
  },
})
```

### 安全要求

- 继续在 Middleware 里做 JWT 校验。
- `verifyJWT` 需要对畸形 token 做 `try/catch`，避免 500。
- Cloud Function 不应信任客户端传入的 provider 或 credentials，只读取 Middleware 注入的 header。
- `x-pichub-credentials` 只在服务端内部转发，不返回前端。

---

## 八、Provider 注册表

### 前端注册表

```typescript
// src/features/providers/provider-registry.ts

export const PROVIDER_REGISTRY: Record<StorageProviderId, StorageProviderConfig> = {
  cos: {
    id: 'cos',
    label: '腾讯云 COS',
    hasThumbnail: true,
    hasCdn: true,
    credentialFields: [
      { key: 'secret_id', label: 'SecretId', type: 'password', required: true, mask: true },
      { key: 'secret_key', label: 'SecretKey', type: 'password', required: true, mask: true },
      {
        key: 'region',
        label: 'Region',
        type: 'select',
        required: true,
        options: [
          { value: 'ap-guangzhou', label: '广州' },
          { value: 'ap-shanghai', label: '上海' },
          { value: 'ap-beijing', label: '北京' },
          { value: 'ap-hongkong', label: '香港' },
          { value: 'ap-singapore', label: '新加坡' },
        ],
      },
      { key: 'cdn_domain', label: 'CDN 域名', type: 'text', required: false },
    ],
  },
  oss: {
    id: 'oss',
    label: '阿里云 OSS',
    hasThumbnail: true,
    hasCdn: true,
    credentialFields: [
      { key: 'access_key_id', label: 'AccessKey ID', type: 'text', required: true },
      {
        key: 'access_key_secret',
        label: 'AccessKey Secret',
        type: 'password',
        required: true,
        mask: true,
      },
      {
        key: 'region',
        label: 'Region',
        type: 'select',
        required: true,
        options: [
          { value: 'oss-cn-hangzhou', label: '杭州' },
          { value: 'oss-cn-shanghai', label: '上海' },
          { value: 'oss-cn-beijing', label: '北京' },
          { value: 'oss-cn-shenzhen', label: '深圳' },
          { value: 'oss-cn-hongkong', label: '香港' },
        ],
      },
      { key: 'cdn_domain', label: 'CDN 域名', type: 'text', required: false },
    ],
  },
}
```

### 后端注册表

后端也需要一份 Provider 字段定义，用于 Middleware 读取 KV 和校验必填字段。

```javascript
export const PROVIDER_FIELDS = {
  cos: ['secret_id', 'secret_key', 'region', 'cdn_domain'],
  oss: ['access_key_id', 'access_key_secret', 'region', 'cdn_domain'],
}
```

前后端字段定义必须保持一致。后续可以考虑把 Provider registry 放到共享 JSON 文件，避免重复维护。

---

## 九、Cloud Function 结构

```text
cloud-functions/
├── lib/
│   ├── storage-provider.js
│   ├── adapter-cos.js
│   ├── adapter-oss.js
│   ├── create-provider.js
│   └── envelope.js
└── api/
    └── [[default]].js
```

### create-provider

```javascript
export async function createProvider(providerId, credentials) {
  switch (providerId) {
    case 'cos': {
      const { CosAdapter } = await import('./adapter-cos.js')
      return new CosAdapter(credentials)
    }
    case 'oss': {
      const { OssAdapter } = await import('./adapter-oss.js')
      return new OssAdapter(credentials)
    }
    default:
      throw new Error(`Unsupported provider: ${providerId}`)
  }
}
```

使用动态 import 的原因：

- 避免 Cloud Function 冷启动时加载所有 SDK。
- 后续新增 Provider 时更容易控制依赖体积。
- 当前只需要 `cos-nodejs-sdk-v5` 和 `ali-oss`。

### CosAdapter

从现有 `cloud-functions/api/[[default]].js` 抽取逻辑：

- `getService` → `listBuckets`
- `getBucket` → `listObjects`
- `deleteObject` / `deleteMultipleObject` → `deleteObjects`
- `putObjectCopy` + `deleteObject` → `renameObject`
- `putObject` 空 body → `createFolder`
- `getObjectUrl` → `getSignedUrl`

### OssAdapter

建议实现方式：

- 使用 `ali-oss`。
- `listBuckets` 映射为统一 `BucketInfo[]`。
- `list` 使用 `prefix` 和 `delimiter: '/'` 实现目录浏览。
- `delete` / `deleteMulti` 实现删除。
- `copy` + `delete` 实现重命名。
- `put` 空内容创建目录对象。
- `signatureUrl(key, { method: 'GET' | 'PUT' })` 生成签名 URL。

注意事项：

- OSS region 一般类似 `oss-cn-hangzhou`。
- OSS SDK 的 bucket 操作通常需要指定当前 bucket。列 bucket 与对象操作的 client 初始化方式可能不同，需要 Adapter 内部处理。
- 如果某些 bucket 位于不同 region，MVP 先以用户配置的 region 作为操作 region。跨 region bucket 后续再优化。

---

## 十、前端改造

### 目录结构

```text
src/
├── features/
│   ├── auth/
│   ├── init/
│   ├── settings/
│   ├── storage/
│   │   └── client/
│   │       └── storage.api.ts
│   └── providers/
│       ├── client/
│       │   └── providers.api.ts
│       └── provider-registry.ts
├── hooks/
│   ├── useObjects.ts
│   └── useProvider.ts
├── lib/
│   ├── types.ts
│   ├── thumbnail.ts
│   └── upload-strategy.ts
└── components/
    ├── settings-dialog.tsx
    ├── provider-switcher.tsx
    ├── app-sidebar.tsx
    ├── file-grid.tsx
    ├── file-table.tsx
    └── upload-dialog.tsx
```

### storage.api.ts

把现有 `src/features/cos/client/cos.api.ts` 改为统一 API：

```typescript
export async function getBuckets(): Promise<BucketInfo[]> {
  return requestJson<BucketInfo[]>('/api/storage/buckets')
}

export async function getObjects(bucket: string, prefix = ''): Promise<ObjectsResult> {
  const params = new URLSearchParams({ bucket, prefix })
  return requestJson<ObjectsResult>(`/api/storage/objects?${params}`)
}
```

### Settings Dialog

设置页从固定 COS 表单改成动态表单：

- 顶部 Provider 选择器：腾讯云 COS / 阿里云 OSS。
- 根据 `credentialFields` 渲染字段。
- 密钥字段显示为 `******`，留空表示不更新。
- 切换 active provider 后刷新 bucket 列表和当前路径状态。

### Provider Switcher

建议在 Sidebar 顶部加入 Provider Switcher：

- 显示当前 Provider。
- 支持快速切换 COS / OSS。
- 切换后清空当前 bucket 和 prefix。
- 触发 `queryClient.invalidateQueries()` 刷新 bucket 列表。

---

## 十一、缩略图策略

不同 Provider 的图片处理参数不同，不能继续写死 COS CI。

```typescript
type ThumbnailStrategy = (baseUrl: string, etag?: string, size?: number) => string

const THUMBNAIL_STRATEGIES: Record<StorageProviderId, ThumbnailStrategy> = {
  cos: (url, etag, size = 280) => {
    const cleanEtag = etag?.replace(/"/g, '') || ''
    const separator = url.includes('?') ? '&' : '?'
    const version = cleanEtag ? `&v=${cleanEtag}` : ''
    return `${url}${separator}imageMogr2/thumbnail/${size}x${size}${version}`
  },
  oss: (url, etag, size = 280) => {
    const cleanEtag = etag?.replace(/"/g, '') || ''
    const separator = url.includes('?') ? '&' : '?'
    const version = cleanEtag ? `&v=${cleanEtag}` : ''
    return `${url}${separator}x-oss-process=image/resize,m_fill,w_${size},h_${size}${version}`
  },
}
```

MVP 只处理 COS 和 OSS。后续 S3/MinIO 等无内置图片处理的 Provider，可以返回原图或关闭缩略图。

---

## 十二、上传策略

COS 和 OSS 都可以继续走预签名 URL 直传：

```typescript
interface UploadTarget {
  url: string
  method: 'PUT'
  headers: Record<string, string>
}
```

推荐后端把 `/api/storage/url?method=PUT` 的返回值从单纯 string 扩展为：

```typescript
{
  url: string
  method: 'PUT'
  headers: {
    'Content-Type': string
  }
}
```

短期兼容策略：

- 第一阶段仍返回 `{ url }`，前端按当前逻辑上传。
- 引入 OSS 后改为 `{ url, method, headers }`，让 Provider 有机会控制上传 header。
- COS 和 OSS 默认都使用 `Content-Type`。

这样后续接 Azure 时，可以自然返回 `x-ms-blob-type: BlockBlob`，不用重写 UploadDialog。

---

## 十三、初始化与设置 API

### InitStatus

```typescript
interface InitStatus {
  initialized: boolean
  env: {
    authSecret: boolean
    accessPassword: boolean
  }
  kv: {
    available: boolean
    activeProvider: StorageProviderId | null
    providerReady: boolean
    providers: Record<StorageProviderId, boolean>
  }
}
```

### Setup 页面流程

1. 检查 `AUTH_SECRET` 和 `ACCESS_PASSWORD`。
2. 未登录则要求输入访问密码。
3. 选择 Provider：腾讯云 COS 或阿里云 OSS。
4. 填写对应凭证。
5. 保存后进入 Dashboard。

---

## 十四、分阶段执行计划

### Phase 0：迁移铺垫与兼容保护（0.5-1 天）

目标：不改功能，只为后续迁移降低风险。

| 任务                    | 说明                                |
| ----------------------- | ----------------------------------- |
| 增加 JWT 解析容错       | 畸形 cookie 返回 401，不返回 500    |
| 梳理现有 COS API 调用点 | 记录所有 `/api/cos/*` 前后端引用    |
| 确认 KV 迁移策略        | 新 key 缺失时兼容旧 `cos_*`         |
| 保持 `coshub_kv` 绑定名 | 本轮不强制用户改 EdgeOne 控制台绑定 |

验证：`pnpm lint && pnpm typecheck && pnpm build`。

### Phase 1：统一 storage API + COS Adapter（2-3 天）

目标：架构抽象完成，但功能仍只跑 COS。

| 任务                                    | 说明                                        |
| --------------------------------------- | ------------------------------------------- |
| 新增 `StorageProvider` 接口             | `cloud-functions/lib/storage-provider.js`   |
| 新增 `CosAdapter`                       | 从现有 Cloud Function 抽取 COS 逻辑         |
| 新增 `create-provider`                  | 根据 `x-pichub-provider` 创建 Adapter       |
| 重构 Cloud Function 路由                | `/storage/*` 调用统一 Provider 接口         |
| Middleware 注入 JSON credentials        | `x-pichub-provider`, `x-pichub-credentials` |
| 前端 `cos.api.ts` 改为 `storage.api.ts` | API 路径切到 `/api/storage/*`               |
| 统一前端类型                            | `BucketInfo`, `FileItem`, `ObjectsResult`   |
| 保留旧 `/api/cos/*` 兼容                | 临时代理到同一 handler                      |

验证：COS 桶列表、文件浏览、上传、下载、删除、重命名、新建文件夹全部正常。

### Phase 2：Provider Registry + 动态 Settings（2-3 天）

目标：UI 和 KV 模型支持 COS / OSS 两个 Provider，但 OSS Adapter 可以暂未完成。

| 任务                         | 说明                                    |
| ---------------------------- | --------------------------------------- |
| 新增 Provider Registry       | 只注册 `cos` 和 `oss`                   |
| Settings API 改造            | 支持读取/保存任意 Provider 字段         |
| Init API 改造                | 检查 active provider 是否 ready         |
| Settings Dialog 动态化       | 根据 Provider 字段渲染表单              |
| Setup 页面动态化             | 选择 Provider 后填写凭证                |
| Sidebar 加 Provider Switcher | 支持 COS / OSS 切换                     |
| KV 自动迁移                  | 旧 `cos_*` → 新 `pichub_provider_cos_*` |

验证：COS 配置读取和保存正常；可以切换到 OSS 并保存 OSS 凭证，但未必能完成对象操作。

### Phase 3：阿里云 OSS Adapter（3-5 天）

目标：OSS 成为本轮唯一新增 Provider。

| 任务               | 说明                                                         |
| ------------------ | ------------------------------------------------------------ |
| 安装 `ali-oss`     | 新增 OSS SDK 依赖                                            |
| 实现 `OssAdapter`  | listBuckets/listObjects/delete/rename/createFolder/signedUrl |
| 适配 OSS 响应映射  | SDK 响应统一转为 `BucketInfo` / `ObjectsResult`              |
| 适配 OSS CDN URL   | 复用 Provider 基类 `getCdnUrl`                               |
| 适配 OSS 缩略图    | `x-oss-process=image/resize...`                              |
| 适配上传返回值     | 返回 `{ url, method, headers }`                              |
| Mock 增加 OSS 场景 | 方便前端无云账号调试                                         |

验证：OSS 可完成桶列表、对象列表、上传、下载、删除、重命名、新建文件夹、缩略图和 CDN URL。

### Phase 4：收尾、文档与发布（1-2 天）

目标：发布 COS + OSS 版本。

| 任务                  | 说明                                 |
| --------------------- | ------------------------------------ |
| README 更新           | 改为 PicHub，说明本版支持 COS + OSS  |
| EdgeOne 部署说明更新  | 环境变量、KV 绑定、Provider 设置     |
| 错误提示优化          | COS/OSS 常见错误翻译为中文           |
| 删除或标记旧 COS 文案 | UI 中改为动态 Provider 文案          |
| 最终验证              | lint/typecheck/build + 本地 dev 手测 |

验证：新用户可按 README 部署；老用户可继续使用 COS，并可新增 OSS。

---

## 十五、风险与对策

| 风险                      | 影响                   | 对策                                                    |
| ------------------------- | ---------------------- | ------------------------------------------------------- |
| 抽象层过早泛化            | 代码复杂但没有实际收益 | 本轮 `StorageProviderId` 只包含 `cos` 和 `oss`          |
| 旧 COS 凭证迁移失败       | 老用户升级后无法使用   | 新旧 key 兼容读取，迁移只新增不删除                     |
| KV 绑定名变更导致部署失败 | 用户需要重新绑定 KV    | 本轮继续使用 `coshub_kv`，后续再做品牌级迁移            |
| OSS bucket region 差异    | 某些 bucket 操作失败   | MVP 使用用户配置 region，后续再做 bucket-region 缓存    |
| OSS SDK 行为与 COS 不一致 | Adapter 输出不稳定     | Adapter 内统一映射和错误处理，前端不接触 SDK 原始响应   |
| 上传返回结构变更          | UploadDialog 兼容问题  | 先支持 `{ url }` 和 `{ url, method, headers }` 两种响应 |
| 缩略图参数不通用          | 图片预览异常           | COS 和 OSS 分策略生成，失败时回退原始 URL               |

---

## 十六、后续候选路线

COS + OSS 稳定后，再评估是否新增其他 Provider。

推荐顺序：

1. **S3 + MinIO**：作为第二轮，验证 S3-compatible 生态。
2. **Azure Blob**：单独一轮，重点处理 container、SAS、`x-ms-blob-type` 和大文件上传。
3. **Google Cloud Storage**：单独一轮，重点处理 service account JSON、V4 signed URL 和 XML API endpoint。

新增 Provider 的准入标准：

- 能实现统一接口中的核心方法。
- 能通过预签名 URL 或等价机制完成浏览器直传。
- 凭证字段可以被 Provider Registry 表达。
- 错误处理和上传策略不会破坏 COS + OSS 的现有体验。

---

## 十七、里程碑时间线

| Phase    | 预计工期    | 关键产出                          |
| -------- | ----------- | --------------------------------- |
| Phase 0  | 0.5-1 天    | 兼容保护和迁移准备                |
| Phase 1  | 2-3 天      | storage API + COS Adapter         |
| Phase 2  | 2-3 天      | Provider Registry + 动态 Settings |
| Phase 3  | 3-5 天      | 阿里云 OSS Adapter                |
| Phase 4  | 1-2 天      | 文档、错误提示、发布              |
| **总计** | **8-14 天** | **PicHub COS + OSS MVP**          |

---

## 十八、命名策略

本轮不建议把所有 `coshub_*` 一次性改成 `pichub_*`，原因是部署侧 KV 绑定、Cookie、旧用户 session 和 README 都会同时变化，风险高。

推荐拆分：

### 本轮必须改

```text
/api/cos/*                  → /api/storage/*
src/features/cos/           → src/features/storage/
cos.api.ts                  → storage.api.ts
Cloud Function COS 直写逻辑  → CosAdapter
```

### 本轮新增

```text
pichub_active_provider
pichub_provider_cos_*
pichub_provider_oss_*
x-pichub-provider
x-pichub-credentials
```

### 后续品牌迁移再改

```text
coshub_kv       → pichub_kv
coshub_session  → pichub_session
package name    → pichub
CosHub UI 文案   → PicHub
```

如果希望本轮就完成品牌改名，也可以单独增加一个 Phase，但不建议和 OSS Adapter 同时做。

---

## 十九、最终总结

本轮升级的重点不是“一次支持所有云”，而是把 CosHub 改造成可扩展的对象存储管理平台骨架，并用阿里云 OSS 验证这个骨架。

最终交付形态：

- Provider Adapter 架构完成。
- COS 作为默认 Provider 保持稳定。
- OSS 作为本轮唯一新增 Provider 可正常使用。
- 前端 Settings、上传、缩略图、API 类型都进入 Provider-aware 状态。
- S3/MinIO/Azure/GCS 留在后续路线，不污染本轮 MVP。
