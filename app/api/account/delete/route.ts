import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, createAdminClient } from '@/lib/supabase/server'

// Self-service account deletion — previously the only path was emailing
// kontakt@bettersteps.pl and waiting for manual cleanup, a real GDPR gap for
// an EU-based paid SaaS. Destructive and irreversible, so:
// - requires an explicit confirm: 'DELETE' in the body (the UI's own confirm
//   step isn't trusted as the only gate — this is a second, server-side one)
// - refuses while a paid subscription is still active, pointing the caller
//   at the existing Stripe portal flow instead of silently cancelling a live
//   subscription as a side effect of account deletion
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (body.confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Missing confirmation' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: profile, error: profileErr } = await admin.from('profiles')
    .select('subscription_status').eq('id', user.id).single()
  if (profileErr) {
    return NextResponse.json({ error: 'Could not check your subscription status — please try again.' }, { status: 500 })
  }
  if (profile?.subscription_status && profile.subscription_status !== 'canceled') {
    return NextResponse.json({
      error: 'You still have an active subscription. Cancel it first under Billing → Manage billing, then come back to delete your account.',
    }, { status: 409 })
  }

  const { data: projects, error: projectsErr } = await admin.from('projects').select('id').eq('owner_id', user.id)
  if (projectsErr) {
    return NextResponse.json({ error: 'Could not look up your projects — please try again.' }, { status: 500 })
  }
  const projectIds = (projects ?? []).map((p: { id: string }) => p.id)

  if (projectIds.length > 0) {
    // Not all of this app's tables are guaranteed to cascade on project
    // deletion — several predate this project's migration tracking (see
    // CLAUDE.md's note on "aspirational" migration history) — so these are
    // deleted explicitly rather than assumed. custom_event_checks/
    // ecommerce_config/parameter_checks/critical_alert_log DO have a tracked
    // "on delete cascade" FK (migrations 005/019) and are left to it.
    const { data: runs } = await admin.from('dqs_runs').select('id').in('project_id', projectIds)
    const runIds = (runs ?? []).map((r: { id: string }) => r.id)
    if (runIds.length > 0) {
      await admin.from('dqs_results').delete().in('run_id', runIds)
    }
    await admin.from('dqs_runs').delete().in('project_id', projectIds)
    await admin.from('alert_log').delete().in('project_id', projectIds)
    const { error: deleteProjectsErr } = await admin.from('projects').delete().in('id', projectIds)
    if (deleteProjectsErr) {
      return NextResponse.json({ error: 'Could not delete your projects — please try again or contact kontakt@bettersteps.pl.' }, { status: 500 })
    }
  }

  await admin.from('profiles').delete().eq('id', user.id)

  const { error: authDeleteErr } = await admin.auth.admin.deleteUser(user.id)
  if (authDeleteErr) {
    // Projects/profile are already gone at this point — surfacing this
    // rather than hiding it, since the account record itself may still be
    // able to sign in again otherwise.
    return NextResponse.json({ error: 'Your data was deleted, but closing the account itself failed — contact kontakt@bettersteps.pl to finish this.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
