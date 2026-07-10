import { createClient } from '@/lib/supabase/server'
import LandingNav from '@/components/marketing/LandingNav'
import LandingFooter from '@/components/marketing/LandingFooter'
import ContactForm from '@/components/marketing/ContactForm'
import { LANDING_BASE_STYLES } from '@/components/marketing/landingStyles'

export const metadata = {
  title: 'Kontakt',
  description: 'Skontaktuj się z zespołem AlertGA4 — wsparcie, testy aplikacji, zgłoszenie błędu lub inne pytanie.',
}

export default async function KontaktPage() {
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

        .kontakt-hero { padding: 56px 0 8px; }
        .kontakt-hero h1 { font-size: clamp(26px, 4vw, 36px); letter-spacing: -0.01em; margin-bottom: 12px; }
        .kontakt-hero p { font-size: 15.5px; color: #5b6570; max-width: 52ch; line-height: 1.6; }

        .kontakt-grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 48px; align-items: start; padding: 40px 0 88px; }
        @media (max-width: 860px) { .kontakt-grid { grid-template-columns: 1fr; gap: 32px; } }

        .kontakt-info-card { background: #f3f6f7; border: 1px solid #e2e6e8; border-radius: 14px; padding: 26px 28px; }
        .kontakt-info-card h3 { font-size: 15px; margin-bottom: 6px; }
        .kontakt-info-card p { font-size: 13.5px; color: #5b6570; line-height: 1.6; margin: 0 0 18px; }
        .kontakt-info-card a.email { display: inline-block; font-family: var(--font-mono), monospace; font-size: 14.5px; font-weight: 600; color: #232b31; text-decoration: none; padding: 9px 14px; border-radius: 8px; background: #fff; border: 1px solid #e2e6e8; margin-bottom: 22px; }
        .kontakt-info-card a.email:hover { border-color: #8b939a; }
        .kontakt-info-addr { font-size: 12.5px; color: #8b939a; line-height: 1.7; border-top: 1px solid #e2e6e8; padding-top: 16px; }

        .contact-form { display: flex; flex-direction: column; gap: 16px; background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; padding: 28px; box-shadow: 0 1px 2px rgba(35,43,49,0.04), 0 20px 40px -24px rgba(35,43,49,0.18); }
        .contact-field { display: flex; flex-direction: column; gap: 6px; }
        .contact-field label { font-size: 12.5px; font-weight: 600; color: #232b31; }
        .contact-field input, .contact-field select, .contact-field textarea {
          font-family: var(--font-sans), sans-serif; font-size: 14px; padding: 10px 12px;
          border-radius: 8px; border: 1px solid #e2e6e8; background: #fff; color: #232b31;
          outline: none; box-sizing: border-box; resize: vertical;
        }
        .contact-field input:focus, .contact-field select:focus, .contact-field textarea:focus { border-color: #8b939a; }
        .contact-error { font-size: 13px; color: #c23b34; background: #fdf2f1; border: 1px solid #f8d4d1; border-radius: 8px; padding: 10px 12px; }

        .contact-sent { text-align: center; padding: 48px 28px; background: #fff; border: 1px solid #e2e6e8; border-radius: 14px; }
        .contact-sent-icon { width: 40px; height: 40px; border-radius: 50%; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 18px; font-weight: 700; }
        .contact-sent h3 { font-size: 17px; margin-bottom: 8px; }
        .contact-sent p { font-size: 13.5px; color: #5b6570; }
      `}</style>

      <LandingNav primaryCta={primaryCta} secondaryCta={secondaryCta} user={!!user} />

      <main>
        <div className="wrap kontakt-hero">
          <h1>Kontakt</h1>
          <p>Pytanie o wsparcie, chęć przetestowania AlertGA4, zgłoszenie błędu albo coś zupełnie innego — napisz do nas.</p>
        </div>

        <div className="wrap kontakt-grid">
          <div className="kontakt-info-card">
            <h3>Napisz bezpośrednio</h3>
            <p>Odpowiadamy zwykle w ciągu jednego dnia roboczego.</p>
            <a className="email" href="mailto:kontakt@bettersteps.pl">kontakt@bettersteps.pl</a>
            <div className="kontakt-info-addr">
              Bettersteps Sp. z o.o.<br />
              ul. Domaniewska 47, 02-672 Warszawa<br />
              KRS 0001011888 · NIP 5214000359
            </div>
          </div>

          <ContactForm />
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
