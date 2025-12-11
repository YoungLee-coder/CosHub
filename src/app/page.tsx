'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainPanel } from '@/components/main-panel'
import { checkAuth } from '@/lib/api'
import { Loader2 } from 'lucide-react'

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
    </div>
  )
}

function AuthWrapper() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    checkAuth().then((result) => {
      if (!result) {
        router.replace('/login')
      } else {
        setAuthenticated(true)
      }
    })
  }, [router])

  if (authenticated === null) {
    return <LoadingFallback />
  }

  return <MainPanel />
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthWrapper />
    </Suspense>
  )
}
