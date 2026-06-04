import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    )
  }

  const envReady = initStatus?.env.authSecret && initStatus?.env.accessPassword

  const missingEnvVars: string[] = []
  if (initStatus && !initStatus.env.authSecret) missingEnvVars.push('AUTH_SECRET')
  if (initStatus && !initStatus.env.accessPassword) missingEnvVars.push('ACCESS_PASSWORD')

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-[340px]">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mb-1">CosHub</h1>
        {!envReady ? (
          <p className="text-[15px] text-red-600 mb-6">系统尚未完成初始化</p>
        ) : (
          <p className="text-[15px] text-neutral-500 mb-6">输入密码以继续</p>
        )}

        {!envReady && (
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-800">
            <p className="font-medium">缺少环境变量：{missingEnvVars.join('、')}</p>
            <p className="mt-2 text-neutral-600 leading-relaxed">
              请在 EdgeOne Pages 控制台 → 项目设置 → 环境变量中配置，然后重新部署。
            </p>
          </div>
        )}

        {envReady && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              placeholder="访问密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-neutral-200 rounded-lg text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-neutral-400/20"
              autoFocus
              disabled={loading}
            />
            <Button
              type="submit"
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-[15px] text-white rounded-lg font-medium transition-colors disabled:opacity-40"
              disabled={loading || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  验证中...
                </>
              ) : (
                '继续'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
