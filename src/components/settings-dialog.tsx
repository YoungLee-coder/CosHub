import { useState, useEffect } from 'react'
import { Settings, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSettings, updateSettings } from '@/features/settings/client/settings.api'
import type { SettingsResponse } from '@/features/settings/client/settings.api'

interface SettingsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SettingsDialog({ open: controlledOpen, onOpenChange }: SettingsDialogProps = {}) {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<SettingsResponse | null>(null)
  const [cosSecretId, setCosSecretId] = useState('')
  const [cosSecretKey, setCosSecretKey] = useState('')
  const [cosRegion, setCosRegion] = useState('')
  const [cdnDomain, setCdnDomain] = useState('')

  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open])

  async function loadSettings() {
    setLoading(true)
    try {
      const result = await getSettings()
      setData(result)
      setCosSecretId('')
      setCosSecretKey('')
      setCosRegion(result.cosRegion)
      setCdnDomain(result.cdnDomain)
    } catch {
      toast.error('加载设置失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateSettings({
        cosSecretId: cosSecretId || undefined,
        cosSecretKey: cosSecretKey || undefined,
        cosRegion,
        cdnDomain,
      })
      toast.success('设置已保存')
      setCosSecretId('')
      setCosSecretKey('')
      await loadSettings()
    } catch {
      toast.error('保存设置失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200"
          >
            <Settings className="w-4 h-4 mr-2" />
            设置
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>COS 配置通过 KV 存储，修改即时生效无需重新部署</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : data ? (
          <>
            <div className="space-y-4">
              <div className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-600">
                <p className="font-medium">环境变量（不可在此修改，需在 EdgeOne 控制台配置）</p>
                <p className="mt-1">ACCESS_PASSWORD · AUTH_SECRET</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cosSecretId">COS SecretId</Label>
                <Input
                  id="cosSecretId"
                  type="password"
                  placeholder={
                    data.cosSecretId ? '已设置，输入新值以更新' : '未设置，请输入 SecretId'
                  }
                  value={cosSecretId}
                  onChange={(e) => setCosSecretId(e.target.value)}
                />
                <p className="text-xs text-neutral-500">
                  当前状态：{data.cosSecretId ? '已设置' : '未设置'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cosSecretKey">COS SecretKey</Label>
                <Input
                  id="cosSecretKey"
                  type="password"
                  placeholder={
                    data.cosSecretKey ? '已设置，输入新值以更新' : '未设置，请输入 SecretKey'
                  }
                  value={cosSecretKey}
                  onChange={(e) => setCosSecretKey(e.target.value)}
                />
                <p className="text-xs text-neutral-500">
                  当前状态：{data.cosSecretKey ? '已设置' : '未设置'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cosRegion">COS Region</Label>
                <Input
                  id="cosRegion"
                  type="text"
                  placeholder="例如：ap-guangzhou"
                  value={cosRegion}
                  onChange={(e) => setCosRegion(e.target.value)}
                />
                <p className="text-xs text-neutral-500">默认值：ap-guangzhou</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cdnDomain">CDN 域名</Label>
                <Input
                  id="cdnDomain"
                  type="text"
                  placeholder="例如：cdn.example.com"
                  value={cdnDomain}
                  onChange={(e) => setCdnDomain(e.target.value)}
                />
                <p className="text-xs text-neutral-500">当前状态：{data.cdnDomain || '未设置'}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
