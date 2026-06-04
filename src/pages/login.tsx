import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Loader2, AlertTriangle } from 'lucide-react'
import { checkAuth, login } from '@/features/auth/client/auth.api'
import { checkInit } from '@/features/init/client/init.api'
import type { InitStatus } from '@/features/init/client/init.api'
import { toast } from 'sonner'

export function LoginPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [initStatus, setInitStatus] = useState<InitStatus | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    void checkInit()
      .then((status) => {
        setInitStatus(status)
        const envReady = status.env.authSecret && status.env.accessPassword
        if (!envReady) {
          setChecking(false)
          return
        }
        void checkAuth().then((authenticated) => {
          if (authenticated) {
            if (status.initialized) {
              navigate('/', { replace: true })
            } else {
              navigate('/setup', { replace: true })
            }
          } else {
            setChecking(false)
          }
        })
      })
      .catch(() => {
        setChecking(false)
      })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return

    setLoading(true)
    try {
      const result = await login(password)
      if (result.error) {
        toast.error(result.error)
      } else {
        await queryClient.invalidateQueries({ queryKey: ['auth'] })
        if (initStatus?.initialized) {
          navigate('/', { replace: true })
        } else {
          navigate('/setup', { replace: true })
        }
      }
    } catch {
      toast.error('登录失败')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  const envReady = initStatus?.env.authSecret && initStatus?.env.accessPassword

  const missingEnvVars: string[] = []
  if (initStatus && !initStatus.env.authSecret) missingEnvVars.push('AUTH_SECRET')
  if (initStatus && !initStatus.env.accessPassword) missingEnvVars.push('ACCESS_PASSWORD')

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md border border-neutral-200 shadow-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center">
            {envReady ? (
              <Lock className="w-6 h-6 text-white" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-white" />
            )}
          </div>
          <CardTitle className="text-xl font-semibold text-neutral-900">CosHub</CardTitle>
          <CardDescription className="text-neutral-500">
            {envReady ? '输入密码以访问 COS 管理面板' : '系统尚未完成初始化'}
          </CardDescription>
        </CardHeader>

        {!envReady && (
          <CardContent>
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              <p className="font-medium mb-1">环境变量未配置</p>
              <p className="text-red-700">缺少必要的环境变量：{missingEnvVars.join('、')}</p>
              <p className="mt-2 text-neutral-600">
                请在 EdgeOne Pages 控制台 → 你的项目 → 设置 → 环境变量中配置以上变量，然后重新部署。
              </p>
            </div>
          </CardContent>
        )}

        {envReady && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  '进入系统'
                )}
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
