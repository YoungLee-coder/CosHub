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

## Configuration / 配置管理

CosHub supports two configuration methods: EdgeOne KV (recommended) and environment variables.

CosHub 支持两种配置方式：EdgeOne KV（推荐）和环境变量。

### Method 1: EdgeOne KV (Recommended) / 方式一：EdgeOne KV（推荐）

KV storage allows you to modify settings without redeployment.

KV 存储允许你无需重新部署即可修改配置。

1. Go to EdgeOne Pages Console → KV Storage → Apply Now
2. 进入 EdgeOne Pages 控制台 → KV 存储 → 立即开通
3. Create a namespace (e.g., `coshub-settings`)
4. 创建命名空间（如 `coshub-settings`）
5. Bind the namespace to your project with variable name `SETTINGS_KV`
6. 将命名空间绑定到项目，变量名设为 `SETTINGS_KV`
7. After deployment, use the Settings dialog in the app to configure
8. 部署后，在应用内的设置对话框中进行配置

### Method 2: Environment Variables / 方式二：环境变量

1. Go to EdgeOne Pages Console → Your Project → Settings → Environment Variables
2. 进入 EdgeOne Pages 控制台 → 你的项目 → 设置 → 环境变量
3. Add or update the following variables / 添加或更新以下变量：
   - `ACCESS_PASSWORD` - Login password / 登录密码
   - `COS_CDN_DOMAIN` - Custom CDN domain / 自定义 CDN 域名
4. Redeploy to apply changes / 重新部署以应用更改

### Priority / 优先级

KV settings take precedence over environment variables. If a value exists in KV, it will be used; otherwise, the environment variable is used as fallback.

KV 配置优先于环境变量。如果 KV 中存在值，则使用 KV 值；否则使用环境变量作为后备。

## License / 许可证

MIT
