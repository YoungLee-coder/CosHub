---
title: COS SDK 与 Fetch 封装集中管理
impact: HIGH
impactDescription: 单一数据源，避免 SDK 调用散落各处
tags: data, cos-sdk, fetch, architecture
---

## COS SDK 与 Fetch 封装集中管理

**Impact: HIGH (单一数据源，避免 SDK 调用散落各处)**

COS SDK 交互集中在 `src/lib/cos.ts`，fetch 封装集中在 `src/lib/http/`。不在组件或页面中直接调用 SDK 或裸 fetch。

**Incorrect (在组件中直接调用 COS SDK):**

```typescript
function FileGrid() {
  const cos = new COS({ ... })
  const data = await cos.getBucket({ Bucket: 'my-bucket' })
}
```

**Correct (通过集中封装调用):**

```typescript
import { listObjects } from '@/lib/cos'
import { fetcher } from '@/lib/http'

function FileGrid() {
  const { data } = useQuery({ queryKey: ['objects'], queryFn: () => listObjects() })
}
```
