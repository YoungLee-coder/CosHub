# Security Boundaries

## Critical Safety Rules

- 永不在前端代码中暴露或硬编码 COS SecretId/SecretKey——所有 COS SDK 调用必须在 Cloud Function (`cloud-functions/api/[[default]].js`) 中完成，凭证通过 `middleware.js` 注入请求头传递。
- JWT 认证是 `/api/cos/*` 和 `/api/settings/*` 的唯一保护层——修改 `middleware.js` 时必须确保所有受保护路由仍被覆盖，不能遗漏新端点。
- COS 对象删除不可恢复——DELETE API 不做软删除或确认，前端必须在调用删除 API 前弹出确认对话框。
- 设置 API 的密钥遮蔽逻辑：读取时返回 `******`，更新时仅在用户提供了真实值（非遮蔽值）时才写入 KV——不能让遮蔽值覆盖真实密钥。
- 登录限速必须使用平台可信 IP（`request.eo.clientIp` / `context.clientIp`），禁止用客户端可控的请求头（含 `X-Forwarded-For`、`EO-Connecting-IP`）。拿不到时固定为 `unknown`。
- 登录限速依赖 KV 存储——每次尝试验密前必须先成功写入计数；KV 读写失败时 fail-closed（返回 503），不能静默跳过限速。
- `.env.local` 包含真实凭证——确保 `.env*` 始终在 `.gitignore` 中，不要提交环境文件。
- 批量删除 API 必须校验 `keys` 为非空 string 数组，并限制长度（≤1000）。
- middleware 通过 `context.next({ headers })` 注入的 `x-coshub-*` 凭证头必须覆盖客户端传入的同名头，Cloud Function 只从这些头读取凭证。
