---
title: API 路由错误处理
impact: HIGH
impactDescription: 防止未捕获异常导致服务崩溃
tags: api, error-handling, security
---

## API 路由错误处理

**Impact: HIGH (防止未捕获异常导致服务崩溃)**

API 处理函数体包裹在 `try/catch` 中。认证/session 逻辑保持在服务端。不混用服务端和客户端逻辑（除非有 `'use client'` 边界）。

**Incorrect (未包裹 try/catch):**

```typescript
app.get('/api/buckets', async (req, res) => {
  const data = await listBuckets()
  res.json(data)
})
```

**Correct (try/catch 包裹):**

```typescript
app.get('/api/buckets', async (req, res) => {
  try {
    const data = await listBuckets()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})
```
