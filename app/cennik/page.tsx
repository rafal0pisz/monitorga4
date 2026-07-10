import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import LandingCtaBand from '@/components/marketing/LandingCtaBand'
import PricingCards from '@/components/marketing/PricingCards'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'
import { PLANS } from '@/lib/billing/plans'

export const metadata = {
  title: 'Cennik',
  description: 'Plany AlertGA4: Individual (do 3 usług GA4), Pro (do 10 usług), Agency (do 100 usług). Rozliczenie miesięczne lub roczne w PLN.',
}

export default async function CennikPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
      `}</style>

      <LandingNav primaryCta={primaryCta} secondaryCta={secondaryCta} user={!!user} />

      <main>
        <div className="wrap cennik-hero">
          <h1>Cennik</h1>
          <p>Wybierz plan dopasowany do liczby monitorowanych usług GA4. Bez zobowiązań — anulujesz w każdej chwili.</p>
        </div>

        <div className="wrap cennik-body">
          <PricingCards
            loggedIn={!!user}
            plans={PLANS.map(p => ({ id: p.id, name: p.name, projectLimit: p.projectLimit, priceMonthlyPLN: p.priceMonthlyPLN, priceYearlyPLN: p.priceYearlyPLN }))}
          />
        </div>

        <LandingCtaBand primaryCta={primaryCta} secondaryCta={secondaryCta} />
      </main>

      <LandingFooter />
    </div>
  )
}
