'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { getUploadUrl } from '@/lib/api'
import { formatFileSize, joinPath } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UploadItem {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

interface UploadDialogProps {
  bucket: string
  prefix: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: () => void
}

export function UploadDialog({ bucket, prefix, open, onOpenChange, onUploadComplete }: UploadDialogProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = async (file: File) => {
    const key = joinPath(prefix, file.name)
    setUploads((prev) => prev.map((u) => (u.file === file ? { ...u, status: 'uploading' as const } : u)))

    try {
      const url = await getUploadUrl(bucket, key)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', url)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploads((prev) => prev.map((u) => (u.file === file ? { ...u, progress } : u)))
          }
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(file)
      })
      setUploads((prev) => prev.map((u) => (u.file === file ? { ...u, status: 'completed' as const, progress: 100 } : u)))
    } catch (error) {
      setUploads((prev) => prev.map((u) => (u.file === file ? { ...u, status: 'error' as const, error: (error as Error).message } : u)))
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    const newUploads: UploadItem[] = acceptedFiles.map((file) => ({ file, progress: 0, status: 'pending' as const }))
    setUploads((prev) => [...prev, ...newUploads])
    setIsUploading(true)
    for (const item of newUploads) { await uploadFile(item.file) }
    setIsUploading(false)
    toast.success(`已上传 ${acceptedFiles.length} 个文件`)
    onUploadComplete()
  }, [bucket, prefix, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: isUploading })
  const removeUpload = (file: File) => setUploads((prev) => prev.filter((u) => u.file !== file))
  const clearCompleted = () => setUploads((prev) => prev.filter((u) => u.status !== 'completed'))
  const handleClose = (open: boolean) => { if (!isUploading) { setUploads([]); onOpenChange(open) } }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>上传文件</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
            }`}>
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 mx-auto mb-3 text-neutral-400" />
            <p className="text-sm text-neutral-600">{isDragActive ? '释放以上传文件' : '拖拽文件到此处'}</p>
            <p className="text-xs text-neutral-400 mt-1">或点击选择文件</p>
          </div>

          {uploads.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploads.map((upload, index) => (
                <div key={`${upload.file.name}-${index}`} className="flex items-center gap-3 p-2 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 truncate">{upload.file.name}</p>
                    <p className="text-xs text-neutral-500">{formatFileSize(upload.file.size)}</p>
                  </div>
                  {upload.status === 'uploading' && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-900 transition-all" style={{ width: `${upload.progress}%` }} />
                      </div>
                      <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" />
                    </div>
                  )}
                  {upload.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {upload.status === 'error' && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <button onClick={() => removeUpload(upload.file)}><X className="w-4 h-4 text-neutral-400 hover:text-neutral-900" /></button>
                    </div>
                  )}
                  {upload.status === 'pending' && <span className="text-xs text-neutral-500">等待中</span>}
                </div>
              ))}
            </div>
          )}

          {uploads.some((u) => u.status === 'completed') && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearCompleted}>清除已完成</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
