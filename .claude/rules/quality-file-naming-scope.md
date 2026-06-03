---
title: 文件命名与变更范围
impact: MEDIUM
impactDescription: 防止无意义重命名和无关修改
tags: quality, naming, scope
---

## 文件命名与变更范围

**Impact: MEDIUM (防止无意义重命名和无关修改)**

组件和工具文件使用 kebab-case 命名。不重命名/移动文件，除非任务明确要求。不重写不相关模块或包含仅外观性的变动。不引入已有工具的重复辅助函数。

**Incorrect (随意命名和范围蔓延):**

```typescript
// 文件: src/components/FileGrid.tsx ← PascalCase 文件名
// 修改 FileGrid 时顺便改了 Sidebar 的样式
// 写了新的 formatDate()，但 lib/utils.ts 已经有了
```

**Correct (kebab-case + 精准范围):**

```typescript
// 文件: src/components/file-grid.tsx ← kebab-case
// 只修改 FileGrid 相关代码
// 使用已有的 formatDate from '@/lib/utils'
```
