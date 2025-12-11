'use client'

import { useState } from 'react'
import { useQueryState } from 'nuqs'
import { BucketSidebar } from './bucket-sidebar'
import { FileTable } from './file-table'
import { BreadcrumbNav } from './breadcrumb-nav'
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
import { createFolder } from '@/lib/api'
import { toast } from 'sonner'

export function MainPanel() {
  const queryClient = useQueryClient()
  const [bucket, setBucket] = useQueryState('bucket')
  const [prefix, setPrefix] = useQueryState('prefix', { defaultValue: '' })
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
    <div className="flex h-screen bg-white text-neutral-900">
      <BucketSidebar selectedBucket={bucket} onSelectBucket={handleSelectBucket} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {bucket ? (
          <>
            <header className="p-4 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <BreadcrumbNav bucket={bucket} prefix={prefix || ''} onNavigate={handleNavigate} />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setUploadDialog(true)}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    上传
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewFolderDialog(true)}
                    className="border-neutral-300 hover:bg-neutral-100"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    新建文件夹
                  </Button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-4">
              <FileTable bucket={bucket} prefix={prefix || ''} onNavigate={handleNavigate} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-neutral-100 flex items-center justify-center">
                <FolderPlus className="w-8 h-8 text-neutral-400" />
              </div>
              <h2 className="text-lg font-medium text-neutral-700 mb-1">选择存储桶</h2>
              <p className="text-neutral-500 text-sm">从左侧选择一个存储桶开始管理文件</p>
            </div>
          </div>
        )}
      </main>

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
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
    </div>
  )
}
