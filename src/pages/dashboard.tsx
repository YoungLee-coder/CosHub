import { AuthGuard } from '@/features/auth/auth-guard'
import { DashboardLayout } from '@/components/dashboard-layout'

export function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardLayout />
    </AuthGuard>
  )
}
