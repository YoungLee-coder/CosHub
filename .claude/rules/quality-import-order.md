---
title: 导入分组与别名约定
impact: HIGH
impactDescription: 保持导入顺序一致，减少认知负担
tags: quality, imports, style
---

## 导入分组与别名约定

**Impact: HIGH (保持导入顺序一致，减少认知负担)**

导入语句按三级分组：third-party → alias (`@/…`) → relative (`./…`)，类型导入用 `import type { … }`。优先使用 `@/` 别名而非长相对路径。

**Incorrect (混合排序、未使用 type import):**

```typescript
import { cn } from './utils'
import { useQuery } from '@tanstack/react-query'
import type { BucketItem } from '@/lib/types'
import React from 'react'
```

**Correct (三级分组 + type import):**

```typescript
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import type { BucketItem } from '@/lib/types'
import { cn } from '@/lib/utils'
```
