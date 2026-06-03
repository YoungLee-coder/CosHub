---
title: API 路由输入校验与响应格式
impact: CRITICAL
impactDescription: 防止未校验输入导致安全漏洞和错误
tags: api, validation, security, zod
---

## API 路由输入校验与响应格式

**Impact: CRITICAL (防止未校验输入导致安全漏洞和错误)**

API 路由入口处尽早校验输入，返回适当的 HTTP 状态码（400/401/403）。使用 Zod schema 校验请求体和查询参数。不返回 stack traces 或敏感信息到错误响应。

**Incorrect (未校验输入，泄露错误细节):**

```typescript
app.post('/api/buckets', async (req, res) => {
  const result = await createBucket(req.body)
  res.json(result)
})
// 错误时返回完整 stack trace
```

**Correct (Zod 校验 + 适当状态码):**

```typescript
import { z } from 'zod'
const schema = z.object({ name: z.string().min(1), region: z.string() })

app.post('/api/buckets', async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' })
  const result = await createBucket(parsed.data)
  res.json(result)
})
```
