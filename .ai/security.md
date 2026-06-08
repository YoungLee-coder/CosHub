# Security Boundaries

## Critical Safety Rules

- 永不在前端代码中暴露或硬编码 COS SecretId/SecretKey——所有 COS SDK 调用必须在 Cloud Function (`cloud-functions/api/[[default]].js`) 中完成，凭证通过 `middleware.js` 注入请求头传递。
- JWT 认证是 `/api/cos/*` 和 `/api/settings/*` 的唯一保护层——修改 `middleware.js` 时必须确保所有受保护路由仍被覆盖，不能遗漏新端点。
- COS 对象删除不可恢复——DELETE API 不做软删除或确认，前端必须在调用删除 API 前弹出确认对话框。
- 设置 API 的密钥遮蔽逻辑：读取时返回 `******`，更新时仅在用户提供了真实值（非遮蔽值）时才写入 KV——不能让遮蔽值覆盖真实密钥。
- 登录限速依赖 KV 存储——如果 KV 不可用，限速会静默失败（try/catch 空回退）。修改限速逻辑时需确保不会意外禁用限速保护。
- `.env.local` 包含真实凭证——确保 `.env*` 始终在 `.gitignore` 中，不要提交环境文件。
