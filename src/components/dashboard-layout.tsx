'use client'

import { useState } from 'react'
import { useQueryState } from 'nuqs'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from './app-sidebar'
import { BreadcrumbNav } from './breadcrumb-nav'
import { ViewToggle, type ViewMode } from './view-toggle'
import { FileTable } from './file-table'
import { FileGrid } from './file-grid'
import { UploadDialog } from './upload-dialog'
import { useQueryClient } from '@tanstack/react-query'
import { FolderPlus, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createFolder } from '@/features/cos/client/cos.api'
import { toast } from 'sonner'

export function DashboardLayout() {
  const queryClient = useQueryClient()
  const [bucket, setBucket] = useQueryState('bucket')
  const [prefix, setPrefix] = useQueryState('prefix', { defaultValue: '' })
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [newFolderDialog, setNewFolderDialog] = useState(false)
  const [uploadDialog, setUploadDialog] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [creating, setCreating] = useState(false)

  const handleSelectBucket = (name: string) => {
    setBucket(name)
    setPrefix('')
  }

  const handleNavigate = (path: string) => {
    setPrefix(path)
  }

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['objects', bucket, prefix] })
  }

  const handleCreateFolder = async () => {
    if (!bucket || !folderName.trim()) return
    setCreating(true)
    try {
      const path = prefix + folderName.trim()
      await createFolder(bucket, path)
      toast.success('文件夹创建成功')
      setNewFolderDialog(false)
      setFolderName('')
      queryClient.invalidateQueries({ queryKey: ['objects', bucket, prefix] })
    } catch {
      toast.error('创建文件夹失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar selectedBucket={bucket} onSelectBucket={handleSelectBucket} />
      <SidebarInset>
        {bucket ? (
          <>
            <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/90 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex w-full items-center gap-2 px-4 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <BreadcrumbNav bucket={bucket} prefix={prefix || ''} onNavigate={handleNavigate} />
                <div className="ml-auto flex items-center gap-2">
                  <ViewToggle mode={viewMode} onChange={setViewMode} />
                  <Button
                    size="sm"
                    className="hidden h-7 sm:flex"
                    onClick={() => setUploadDialog(true)}
                  >
                    <Upload className="size-3.5" />
                    <span className="ml-1.5">上传</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden h-7 sm:flex"
                    onClick={() => setNewFolderDialog(true)}
                  >
                    <FolderPlus className="size-3.5" />
                    <span className="ml-1.5">新建文件夹</span>
                  </Button>
                </div>
              </div>
            </header>

            <div className="flex flex-1 flex-col overflow-hidden">
              {viewMode === 'list' ? (
                <FileTable bucket={bucket} prefix={prefix || ''} onNavigate={handleNavigate} />
              ) : (
                <FileGrid bucket={bucket} prefix={prefix || ''} onNavigate={handleNavigate} />
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">选择一个存储桶开始</p>
          </div>
        )}
      </SidebarInset>

      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="文件夹名称"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFolder} disabled={creating || !folderName.trim()}>
              {creating && <Loader2 className="mr-2 size-4 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {bucket && (
        <UploadDialog
          bucket={bucket}
          prefix={prefix || ''}
          open={uploadDialog}
          onOpenChange={setUploadDialog}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </SidebarProvider>
  )
}
