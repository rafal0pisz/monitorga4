import { createAdminClient } from '@/lib/supabase/server'
import BrandWordmark from '@/components/ui/BrandWordmark'
import AcceptInviteClient from '@/components/team/AcceptInviteClient'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: invite } = await admin.from('team_members')
    .select('owner_id, email, accepted_at').eq('invite_token', token).maybeSingle()

  let ownerEmail = ''
  if (invite) {
    const { data: ownerUser } = await admin.auth.admin.getUserById(invite.owner_id)
    ownerEmail = ownerUser?.user?.email ?? 'An AlertGA4 account'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background-tertiary)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <BrandWordmark size={26} />
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)',
          borderRadius: 14, padding: '24px 24px 20px',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 14px', color: 'var(--color-text-primary)' }}>Team invite</p>
          <AcceptInviteClient
            token={token}
            invitedEmail={invite?.email ?? ''}
            ownerEmail={ownerEmail}
            alreadyAccepted={!!invite?.accepted_at}
            notFound={!invite}
          />
        </div>
      </div>
    </div>
  )
}
