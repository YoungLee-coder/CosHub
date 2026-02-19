'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  deleteObjects,
  renameObject,
  getDownloadUrl,
  getCdnUrl,
} from '@/features/cos/client/cos.api'
import { useObjects, type FileItem } from '@/hooks/useObjects'
import { formatFileSize, formatDate, isImageFile, isVideoFile } from '@/lib/utils'
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
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Folder,
  File,
  Image,
  Video,
  MoreHorizontal,
  Download,
  Trash2,
  Edit,
  Search,
  Loader2,
  Eye,
  ArrowUp,
  ArrowDown,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'

interface FileTableProps {
  bucket: string
  prefix: string
  onNavigate: (path: string) => void
}

export function FileTable({ bucket, prefix, onNavigate }: FileTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; file: FileItem | null }>({
    open: false,
    file: null,
  })
  const [newName, setNewName] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null)

  const { items, isLoading, refetch } = useObjects({ bucket, prefix })

  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteObjects(bucket, [key]),
    onSuccess: () => {
      toast.success('删除成功')
      refetch()
    },
    onError: () => toast.error('删除失败'),
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (keys: string[]) => deleteObjects(bucket, keys),
    onSuccess: () => {
      toast.success('批量删除成功')
      setRowSelection({})
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

  const handleDownload = async (key: string) => {
    try {
      const url = await getDownloadUrl(bucket, key)
      window.open(url, '_blank')
    } catch {
      toast.error('获取下载链接失败')
    }
  }

  const handleCopyLink = async (key: string) => {
    try {
      const cdnUrl = await getCdnUrl(key)
      const url = cdnUrl || (await getDownloadUrl(bucket, key))
      await navigator.clipboard.writeText(url)
      toast.success('链接已复制')
    } catch {
      toast.error('复制链接失败')
    }
  }

  const handlePreview = async (file: FileItem) => {
    try {
      const url = await getDownloadUrl(bucket, file.key)
      if (isImageFile(file.name)) {
        setPreviewType('image')
        setPreviewUrl(url)
      } else if (isVideoFile(file.name)) {
        setPreviewType('video')
        setPreviewUrl(url)
      }
    } catch {
      toast.error('获取预览链接失败')
    }
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
    const selectedKeys = Object.keys(rowSelection).filter((k) => rowSelection[k])
    const keysToDelete = items.filter((_, i) => selectedKeys.includes(String(i))).map((f) => f.key)
    if (keysToDelete.length > 0) batchDeleteMutation.mutate(keysToDelete)
  }

  const columns: ColumnDef<FileItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-neutral-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-neutral-300"
        />
      ),
      size: 40,
    },
    {
      accessorKey: 'name',
      header: '名称',
      cell: ({ row }) => {
        const file = row.original
        const Icon = file.isFolder
          ? Folder
          : isImageFile(file.name)
            ? Image
            : isVideoFile(file.name)
              ? Video
              : File
        return (
          <button
            onClick={() => file.isFolder && onNavigate(file.key)}
            className={`flex items-center gap-2 ${file.isFolder ? 'hover:text-neutral-600 cursor-pointer' : ''}`}
          >
            <Icon
              className={`w-4 h-4 ${file.isFolder ? 'text-neutral-700' : 'text-neutral-400'}`}
            />
            <span className="truncate max-w-xs">{file.name}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'size',
      header: '大小',
      cell: ({ row }) => (row.original.isFolder ? '-' : formatFileSize(row.original.size)),
    },
    {
      accessorKey: 'lastModified',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <div className="flex items-center gap-1">
            <span>修改时间</span>
            <button
              onClick={() => column.toggleSorting(isSorted === 'asc')}
              className="p-0.5 rounded hover:bg-neutral-200 transition-colors"
            >
              {isSorted === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-neutral-900" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="w-3.5 h-3.5 text-neutral-900" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 text-neutral-400" />
              )}
            </button>
          </div>
        )
      },
      cell: ({ row }) => (row.original.lastModified ? formatDate(row.original.lastModified) : '-'),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.lastModified ? new Date(rowA.original.lastModified).getTime() : 0
        const b = rowB.original.lastModified ? new Date(rowB.original.lastModified).getTime() : 0
        return a - b
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const file = row.original
        if (file.isFolder) return null
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(isImageFile(file.name) || isVideoFile(file.name)) && (
                <DropdownMenuItem onClick={() => handlePreview(file)}>
                  <Eye className="w-4 h-4 mr-2" />
                  预览
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleCopyLink(file.key)}>
                <Copy className="w-4 h-4 mr-2" />
                复制链接
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload(file.key)}>
                <Download className="w-4 h-4 mr-2" />
                下载
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRename(file)}>
                <Edit className="w-4 h-4 mr-2" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate(file.key)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
    },
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: items,
    columns,
    state: { globalFilter, rowSelection, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="搜索文件..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 border-neutral-300"
          />
        </div>
        {selectedCount > 0 && (
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
            删除 ({selectedCount})
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-neutral-200 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="sticky top-0 z-10 bg-background text-neutral-600"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-neutral-400" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                  暂无文件
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-neutral-200 hover:bg-neutral-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>

      <Dialog
        open={renameDialog.open}
        onOpenChange={(open) => setRenameDialog({ open, file: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名文件</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新文件名"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, file: null })}>
              取消
            </Button>
            <Button onClick={confirmRename} disabled={renameMutation.isPending}>
              {renameMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>预览</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[300px]">
            {previewType === 'image' && previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
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
