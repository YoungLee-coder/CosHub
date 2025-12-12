/**
 * 对象列表数据请求 Hook
 * 与视图组件解耦，统一管理数据获取和缓存
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getObjects } from '@/lib/api'
import type { CosFile, CosFolder } from '@/lib/cos'
import { getFileName } from '@/lib/utils'

export interface FileItem {
  key: string
  name: string
  size: number
  lastModified: string
  isFolder: boolean
  etag?: string
}

interface UseObjectsOptions {
  bucket: string
  prefix: string
  enabled?: boolean
}

/**
 * 关键性能优化:
 * 1. staleTime: 30s - 30秒内认为数据新鲜，不重新请求
 * 2. gcTime: 5min - 缓存保留5分钟，切换目录后返回可复用
 * 3. refetchOnWindowFocus: false - 避免频繁刷新
 */
export function useObjects({ bucket, prefix, enabled = true }: UseObjectsOptions) {
  const query = useQuery({
    queryKey: ['objects', bucket, prefix],
    queryFn: () => getObjects(bucket, prefix),
    enabled: enabled && !!bucket,
    staleTime: 30 * 1000,        // 30秒内数据视为新鲜
    gcTime: 5 * 60 * 1000,       // 缓存保留5分钟
    refetchOnWindowFocus: false, // 禁用窗口聚焦刷新
  })

  // 转换为统一的 FileItem 格式
  const items: FileItem[] = useMemo(() => {
    if (!query.data) return []
    
    const folders: FileItem[] = (query.data.folders || []).map((f: CosFolder) => ({
      key: f.Prefix,
      name: getFileName(f.Prefix),
      size: 0,
      lastModified: '',
      isFolder: true,
    }))
    
    const files: FileItem[] = (query.data.files || [])
      .filter((f: CosFile) => !f.isFolder)
      .map((f: CosFile) => ({
        key: f.Key,
        name: getFileName(f.Key),
        size: f.Size,
        lastModified: f.LastModified,
        isFolder: false,
        etag: f.ETag,
      }))
    
    return [...folders, ...files]
  }, [query.data])

  return {
    items,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
