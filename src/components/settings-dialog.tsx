'use client'

import { useState, useEffect } from 'react'
import { Settings, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSettings, updateSettings } from '@/lib/api'

interface SettingsData {
  kvAvailable: boolean
  settings: {
    accessPassword: string
    cdnDomain: string
  }
  sources: {
    accessPassword: 'kv' | 'env' | 'none'
    cdnDomain: 'kv' | 'env' | 'none'
  }
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<SettingsData | null>(null)
  const [newPassword, setNewPassword] = useState('')
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
      setCdnDomain(result.settings.cdnDomain)
      setNewPassword('')
    } catch {
      toast.error('加载设置失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!data?.kvAvailable) {
      toast.error('KV 存储不可用，无法保存设置')
      return
    }

    setSaving(true)
    try {
      await updateSettings({
        accessPassword: newPassword || undefined,
        cdnDomain,
      })
      toast.success('设置已保存')
      setNewPassword('')
      await loadSettings()
    } catch {
      toast.error('保存设置失败')
    } finally {
      setSaving(false)
    }
  }

  function getSourceLabel(source: 'kv' | 'env' | 'none') {
    switch (source) {
      case 'kv':
        return '来自 KV'
      case 'env':
        return '来自环境变量'
      case 'none':
        return '未设置'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200"
        >
          <Settings className="w-4 h-4 mr-2" />
          设置
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            管理应用配置，KV 存储的配置优先于环境变量
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            {!data.kvAvailable && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">KV 存储未绑定</p>
                <p>请在 EdgeOne Pages 控制台绑定 KV namespace（变量名：SETTINGS_KV），即可在此动态修改配置。</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">访问密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="输入新密码以更新"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={!data.kvAvailable}
              />
              <p className="text-xs text-neutral-500">
                当前状态：{getSourceLabel(data.sources.accessPassword)}
                {data.settings.accessPassword && ' (已设置)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cdnDomain">CDN 域名</Label>
              <Input
                id="cdnDomain"
                type="text"
                placeholder="例如：cdn.example.com"
                value={cdnDomain}
                onChange={(e) => setCdnDomain(e.target.value)}
                disabled={!data.kvAvailable}
              />
              <p className="text-xs text-neutral-500">
                当前状态：{getSourceLabel(data.sources.cdnDomain)}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving || !data.kvAvailable}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
