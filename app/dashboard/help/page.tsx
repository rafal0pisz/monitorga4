import { getAuthUser } from '@/lib/supabase/server'
import ContactSupportForm from '@/components/dashboard/ContactSupportForm'

export default async function HelpPage() {
  const bypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
  const user = bypass ? null : await getAuthUser()

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Help</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
          Reach us at <a href="mailto:kontakt@bettersteps.pl" style={{ color: '#16a34a' }}>kontakt@bettersteps.pl</a>, or send a message below.
        </p>
      </div>
      <ContactSupportForm defaultEmail={user?.email ?? undefined} />
    </div>
  )
}
