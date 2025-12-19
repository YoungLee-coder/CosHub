# CosHub

A modern, high-performance web management panel for Tencent Cloud COS (Cloud Object Storage).

一个现代化、高性能的腾讯云 COS 对象存储 Web 管理面板。

| Global / 国际版 | China / 国内版 |
|:---:|:---:|
| [![Deploy to EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2FYoungLee-coder%2FCosHub&env=COS_SECRET_ID,COS_SECRET_KEY,COS_REGION,ACCESS_PASSWORD,AUTH_SECRET&env-description=COS%20configuration%20and%20authentication%20environment%20variables) | [![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?repository-url=https%3A%2F%2Fgithub.com%2FYoungLee-coder%2FCosHub&env=COS_SECRET_ID,COS_SECRET_KEY,COS_REGION,ACCESS_PASSWORD,AUTH_SECRET&env-description=COS%E9%85%8D%E7%BD%AE%E5%8F%8A%E8%AE%A4%E8%AF%81%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) |

## Features / 功能特性

- **Password Protection / 密码保护** - Single password authentication with JWT session
- **Multi-Bucket Support / 多存储桶支持** - Switch between different buckets easily
- **File Management / 文件管理** - Upload, download, rename, delete files
- **Folder Navigation / 文件夹导航** - Breadcrumb navigation with URL state sync
- **File Preview / 文件预览** - Preview images and videos directly
- **Drag & Drop Upload / 拖拽上传** - Upload files with progress indicator
- **Batch Operations / 批量操作** - Select and delete multiple files
- **Custom CDN Domain / 自定义 CDN 域名** - Support custom domain for file links
- **Copy Link / 复制链接** - Quick copy file URL to clipboard
- **Web Settings / 在线设置** - Configure password and CDN domain via EdgeOne KV storage

## Tech Stack / 技术栈

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- TanStack Query & Table
- nuqs (URL state)
- cos-nodejs-sdk-v5

## Getting Started / 快速开始

### 1. Install Dependencies / 安装依赖

```bash
pnpm install
```

### 2. Configure Environment / 配置环境变量

Copy `.env.local.example` to `.env.local` and fill in your credentials:

复制 `.env.local.example` 为 `.env.local` 并填写配置：

```env
# COS Configuration / COS 配置
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_REGION=ap-guangzhou

# Custom CDN Domain (optional) / 自定义 CDN 域名（可选）
COS_CDN_DOMAIN=https://cdn.example.com

# Authentication / 认证配置
ACCESS_PASSWORD=your_access_password
AUTH_SECRET=your_random_secret_string_at_least_32_chars
```

### 3. Run Development Server / 启动开发服务器

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### 4. Build for Production / 构建生产版本

```bash
pnpm build
pnpm start
```

## Environment Variables / 环境变量说明

| Variable / 变量 | Required / 必填 | Description / 说明 |
|----------------|-----------------|-------------------|
| `COS_SECRET_ID` | Yes / 是 | Tencent Cloud SecretId / 腾讯云 SecretId |
| `COS_SECRET_KEY` | Yes / 是 | Tencent Cloud SecretKey / 腾讯云 SecretKey |
| `COS_REGION` | Yes / 是 | COS Region (e.g. ap-guangzhou) / COS 地域 |
| `COS_CDN_DOMAIN` | No / 否 | Custom CDN domain / 自定义 CDN 域名 |
| `ACCESS_PASSWORD` | Yes / 是 | Login password / 登录密码 |
| `AUTH_SECRET` | Yes / 是 | JWT secret (32+ chars) / JWT 密钥 |

## EdgeOne KV Storage (Optional) / EdgeOne KV 存储（可选）

CosHub supports EdgeOne KV storage for managing settings via web interface. When KV is configured, settings stored in KV take priority over environment variables.

CosHub 支持使用 EdgeOne KV 存储在线管理配置。配置 KV 后，KV 中的设置优先于环境变量。

### How it works / 工作原理

KV storage is accessed through Next.js Edge Runtime API (`/api/kv/settings`). This API runs on edge nodes and can access KV bindings.

KV 存储通过 Next.js Edge Runtime API (`/api/kv/settings`) 访问。该 API 运行在边缘节点上，可以访问 KV 绑定。

### Setup / 配置步骤

1. **Create KV Namespace / 创建 KV 命名空间**
   - Go to EdgeOne Pages Console → KV Storage
   - 进入 EdgeOne Pages 控制台 → KV 存储
   - Click "Create Namespace" / 点击「创建命名空间」

2. **Bind to Project / 绑定到项目**
   - In KV namespace details, click "Bind Project"
   - 在 KV 命名空间详情中，点击「绑定项目」
   - Set variable name to `SETTINGS_KV`
   - 将变量名设置为 `SETTINGS_KV`

3. **Redeploy / 重新部署**
   - After binding KV, redeploy your project to apply changes
   - 绑定 KV 后，重新部署项目以应用更改

4. **Use Web Settings / 使用在线设置**
   - After login, click "Settings" in the sidebar
   - 登录后，点击侧边栏的「设置」
   - Configure password and CDN domain
   - 配置密码和 CDN 域名

### Supported Settings / 支持的配置项

| Setting / 配置项 | KV Key | Description / 说明 |
|-----------------|--------|-------------------|
| Access Password / 访问密码 | `access_password` | Login password / 登录密码 |
| CDN Domain / CDN 域名 | `cos_cdn_domain` | Custom CDN domain / 自定义 CDN 域名 |

### API Endpoint / API 端点

| Path / 路径 | Description / 说明 |
|------------|-------------------|
| `/api/kv/settings` | GET/PUT - Manage settings via KV (requires auth) / 通过 KV 管理设置（需登录）|

## License / 许可证

MIT
