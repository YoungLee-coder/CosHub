# CosHub

<div align="center">
  <img src="public/icon.svg" alt="CosHub Logo" width="80" height="80">
  <h3>现代化的腾讯云 COS 管理面板</h3>
  <p>为个人开发者和小型团队打造的专业存储管理解决方案</p>
</div>

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Version](https://img.shields.io/badge/version-1.4.0-green)](./package.json)

</div>

## ✨ 功能特性

### 🗂️ 文件管理
- **双视图模式** - 网格视图（默认）和列表视图，一键切换
- **智能预览** - 图片缩略图、视频截帧，支持在线预览
- **批量操作** - 多选文件批量下载、删除、压缩下载
- **文件夹管理** - 创建文件夹，支持层级目录结构
- **拖拽上传** - 直接拖拽文件到页面上传
- **实时进度** - 上传进度实时显示，自动刷新列表

### 🔍 搜索与筛选
- **智能搜索** - 按文件名快速搜索
- **类型筛选** - 按图片/视频/文档/其他类型筛选
- **大小筛选** - 按文件大小范围筛选（小于1MB/1-10MB/大于10MB）
- **时间筛选** - 按上传时间筛选（今天/本周/本月）
- **多种排序** - 支持按名称、大小、上传时间排序

### 🚀 性能优化
- **智能预加载** - 自动预加载下一页和其他视图模式数据
- **三级缓存** - React Query + 浏览器缓存 + CDN 缓存
- **虚拟滚动** - 大量文件列表流畅渲染
- **并发控制** - 最多5个并发上传，避免服务器压力
- **缩略图优化** - 自动生成缩略图，减少带宽消耗

### 🔐 安全特性
- **用户认证** - 基于 NextAuth.js 的安全登录
- **密钥加密** - AES-256-GCM 加密存储腾讯云密钥
- **会话管理** - 安全的会话控制和自动过期
- **权限验证** - 完整的 API 权限验证机制

### 🎨 用户体验
- **现代化界面** - 基于 shadcn/ui 的精美组件
- **响应式设计** - 完美适配桌面和移动设备
- **深色模式** - 支持明暗主题自动切换
- **实时反馈** - 操作结果实时提示和状态更新

## 🛠️ 技术栈

| 类别 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **前端框架** | Next.js | 15.3.4 | 基于 App Router 的全栈框架 |
| **开发语言** | TypeScript | 5.0+ | 类型安全的开发体验 |
| **UI 框架** | React | 19.0 | 最新 React，支持并发特性 |
| **样式方案** | Tailwind CSS | 3.4+ | 原子化 CSS 框架 |
| **组件库** | shadcn/ui | Latest | 基于 Radix UI 的高质量组件 |
| **数据库** | Prisma + SQLite | 6.0+ | 类型安全 ORM + 轻量级数据库 |
| **身份认证** | NextAuth.js | 4.24+ | 安全的身份验证解决方案 |
| **状态管理** | Zustand | 5.0+ | 轻量级状态管理 |
| **数据获取** | TanStack Query | 5.64+ | 强大的服务端状态管理 |
| **虚拟滚动** | TanStack Virtual | 3.13+ | 高性能虚拟滚动 |
| **表单处理** | React Hook Form + Zod | 7.54+ | 高性能表单 + 数据验证 |
| **图片处理** | Sharp | 0.33+ | 高性能图片处理 |
| **对象存储** | cos-nodejs-sdk-v5 | 2.14+ | 腾讯云 COS 官方 SDK |

## 🚀 快速开始

### 系统要求

- **Node.js** 18.0 或更高版本
- **pnpm** 8.0 或更高版本（推荐）
- **腾讯云账号** 及 COS 服务

### 一键启动

```bash
# 克隆项目
git clone https://github.com/yourusername/coshub.git
cd coshub

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 `http://localhost:5030`，首次启动会自动：
- 创建环境配置文件
- 初始化数据库
- 创建管理员账号（用户名：`admin`）
- **控制台会显示随机生成的密码，请注意保存**

### 生产部署

```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

### 自定义端口

```bash
# 使用自定义端口（如 8080）
PORT=8080 pnpm dev

# Windows PowerShell
$env:PORT=8080; pnpm start:custom
```

## 📖 使用说明

### 1. 配置存储桶

登录后进入「存储桶设置」页面：

1. 点击「添加存储桶」
2. 填写配置信息：
   - **存储桶名称**：腾讯云 COS 存储桶名
   - **所在地域**：如 `ap-guangzhou`、`ap-beijing`
   - **SecretId/SecretKey**：从[腾讯云控制台](https://console.cloud.tencent.com/cam/capi)获取
   - **自定义域名**（可选）：CDN 加速域名

### 2. 文件管理

#### 上传文件
- **按钮上传**：点击「上传文件」选择文件
- **拖拽上传**：直接拖拽文件到页面
- **批量上传**：支持同时上传多个文件

#### 文件操作
- **预览**：点击文件缩略图或文件名
- **下载**：右键菜单或操作按钮
- **删除**：支持单个或批量删除
- **重命名**：右键菜单选择重命名
- **复制链接**：快速获取文件访问链接

#### 视图切换
- **网格视图**：默认视图，显示文件缩略图
- **列表视图**：紧凑视图，显示详细信息

#### 搜索筛选
- **文件名搜索**：顶部搜索框
- **高级筛选**：点击筛选按钮，按类型、大小、时间筛选
- **排序**：支持按名称、大小、时间排序

### 3. 账号管理

在「设置」页面可以：
- 修改用户名
- 修改密码
- 查看系统信息

## 🌐 部署选项

### Vercel 部署（推荐）

1. Fork 本仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量：
   ```env
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-secret-key
   ENCRYPTION_KEY=your-encryption-key
   ```

### Docker 部署

```bash
# 使用 Docker Compose
docker-compose up -d

# 或手动构建
docker build -t coshub .
docker run -d -p 5030:5030 -v ./data:/app/prisma coshub
```

### 传统服务器部署

```bash
# 安装依赖并构建
pnpm install
pnpm build

# 启动服务（推荐使用 PM2）
pm2 start "pnpm start" --name coshub
```

## 🔧 开发指南

### 可用脚本

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 代码检查
pnpm db:studio    # 打开数据库管理界面
```

### 项目结构

```
coshub/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API 路由
│   │   ├── dashboard/      # 主面板
│   │   └── login/          # 登录页面
│   ├── components/         # React 组件
│   │   ├── FileManager/    # 文件管理器
│   │   └── ui/            # UI 组件
│   ├── lib/               # 工具函数
│   ├── stores/            # 状态管理
│   └── types/             # 类型定义
├── prisma/                # 数据库
├── scripts/               # 脚本文件
└── public/                # 静态资源
```

### API 接口

#### 文件操作
- `GET /api/files` - 获取文件列表（支持分页、搜索、筛选）
- `POST /api/files` - 上传文件
- `PUT /api/files/[id]` - 重命名文件
- `DELETE /api/files/[id]` - 删除文件
- `DELETE /api/files/batch` - 批量删除
- `POST /api/files/compress` - 批量压缩下载

#### 存储桶管理
- `GET /api/buckets` - 获取存储桶列表
- `POST /api/buckets` - 添加存储桶
- `PUT /api/buckets/[id]` - 更新存储桶
- `DELETE /api/buckets/[id]` - 删除存储桶

## ❓ 常见问题

### Q: 如何获取腾讯云密钥？
A: 登录[腾讯云控制台](https://console.cloud.tencent.com/cam/capi) → 访问密钥 → 新建密钥

### Q: 忘记管理员密码怎么办？
A: 删除 `prisma/dev.db` 文件，重新启动应用会自动创建新账号

### Q: 支持哪些文件格式预览？
A: 图片（jpg、png、gif、webp）和视频（mp4、webm）

### Q: 如何重置应用？
A: 删除以下文件后重新启动：
```bash
rm -rf prisma/dev.db*  # 数据库文件
rm .env.local          # 环境配置
```

### Q: 端口被占用怎么办？
A: 使用自定义端口：`PORT=8080 pnpm dev`

### Q: 如何配置 CDN 域名？
A: 在腾讯云 COS 控制台配置 CDN 后，在存储桶设置中填入域名

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -m 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交 Pull Request

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。

## 🙏 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - 全栈 React 框架
- [shadcn/ui](https://ui.shadcn.com/) - 现代化组件库
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS
- [Prisma](https://www.prisma.io/) - 现代化 ORM
- [TanStack Query](https://tanstack.com/query) - 数据获取库
- [腾讯云 COS](https://cloud.tencent.com/product/cos) - 对象存储服务

---

<div align="center">
  <p>如果这个项目对您有帮助，请给一个 ⭐ Star！</p>
  <p>Made with ❤️ by CosHub Contributors</p>
</div>
