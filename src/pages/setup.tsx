import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Lock, Loader2, AlertTriangle, Server } from 'lucide-react'
import { toast } from 'sonner'
import { checkInit } from '@/features/init/client/init.api'
import { login, checkAuth } from '@/features/auth/client/auth.api'
import { getSettings, updateSettings } from '@/features/settings/client/settings.api'

type SetupStep = 'checking' | 'env-missing' | 'login' | 'cos-config'

export function SetupPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [cosSecretId, setCosSecretId] = useState('')
  const [cosSecretKey, setCosSecretKey] = useState('')
  const [localCosRegion, setLocalCosRegion] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const initQuery = useQuery({ queryKey: ['init'], queryFn: checkInit })

  const needAuthCheck = useMemo(() => {
    if (!initQuery.data) return false
    if (initQuery.data.initialized) return true
    return initQuery.data.env.authSecret && initQuery.data.env.accessPassword
  }, [initQuery.data])

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: checkAuth,
    enabled: needAuthCheck,
  })

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    enabled: authQuery.data === true && !initQuery.data?.initialized,
  })

  const step = useMemo<SetupStep>(() => {
    if (initQuery.isError) return 'env-missing'
    if (!initQuery.data) return 'checking'
    if (initQuery.data.initialized) return 'checking'
    if (
      !initQuery.data.env.authSecret ||
      !initQuery.data.env.accessPassword ||
      !initQuery.data.kv.available
    )
      return 'env-missing'
    if (!authQuery.data) return 'login'
    return 'cos-config'
  }, [initQuery.data, initQuery.isError, authQuery.data])

  useEffect(() => {
    if (!initQuery.data?.initialized) return
    if (authQuery.data === true) {
      navigate('/', { replace: true })
    } else if (authQuery.data === false) {
      navigate('/login', { replace: true })
    }
  }, [initQuery.data?.initialized, authQuery.data, navigate])

  const initStatus = initQuery.data
  const settingsData = settingsQuery.data ?? null
  const cosRegion = localCosRegion ?? settingsData?.cosRegion ?? 'ap-guangzhou'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    try {
      const result = await login(password)
      if (result.error) {
        toast.error(result.error)
      } else {
        await queryClient.invalidateQueries({ queryKey: ['auth'] })
      }
    } catch {
      toast.error('登录失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveConfig() {
    setLoading(true)
    try {
      await updateSettings({
        cosSecretId: cosSecretId || undefined,
        cosSecretKey: cosSecretKey || undefined,
        cosRegion,
      })
      toast.success('配置已保存')
      await queryClient.invalidateQueries({ queryKey: ['init'] })
    } catch {
      toast.error('保存配置失败')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (step === 'env-missing') {
    const missingEnvVars: string[] = []
    if (initStatus && !initStatus.env.authSecret) missingEnvVars.push('AUTH_SECRET')
    if (initStatus && !initStatus.env.accessPassword) missingEnvVars.push('ACCESS_PASSWORD')
    const kvUnavailable = initStatus && !initStatus.kv.available

    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <Card className="w-full max-w-md border border-neutral-200 shadow-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <CardTitle className="text-xl font-semibold text-neutral-900">系统未就绪</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {missingEnvVars.length > 0 && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">缺少必要环境变量</p>
                <p className="mt-1">请在 EdgeOne Pages 控制台 → 环境变量中配置：</p>
                <ul className="mt-2 list-disc list-inside">
                  {missingEnvVars.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
            {kvUnavailable && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">KV 未绑定</p>
                <p className="mt-1">
                  请在 EdgeOne Pages 控制台 → KV Namespace 绑定中，创建或选择一个 KV
                  namespace，绑定变量名设为{' '}
                  <code className="bg-red-100 px-1 rounded">coshub_kv</code>
                </p>
              </div>
            )}
            <Button
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['init'] })}
            >
              重新检查
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <Card className="w-full max-w-md border border-neutral-200 shadow-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl font-semibold text-neutral-900">登录以完成配置</CardTitle>
            <p className="text-sm text-neutral-500">环境变量已就绪，登录后需要配置 COS 凭证</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="访问密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900"
                autoFocus
                disabled={loading}
              />
              <Button
                type="submit"
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
                disabled={loading || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    验证中...
                  </>
                ) : (
                  '登录'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'cos-config') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <Card className="w-full max-w-lg border border-neutral-200 shadow-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-neutral-900">配置 COS 凭证</CardTitle>
            <p className="text-sm text-neutral-500">配置腾讯云 COS 凭证以启用存储管理功能</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cosSecretId">SecretId</Label>
                <Input
                  id="cosSecretId"
                  type="password"
                  placeholder={
                    settingsData?.cosSecretId ? '已设置，输入新值以更新' : '请输入 SecretId'
                  }
                  value={cosSecretId}
                  onChange={(e) => setCosSecretId(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cosSecretKey">SecretKey</Label>
                <Input
                  id="cosSecretKey"
                  type="password"
                  placeholder={
                    settingsData?.cosSecretKey ? '已设置，输入新值以更新' : '请输入 SecretKey'
                  }
                  value={cosSecretKey}
                  onChange={(e) => setCosSecretKey(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cosRegion">Region</Label>
                <Input
                  id="cosRegion"
                  type="text"
                  placeholder="例如：ap-guangzhou"
                  value={cosRegion}
                  onChange={(e) => setLocalCosRegion(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
                onClick={() => void handleSaveConfig()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '完成配置'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
