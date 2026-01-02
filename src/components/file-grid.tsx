'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMutation } from '@tanstack/react-query'
import { deleteObjects, renameObject, getDownloadUrl, getCdnUrl, getCdnDomain } from '@/lib/api'
import { useObjects, type FileItem } from '@/hooks/useObjects'
import { getThumbnailUrl, isThumbnailSupported, getFileIconType, type FileIconType } from '@/lib/thumbnail'
import { formatFileSize, isImageFile, isVideoFile } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Folder, File, Image, Video, Music, FileText, FileCode, Archive,
  MoreVertical, Download, Trash2, Edit, Search, Loader2, Eye, Copy,
} from 'lucide-react'
import { toast } from 'sonner'

// Grid 配置常量
const CARD_MIN_WIDTH = 180
const CARD_MAX_WIDTH = 240
const CARD_HEIGHT = 200
const GAP = 12

interface FileGridProps {
  bucket: string
  prefix: string
  onNavigate: (path: string) => void
}

// 文件图标映射
const FileIcons: Record<FileIconType, typeof File> = {
  folder: Folder,
  file: File,
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  word: FileText,
  excel: FileText,
  powerpoint: FileText,
  text: FileText,
  code: FileCode,
  archive: Archive,
}

export function FileGrid({ bucket, prefix, onNavigate }: FileGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columnCount, setColumnCount] = useState(4)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; file: FileItem | null }>({
    open: false,
    file: null,
  })
  const [newName, setNewName] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null)
  const [cdnBaseUrl, setCdnBaseUrl] = useState<string | null>(null) // null = 未加载
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map())

  const { items, isLoading, refetch } = useObjects({ bucket, prefix })

  // 获取 CDN 基础域名 (用于缩略图)
  useEffect(() => {
    getCdnDomain()
      .then(domain => {
        if (!domain) {
          setCdnBaseUrl('')
          return
        }
        // 自动补全协议前缀
        const url = domain.startsWith('http') ? domain : `https://${domain}`
        setCdnBaseUrl(url)
      })
      .catch(() => setCdnBaseUrl(''))
  }, [])


  // 过滤后的数据
  const filteredItems = useMemo(() => {
    if (!globalFilter) return items
    const lower = globalFilter.toLowerCase()
    return items.filter(item => item.name.toLowerCase().includes(lower))
  }, [items, globalFilter])

  // 响应式列数计算 - 使用 ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateColumns = () => {
      const width = container.clientWidth
      // 计算最优列数，确保卡片宽度在 MIN-MAX 之间
      const cols = Math.max(1, Math.floor((width + GAP) / (CARD_MIN_WIDTH + GAP)))
      const cardWidth = (width - GAP * (cols - 1)) / cols
      // 如果卡片太宽，增加列数
      if (cardWidth > CARD_MAX_WIDTH && cols < Math.floor((width + GAP) / (CARD_MIN_WIDTH + GAP))) {
        setColumnCount(cols + 1)
      } else {
        setColumnCount(cols)
      }
    }

    const observer = new ResizeObserver(updateColumns)
    observer.observe(container)
    updateColumns()

    return () => observer.disconnect()
  }, [])

  // 计算行数
  const rowCount = Math.ceil(filteredItems.length / columnCount)

  // 虚拟滚动配置
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => CARD_HEIGHT + GAP,
    overscan: 2, // 预渲染2行，平衡性能和滚动流畅度
  })

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteObjects(bucket, [key]),
    onSuccess: () => { toast.success('删除成功'); refetch() },
    onError: () => toast.error('删除失败'),
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (keys: string[]) => deleteObjects(bucket, keys),
    onSuccess: () => { 
      toast.success('批量删除成功')
      setSelectedKeys(new Set())
      refetch() 
    },
    onError: () => toast.error('批量删除失败'),
  })

  const renameMutation = useMutation({
    mutationFn: ({ oldKey, newKey }: { oldKey: string; newKey: string }) =>
      renameObject(bucket, oldKey, newKey),
    onSuccess: () => { 
      toast.success('重命名成功')
      setRenameDialog({ open: false, file: null })
      refetch() 
    },
    onError: () => toast.error('重命名失败'),
  })

  // 事件处理
  const handleDownload = async (key: string) => {
    try {
      const url = await getDownloadUrl(bucket, key)
      window.open(url, '_blank')
    } catch { toast.error('获取下载链接失败') }
  }

  const handleCopyLink = async (key: string) => {
    try {
      const cdnUrl = await getCdnUrl(key)
      const url = cdnUrl || await getDownloadUrl(bucket, key)
      await navigator.clipboard.writeText(url)
      toast.success('链接已复制')
    } catch { toast.error('复制链接失败') }
  }

  const handlePreview = async (file: FileItem) => {
    try {
      const url = await getDownloadUrl(bucket, file.key)
      if (isImageFile(file.name)) { setPreviewType('image'); setPreviewUrl(url) }
      else if (isVideoFile(file.name)) { setPreviewType('video'); setPreviewUrl(url) }
    } catch { toast.error('获取预览链接失败') }
  }

  const handleRename = (file: FileItem) => { 
    setNewName(file.name)
    setRenameDialog({ open: true, file }) 
  }

  const confirmRename = () => {
    if (!renameDialog.file || !newName.trim()) return
    renameMutation.mutate({ oldKey: renameDialog.file.key, newKey: prefix + newName })
  }

  const handleBatchDelete = () => {
    if (selectedKeys.size > 0) {
      batchDeleteMutation.mutate(Array.from(selectedKeys))
    }
  }

  const toggleSelect = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // 为没有 CDN 的图片获取签名 URL
  useEffect(() => {
    // 等待 CDN 域名加载完成
    if (cdnBaseUrl === null) return
    // 有 CDN 就不需要签名 URL
    if (cdnBaseUrl) return
    
    const imageFiles = items.filter(f => !f.isFolder && isThumbnailSupported(f.name))
    if (imageFiles.length === 0) return

    // 批量获取签名 URL
    const fetchUrls = async () => {
      const newUrls = new Map<string, string>()
      await Promise.all(
        imageFiles.slice(0, 50).map(async (file) => { // 限制并发数
          try {
            const url = await getDownloadUrl(bucket, file.key)
            newUrls.set(file.key, getThumbnailUrl(url, file.etag, 280))
          } catch {}
        })
      )
      setThumbnailUrls(prev => new Map([...prev, ...newUrls]))
    }
    fetchUrls()
  }, [items, cdnBaseUrl, bucket])

  // 生成缩略图 URL
  const getThumbnail = useCallback((file: FileItem): string | null => {
    if (file.isFolder || !isThumbnailSupported(file.name)) return null
    
    // CDN 域名还未加载完成
    if (cdnBaseUrl === null) return null
    
    // 使用 CDN
    if (cdnBaseUrl) {
      const baseUrl = cdnBaseUrl.endsWith('/') 
        ? cdnBaseUrl + encodeURIComponent(file.key)
        : cdnBaseUrl + '/' + encodeURIComponent(file.key)
      return getThumbnailUrl(baseUrl, file.etag, 280)
    }
    
    // 回退到签名 URL
    return thumbnailUrls.get(file.key) || null
  }, [cdnBaseUrl, thumbnailUrls])


  // 渲染单个卡片
  const renderCard = (file: FileItem) => {
    const isSelected = selectedKeys.has(file.key)
    const thumbnailUrl = getThumbnail(file)
    const iconType = getFileIconType(file.name, file.isFolder)
    const Icon = FileIcons[iconType]

    return (
      <div
        key={file.key}
        className={`
          relative group rounded-lg border bg-white overflow-hidden cursor-pointer
          transition-all duration-150 hover:shadow-md hover:border-neutral-300
          ${isSelected ? 'ring-2 ring-neutral-900 border-neutral-900' : 'border-neutral-200'}
        `}
        style={{ height: CARD_HEIGHT }}
        onClick={() => file.isFolder ? onNavigate(file.key) : toggleSelect(file.key)}
      >
        {/* 选择框 */}
        <div 
          className="absolute top-2 left-2 z-10"
          onClick={(e) => { e.stopPropagation(); toggleSelect(file.key) }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-4 h-4 rounded border-neutral-300 opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity"
          />
        </div>

        {/* 操作菜单 */}
        {!file.isFolder && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 bg-white/80 hover:bg-white shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {(isImageFile(file.name) || isVideoFile(file.name)) && (
                  <DropdownMenuItem onClick={() => handlePreview(file)}>
                    <Eye className="w-4 h-4 mr-2" />预览
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleCopyLink(file.key)}>
                  <Copy className="w-4 h-4 mr-2" />复制链接
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload(file.key)}>
                  <Download className="w-4 h-4 mr-2" />下载
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRename(file)}>
                  <Edit className="w-4 h-4 mr-2" />重命名
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => deleteMutation.mutate(file.key)} 
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* 缩略图/图标区域 */}
        <div className="h-[130px] flex items-center justify-center bg-neutral-50 overflow-hidden">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt={file.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon className={`w-12 h-12 ${file.isFolder ? 'text-neutral-700' : 'text-neutral-400'}`} />
          )}
        </div>

        {/* 文件信息 */}
        <div className="p-3">
          <p className="text-sm font-medium text-neutral-900 truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {file.isFolder ? '文件夹' : formatFileSize(file.size)}
          </p>
        </div>
      </div>
    )
  }


  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            placeholder="搜索文件..." 
            value={globalFilter} 
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 border-neutral-300" 
          />
        </div>
        {selectedKeys.size > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBatchDelete} 
            disabled={batchDeleteMutation.isPending}
          >
            {batchDeleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            删除 ({selectedKeys.size})
          </Button>
        )}
      </div>

      {/* Grid 容器 - 虚拟滚动 */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto p-1 scrollbar-hide" // p-1 为选中框留出空间
        style={{ contain: 'strict' }} // 性能优化: 隔离重绘
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-neutral-500">
            暂无文件
          </div>
        ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * columnCount
              const rowItems = filteredItems.slice(startIndex, startIndex + columnCount)
              
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div 
                    className="grid h-full"
                    style={{
                      gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                      gap: GAP,
                      paddingBottom: GAP,
                    }}
                  >
                    {rowItems.map((file) => renderCard(file))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 重命名对话框 */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ open, file: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>重命名文件</DialogTitle></DialogHeader>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="新文件名" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, file: null })}>取消</Button>
            <Button onClick={confirmRename} disabled={renameMutation.isPending}>
              {renameMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>预览</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center min-h-[300px]">
            {previewType === 'image' && previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[70vh] object-contain" />
            )}
            {previewType === 'video' && previewUrl && (
              <video src={previewUrl} controls className="max-w-full max-h-[70vh]" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
