import { Suspense } from 'react'
import { MainPanel } from '@/components/main-panel'
import { Loader2 } from 'lucide-react'

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MainPanel />
    </Suspense>
  )
}
