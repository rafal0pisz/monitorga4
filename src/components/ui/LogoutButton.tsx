'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
export default function LogoutButton() {
  const router = useRouter()
  async function handleLogout() { await createClient().auth.signOut(); router.push('/login') }
  return <button onClick={handleLogout} style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Sign out</button>
}
