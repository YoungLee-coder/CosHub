---
title: 敏感信息保护
impact: CRITICAL
impactDescription: 防止密钥和凭证泄露到代码或响应
tags: security, secrets, env
---

## 敏感信息保护

**Impact: CRITICAL (防止密钥和凭证泄露到代码或响应)**

不硬编码 secrets、API keys 或凭证。不提交 `.env` 文件。不在错误响应中返回 stack traces 或内部信息。关键敏感变量：`AUTH_SECRET`、`ACCESS_PASSWORD`、`COS_SECRET_ID`、`COS_SECRET_KEY`。

**Incorrect (硬编码密钥):**

```typescript
const secretKey = 'my-secret-key-123'
const cos = new COS({ SecretId: 'AKIDxxx', SecretKey: 'xxx' })
res.status(500).json({ error: err.stack })
```

**Correct (环境变量 + 不泄露):**

```typescript
const secretKey = process.env.COS_SECRET_KEY
const cos = new COS({ SecretId: process.env.COS_SECRET_ID, SecretKey: process.env.COS_SECRET_KEY })
res.status(500).json({ error: 'Internal server error' })
```
