'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Loader2 } from 'lucide-react'
import { login } from '@/actions/auth'
import { toast } from 'sonner'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await login(formData)
      if (result?.error) {
        toast.error(result.error)
      }
    } catch {
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md border border-neutral-200 shadow-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-xl font-semibold text-neutral-900">CosHub</CardTitle>
          <CardDescription className="text-neutral-500">
            输入密码以访问 COS 管理面板
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <Input
              name="password"
              type="password"
              placeholder="访问密码"
              className="border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900"
              autoFocus
              disabled={loading}
            />
            <Button
              type="submit"
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
              disabled={loading}
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
      </Card>
    </div>
  )
}
