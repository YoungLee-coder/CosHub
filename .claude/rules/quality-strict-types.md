---
title: TypeScript 严格类型
impact: HIGH
impactDescription: 避免运行时类型错误，提升可维护性
tags: quality, typescript, type-safety
---

## TypeScript 严格类型

**Impact: HIGH (避免运行时类型错误，提升可维护性)**

使用 `strict: true` TypeScript 配置。禁止 `any`，优先显式类型和窄联合。对状态类字段使用判别/字面联合（discriminated/literal unions）。

**Incorrect (使用 any 和宽泛类型):**

```typescript
const data: any = response.json()
const status: string = item.status
```

**Correct (显式类型 + 判别联合):**

```typescript
type BucketStatus = 'loading' | 'success' | 'error'
type BucketData =
  | { status: 'loading' }
  | { status: 'success'; data: BucketItem[] }
  | { status: 'error'; error: string }
const result: BucketData = await fetchBuckets()
```
