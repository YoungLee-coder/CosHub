import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { checkAuth } from '@/features/auth/client/auth.api'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: checkAuth,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (!data) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
