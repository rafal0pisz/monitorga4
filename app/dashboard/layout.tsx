import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppSidebar from '@/components/layout/AppSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  if (!bypass) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background-tertiary)' }}>
      <AppSidebar />
      <main style={{ flex: 1, minWidth: 0, padding: '32px 36px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
