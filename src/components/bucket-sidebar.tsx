'use client'

import { useQuery } from '@tanstack/react-query'
import { getBuckets } from '@/actions/cos'
import { logout } from '@/actions/auth'
import { cn } from '@/lib/utils'
import { Database, LogOut, Loader2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BucketItem } from '@/lib/cos'

interface BucketSidebarProps {
  selectedBucket: string | null
  onSelectBucket: (bucket: string) => void
}

export function BucketSidebar({ selectedBucket, onSelectBucket }: BucketSidebarProps) {
  const { data: buckets, isLoading } = useQuery({
    queryKey: ['buckets'],
    queryFn: getBuckets,
  })

  return (
    <aside className="w-64 h-screen bg-neutral-50 border-r border-neutral-200 flex flex-col">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-neutral-900">CosHub</h1>
            <p className="text-xs text-neutral-500">COS 管理面板</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2 px-2">
          存储桶
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
          </div>
        ) : buckets?.length === 0 ? (
          <p className="text-sm text-neutral-500 px-2">暂无存储桶</p>
        ) : (
          <div className="space-y-1">
            {buckets?.map((bucket) => (
              <button
                key={bucket.Name}
                onClick={() => onSelectBucket(bucket.Name!)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  selectedBucket === bucket.Name
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                )}
              >
                <FolderOpen className="w-4 h-4 shrink-0" />
                <span className="truncate">{bucket.Name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-neutral-200">
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </form>
      </div>
    </aside>
  )
}
