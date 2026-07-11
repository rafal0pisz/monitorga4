import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingCtaBand from '@/components/marketing/LandingCtaBand'
import PricingCards from '@/components/marketing/PricingCards'
import PlanComparisonTable from '@/components/marketing/PlanComparisonTable'
import StartTrialButton from '@/components/billing/StartTrialButton'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'
import { PLANS, effectivePlanId, TRIAL_DAYS } from '@/lib/billing/plans'
import Link from 'next/link'

export const metadata = {
  title: 'Cennik',
  description: 'Plany AlertGA4: Individual (do 3 usług GA4), Pro (do 10 usług), Agency (do 100 usług). Rozliczenie miesięczne lub roczne w PLN.',
}

export default async function CennikPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentPlanId: string | null = null
  let trialEndsAt: string | null = null
  let trialUsedAt: string | null = null
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('plan_id, trial_ends_at, trial_used_at').eq('id', user.id).single()
    currentPlanId = effectivePlanId(profile?.plan_id, profile?.trial_ends_at)
    trialEndsAt = profile?.trial_ends_at ?? null
    trialUsedAt = profile?.trial_used_at ?? null
  }

  const trialActive = currentPlanId === 'trial' && !!trialEndsAt
  const trialDaysLeft = trialActive ? Math.max(0, Math.ceil((new Date(trialEndsAt!).getTime() - Date.now()) / 86400000)) : 0
  const canStartTrial = !!user && !currentPlanId && !trialUsedAt

  const primaryCta = user
    ? { href: '/dashboard', label: 'Przejdź do panelu' }
    : { href: '/login', label: 'Zarejestruj się przez Google' }
  const secondaryCta = user
    ? null
    : { href: '/login', label: 'Zaloguj się' }

  return (
    <div className="lp">
      <style>{`
        ${LANDING_BASE_STYLES}

        .cennik-hero { padding: 56px 0 8px; text-align: center; }
        .cennik-hero h1 { font-size: clamp(26px, 4vw, 38px); letter-spacing: -0.01em; margin-bottom: 12px; }
        .cennik-hero p { font-size: 15.5px; color: #5b6570; max-width: 540px; margin: 0 auto; line-height: 1.6; }

        .cennik-body { padding: 40px 0 88px; }

        .pricing-toggle { display: flex; justify-content: center; gap: 4px; margin: 0 auto 40px; padding: 4px; background: #f3f6f7; border: 1px solid #e2e6e8; border-radius: 999px; width: fit-content; }
        .pricing-toggle button { font-family: var(--font-sans), sans-serif; font-size: 13.5px; font-weight: 500; color: #5b6570; background: none; border: none; border-radius: 999px; padding: 8px 18px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .pricing-toggle button.active { background: #fff; color: #232b31; box-shadow: 0 1px 2px rgba(35,43,49,0.08); }
        .pricing-toggle-badge { font-size: 10.5px; font-weight: 600; color: #16a34a; background: #f0fdf4; border-radius: 999px; padding: 1px 7px; }

        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 860px) { .pricing-grid { grid-template-columns: 1fr; max-width: 380px; margin: 0 auto; } }

        .pricing-card { background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; padding: 28px; box-shadow: 0 1px 2px rgba(35,43,49,0.04); }
        .pricing-card h3 { font-size: 17px; margin: 0 0 6px; }
        .pricing-limit { font-size: 13px; color: #5b6570; margin: 0 0 20px; }
        .pricing-price { display: flex; align-items: baseline; gap: 6px; }
        .pricing-price .amount { font-size: 32px; font-weight: 600; letter-spacing: -0.01em; color: #232b31; }
        .pricing-price .period { font-size: 13.5px; color: #8b939a; }
        .pricing-permonth { font-size: 12.5px; color: #8b939a; margin: 4px 0 0; }

        .trial-banner { max-width: 640px; margin: 0 auto 40px; padding: 18px 24px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; text-align: center; }
        .trial-banner p { font-size: 13.5px; color: #166534; margin: 0 0 12px; line-height: 1.5; }
        .trial-banner p:last-child { margin-bottom: 0; }

        .plan-table-section { padding: 8px 0 88px; }
        .plan-table-section h2 { font-size: clamp(20px, 3vw, 26px); letter-spacing: -0.01em; text-align: center; margin: 0 0 32px; }
        .plan-table-wrap { overflow-x: auto; }
        .plan-table { width: 100%; border-collapse: collapse; min-width: 560px; }
        .plan-table th, .plan-table td { padding: 13px 16px; text-align: center; border-bottom: 1px solid #e2e6e8; font-size: 13.5px; }
        .plan-table thead th { font-size: 13px; font-weight: 600; color: #232b31; background: #f3f6f7; }
        .plan-table thead th:first-child { background: transparent; }
        .plan-table tbody th { text-align: left; font-weight: 500; color: #232b31; white-space: nowrap; }
        .plan-table tbody td { color: #5b6570; }
        .plan-table tbody td[data-check="true"] { color: #16a34a; font-weight: 600; }
        .plan-table tbody tr:last-child th, .plan-table tbody tr:last-child td { border-bottom: none; }

        /* Below 640px the 4-column table becomes unreadably cramped (or
           needs horizontal scrolling to use at all) — instead, each feature
           row turns into its own card, with the 3 plan values stacked and
           labeled via their own data-label attribute. */
        @media (max-width: 640px) {
          .plan-table-wrap { overflow-x: visible; }
          .plan-table { min-width: 0; }
          .plan-table thead { display: none; }
          .plan-table, .plan-table tbody, .plan-table tr, .plan-table th, .plan-table td { display: block; width: 100%; }
          .plan-table tbody tr {
            margin-bottom: 14px; border: 1px solid #e2e6e8; border-radius: 10px; overflow: hidden;
          }
          .plan-table tbody tr:last-child { margin-bottom: 0; }
          .plan-table tbody th {
            background: #f3f6f7; padding: 10px 14px; border-bottom: 1px solid #e2e6e8; white-space: normal;
          }
          .plan-table tbody td {
            display: flex; align-items: center; justify-content: space-between;
            padding: 9px 14px; border-bottom: 1px solid #eef1f2; text-align: right;
          }
          .plan-table tbody td:last-child { border-bottom: none; }
          .plan-table tbody td::before {
            content: attr(data-label); font-weight: 600; color: #232b31; text-align: left;
          }
        }
      `}</style>

      <LandingNav primaryCta={primaryCta} secondaryCta={secondaryCta} user={!!user} />

      <main>
        <div className="wrap cennik-hero">
          <h1>Cennik</h1>
          <p>Wybierz plan dopasowany do liczby monitorowanych usług GA4. Bez zobowiązań — anulujesz w każdej chwili.</p>
        </div>

        <div className="wrap cennik-body">
          {trialActive && (
            <div className="trial-banner">
              <p>Twój bezpłatny okres próbny (na zasadach planu Agency) jest aktywny — zostało {trialDaysLeft} {trialDaysLeft === 1 ? 'dzień' : 'dni'}.</p>
            </div>
          )}
          {canStartTrial && (
            <div className="trial-banner">
              <p>Wypróbuj AlertGA4 za darmo przez {TRIAL_DAYS} dni na zasadach planu Agency (do 100 usług GA4) — bez podpinania karty. Można skorzystać jednorazowo.</p>
              <StartTrialButton label={`Rozpocznij ${TRIAL_DAYS}-dniowy okres próbny`} lang="pl" />
            </div>
          )}
          {!user && (
            <div className="trial-banner">
              <p>Wypróbuj AlertGA4 za darmo przez {TRIAL_DAYS} dni na zasadach planu Agency — bez podpinania karty.</p>
              <Link href="/login" className="btn btn--primary btn--sm">Zarejestruj się przez Google</Link>
            </div>
          )}
          <PricingCards
            loggedIn={!!user}
            currentPlanId={currentPlanId}
            plans={PLANS.map(p => ({ id: p.id, name: p.name, projectLimit: p.projectLimit, priceMonthlyPLN: p.priceMonthlyPLN, priceYearlyPLN: p.priceYearlyPLN }))}
          />
        </div>

        <div className="wrap plan-table-section">
          <h2>Porównanie planów</h2>
          <PlanComparisonTable />
        </div>

        <LandingCtaBand primaryCta={primaryCta} secondaryCta={secondaryCta} />
      </main>

      <LandingFooter />
    </div>
  )
}
