# Claude 配置索引

- **[../CLAUDE.md](../CLAUDE.md)** — 主入口（persona / Do/Don't / 边界）

## Rules 索引

### Architecture

- [use-client](rules/architecture-use-client.md) — 'use client' 限制

### Security

- [no-secrets](rules/security-no-secrets.md) — 敏感信息保护

### Code Quality

- [import-order](rules/quality-import-order.md) — 导入分组与别名约定
- [strict-types](rules/quality-strict-types.md) — TypeScript 严格类型
- [file-naming-scope](rules/quality-file-naming-scope.md) — 文件命名与变更范围

### Data Layer

- [cos-centralization](rules/data-cos-centralization.md) — COS SDK 与 Fetch 封装集中管理

### API Design

- [input-validation](rules/api-input-validation.md) — API 路由输入校验与响应格式
- [error-handling](rules/api-error-handling.md) — API 路由错误处理

### UI / Frontend

- [shadcn-pattern](rules/ui-shadcn-pattern.md) — shadcn/ui 与 cn() 模式

### Reference

- [reference-commands](rules/reference-commands.md) — 开发命令参考

## Skills 索引

- [update-claude-config](skills/update-claude-config/SKILL.md) — 项目变化较大时重新扫描并同步 .claude/ 配置
