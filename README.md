# CosHub

A web management panel for Tencent Cloud COS (Cloud Object Storage).

腾讯云 COS 对象存储 Web 管理面板。

|                                                                                                                              Global / 国际版                                                                                                                              |                                                                                                                                                    China / 国内版                                                                                                                                                    |
| :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| [![Deploy to EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2FYoungLee-coder%2FCosHub&env=ACCESS_PASSWORD,AUTH_SECRET&env-description=Required%20environment%20variables) | [![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?repository-url=https%3A%2F%2Fgithub.com%2FYoungLee-coder%2FCosHub&env=ACCESS_PASSWORD,AUTH_SECRET&env-description=%E5%BF%85%E9%85%8D%E7%8E%AF%E5%9F%83%E5%8F%98%E9%87%8F) |

## Features / 功能特性

- **Password Protection / 密码保护** - Single password authentication with JWT session
- **Multi-Bucket Support / 多存储桶支持** - Switch between buckets
- **File Management / 文件管理** - Upload, download, rename, delete files
- **Folder Navigation / 文件夹导航** - Breadcrumb navigation with URL state sync
- **File Preview / 文件预览** - Preview images and videos
- **Drag & Drop Upload / 拖拽上传** - Upload files with progress indicator
- **Batch Operations / 批量操作** - Select and delete multiple files
- **Custom CDN Domain / 自定义 CDN 域名** - Support custom domain for file links
- **Copy Link / 复制链接** - Copy file URL to clipboard
- **Web Settings / 在线设置** - Configure COS credentials and CDN domain via KV

## Tech Stack / 技术栈

- React 19 + Vite + React Router DOM (SPA)
- EdgeOne Pages (Edge Functions + Cloud Functions + Middleware)
- TypeScript (strict mode)
- Tailwind CSS v4 + shadcn/ui
- TanStack React Query & Table & Virtual
- nuqs (URL state)
- cos-nodejs-sdk-v5
- Zod

## Getting Started / 快速开始

### 1. Install Dependencies / 安装依赖

```bash
pnpm install
```

### 2. Configure Environment Variables / 配置环境变量

Set the two required environment variables in EdgeOne Pages Console → Your Project → Settings → Environment Variables:

在 EdgeOne Pages 控制台 → 你的项目 → 设置 → 环境变量中配置两个必填项：

```env
ACCESS_PASSWORD=your_access_password
AUTH_SECRET=your_random_secret_string_at_least_32_chars
```

| Variable / 变量   | Required / 必填 | Description / 说明                            |
| ----------------- | --------------- | --------------------------------------------- |
| `ACCESS_PASSWORD` | Yes / 是        | Login password / 登录密码                     |
| `AUTH_SECRET`     | Yes / 是        | JWT signing secret (32+ chars) / JWT 签名密钥 |

### 3. Bind EdgeOne KV / 绑定 EdgeOne KV

COS credentials and CDN domain are stored in EdgeOne KV (modifiable via Web Settings). Bind a KV namespace:

COS 凭证和 CDN 域名存储在 EdgeOne KV 中（可通过在线设置修改）。绑定 KV namespace：

1. Go to EdgeOne Pages Console → Your Project → Settings → KV Namespace Binding
2. 进入 EdgeOne Pages 控制台 → 你的项目 → 设置 → KV Namespace 绑定
3. Create or select a KV namespace, set the binding variable name to `coshub_kv`
4. 创建或选择一个 KV namespace，将绑定变量名设为 `coshub_kv`

### 4. Configure COS via Web Settings / 通过在线设置配置 COS

After deployment, log in and go to Settings to configure COS credentials and CDN domain. Alternatively, set them directly in the EdgeOne KV Console.

部署后登录并进入设置页面配置 COS 凭证和 CDN 域名。也可直接在 EdgeOne KV 控制台中写入。

| KV Key           | Required / 必填 | Description / 说明                         |
| ---------------- | --------------- | ------------------------------------------ |
| `cos_secret_id`  | Yes / 是        | Tencent Cloud SecretId / 腾讯云 SecretId   |
| `cos_secret_key` | Yes / 是        | Tencent Cloud SecretKey / 腾讯云 SecretKey |
| `cos_region`     | Yes / 是        | COS Region (e.g. ap-guangzhou) / COS 地域  |
| `cos_cdn_domain` | No / 否         | Custom CDN domain / 自定义 CDN 域名        |

### 5. Run Development Server / 启动开发服务器

```bash
pnpm dev           # EdgeOne Pages local dev server
pnpm dev:frontend  # Vite dev server (frontend only)
```

### 6. Build for Production / 构建生产版本

```bash
pnpm build
```

### 7. Code Quality / 代码质量检查

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Pre-commit checks are powered by Husky + lint-staged after dependencies are installed.

安装依赖后会启用 Husky + lint-staged，在提交前执行最小质量检查。

## Configuration / 配置管理

CosHub separates configuration into two sources — they do not overlap:

CosHub 的配置分为两个来源，两者不重叠：

| Source / 来源 | Variables / 变量                                                  | How to modify / 如何修改                      | Need redeploy / 需重新部署 |
| ------------- | ----------------------------------------------------------------- | --------------------------------------------- | -------------------------- |
| Environment   | `ACCESS_PASSWORD`, `AUTH_SECRET`                                  | EdgeOne Pages Console → Environment Variables | Yes / 是                   |
| EdgeOne KV    | `cos_secret_id`, `cos_secret_key`, `cos_region`, `cos_cdn_domain` | Web Settings page or KV Console               | No / 否                    |

### Web Settings / 在线设置

1. Log in to CosHub → Settings page
2. 登录 CosHub → 设置页面
3. Configure COS SecretId, SecretKey, Region, and CDN domain
4. 配置 COS SecretId、SecretKey、地域和 CDN 域名
5. Changes apply immediately / 更改立即生效

Secret fields are masked as `******`. Enter a new value to update; leave blank to keep the existing value.

密钥字段掩码显示为 `******`。输入新值即可更新，留空则保持不变。

## License

MIT
