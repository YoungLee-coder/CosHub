---
title: shadcn/ui 与 cn() 模式
impact: MEDIUM
impactDescription: 保持 UI 组件一致性和样式合并规范
tags: ui, shadcn, tailwind, style
---

## shadcn/ui 与 cn() 模式

**Impact: MEDIUM (保持 UI 组件一致性和样式合并规范)**

shadcn/ui 组件保存在 `src/components/ui/**`，不手动修改其内部实现。类名合并使用 `cn()` from `src/lib/utils.ts`（基于 tailwind-merge + clsx），不直接拼接字符串。

**Incorrect (手动拼接类名):**

```typescript
<div className={`px-4 py-2 ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`}>
```

**Correct (使用 cn() 合并):**

```typescript
import { cn } from '@/lib/utils'
<div className={cn('px-4 py-2', isActive ? 'bg-blue-500' : 'bg-gray-200')}>
```
