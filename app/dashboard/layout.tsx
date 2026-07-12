import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppSidebar from '@/components/layout/AppSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  if (!bypass) {
    const user = await getAuthUser()
    if (!user) redirect('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
      <AppSidebar />
      <main className="app-main" style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
