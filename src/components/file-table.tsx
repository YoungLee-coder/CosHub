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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
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
  ArrowUpDown,
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
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; keys: string[] }>({
    open: false,
    keys: [],
  })
  const [newName, setNewName] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null)

  const { items, isLoading, refetch } = useObjects({ bucket, prefix })

  const deleteMutation = useMutation({
    mutationFn: (keys: string[]) => deleteObjects(bucket, keys),
    onSuccess: (_data, keys) => {
      toast.success(keys.length > 1 ? '批量删除成功' : '删除成功')
      setDeleteDialog({ open: false, keys: [] })
      setRowSelection({})
      refetch()
    },
    onError: (_err, keys) => toast.error(keys.length > 1 ? '批量删除失败' : '删除失败'),
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

  const requestDelete = (keys: string[]) => {
    if (keys.length === 0) return
    setDeleteDialog({ open: true, keys })
  }

  const confirmDelete = () => {
    if (deleteDialog.keys.length === 0) return
    deleteMutation.mutate(deleteDialog.keys)
  }

  const handleBatchDelete = () => {
    const selectedKeys = Object.keys(rowSelection).filter((k) => rowSelection[k])
    const keysToDelete = items.filter((_, i) => selectedKeys.includes(String(i))).map((f) => f.key)
    requestDelete(keysToDelete)
  }

  const columns: ColumnDef<FileItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      size: 36,
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
              className={`w-4 h-4 shrink-0 ${file.isFolder ? 'text-neutral-500' : 'text-neutral-400'}`}
            />
            <span className="truncate max-w-xs">{file.name}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'size',
      header: '大小',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.isFolder ? '-' : formatFileSize(row.original.size)}
        </span>
      ),
    },
    {
      accessorKey: 'lastModified',
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <button
            onClick={() => column.toggleSorting(isSorted === 'asc')}
            className="flex items-center gap-1 -ml-1 group"
          >
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              修改时间
            </span>
            <ArrowUpDown
              className={`h-3 w-3 transition-colors ${isSorted ? 'text-foreground' : 'text-muted-foreground/50 group-hover:text-muted-foreground'}`}
            />
          </button>
        )
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.lastModified ? formatDate(row.original.lastModified) : '-'}
        </span>
      ),
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
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
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
                onClick={() => requestDelete([file.key])}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 36,
    },
  ]

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
    <div className="h-full flex flex-col min-h-0 p-4 lg:px-6">
      <div className="flex shrink-0 items-center gap-3 pb-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索文件..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        {selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="h-8"
            onClick={handleBatchDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            删除 ({selectedCount})
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto rounded-lg border min-h-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-medium text-muted-foreground h-9"
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
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  暂无文件
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="group">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
              {renameMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !deleteMutation.isPending && setDeleteDialog({ open, keys: [] })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteDialog.keys.length > 1
              ? `确定删除选中的 ${deleteDialog.keys.length} 个对象？此操作不可恢复。`
              : '确定删除该对象？此操作不可恢复。'}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, keys: [] })}
              disabled={deleteMutation.isPending}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              确认删除
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
