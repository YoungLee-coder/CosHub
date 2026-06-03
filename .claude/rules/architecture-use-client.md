---
title: 'use client' 限制
impact: HIGH
impactDescription: 避免不必要的客户端渲染，保持 SPA 架构清晰
tags: architecture, react, client-boundary
---

## 'use client' 限制

**Impact: HIGH (避免不必要的客户端渲染，保持 SPA 架构清晰)**

仅在组件确实使用客户端 hooks（useState、useEffect 等）或浏览器 API 时添加 `'use client'`。不为了便利随意添加。

**Incorrect (不必要地标记客户端组件):**

```typescript
'use client'
function StaticHeader({ title }: { title: string }) {
  return <h1>{title}</h1>
}
```

**Correct (仅在需要时标记):**

```typescript
function StaticHeader({ title }: { title: string }) {
  return <h1>{title}</h1>
}

'use client'
function InteractiveDropdown() {
  const [open, setOpen] = useState(false)
  // ...
}
```
