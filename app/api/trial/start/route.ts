import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { renderTrialWelcomeEmail } from '@/lib/email/trialWelcome'

const MESSAGES = {
  en: {
    signIn: 'You must be signed in',
    alreadyUsed: "You've already used your free trial.",
    alreadyActive: 'You already have a plan on this account.',
  },
  pl: {
    signIn: 'Musisz być zalogowany',
    alreadyUsed: 'Twój darmowy okres próbny został już wykorzystany.',
    alreadyActive: 'Na tym koncie masz już aktywny plan.',
  },
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const lang = body?.lang === 'pl' ? 'pl' : 'en'
  const t = MESSAGES[lang]

  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return NextResponse.json({ error: t.signIn }, { status: 401 })

  const { data, error } = await session.rpc('start_trial', { p_owner_id: user.id })
  if (error) {
    if (error.message.includes('TRIAL_ALREADY_USED')) {
      return NextResponse.json({ error: t.alreadyUsed }, { status: 400 })
    }
    if (error.message.includes('PLAN_ALREADY_ACTIVE')) {
      return NextResponse.json({ error: t.alreadyActive }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Best-effort — a failed welcome email shouldn't undo the trial that was
  // already granted.
  if (user.email && data?.trial_ends_at) {
    await sendEmail({ to: user.email, ...renderTrialWelcomeEmail(new Date(data.trial_ends_at)) })
  }

  return NextResponse.json({ ok: true })
}
