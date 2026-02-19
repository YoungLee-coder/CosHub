import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/features/auth/server/auth.service'

export default async function HomePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const authenticated = await verifySessionToken(token)

  if (!authenticated) {
    redirect('/login')
  }

  return <DashboardLayout />
}
