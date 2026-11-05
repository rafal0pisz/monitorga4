import Link from 'next/link'
import BrandWordmark from '@/components/ui/BrandWordmark'
import type { Locale } from '@/lib/i18n/routes'

// Accepted payment methods. Apple Pay, Klarna and Revolut Pay use the
// brands' own official badge images (public/payments/) exactly as
// provided, unedited — do not re-draw these as CSS/SVG approximations.
// Visa and Mastercard are still hand-drawn flat marks; for production-grade
// pixel accuracy those could also be swapped for official assets from each
// brand's own partner/press kit.
function PaymentLogos() {
  return (
    <div className="lp-footer-methods">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/payments/apple-pay.webp" alt="Apple Pay" className="lp-pay-img lp-pay-img--apple" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/payments/klarna.webp" alt="Klarna" className="lp-pay-img lp-pay-img--klarna" />
      <span className="lp-pay-visa">VISA</span>
      <span className="lp-pay-mc"><span /><span /></span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/payments/revolut-pay.png" alt="Revolut Pay" className="lp-pay-img lp-pay-img--revolut" />
    </div>
  )
}

function PaymentRow({ lang }: { lang: Locale }) {
  return (
    <div className="wrap lp-footer-payment">
      <div className="lp-footer-ssl">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        {lang === 'en' ? (
          <span><b>Secure checkout</b> with SSL encryption</span>
        ) : (
          <span><b>Bezpieczne zakupy</b> dzięki szyfrowaniu SSL</span>
        )}
      </div>
      <PaymentLogos />
    </div>
  )
}

export default function LandingFooter({ lang = 'pl' }: { lang?: Locale }) {
  if (lang === 'en') {
    return (
      <footer className="lp-footer">
        <div className="wrap lp-footer-body">
          <div>
            <BrandWordmark size={18} dark />
            <div className="lp-footer-addr">
              Bettersteps Sp. z o.o.<br />
              ul. Domaniewska 47, 02-672 Warsaw, Poland<br />
              KRS 0001011888 · NIP (VAT ID) 5214000359
            </div>
          </div>
          <div className="lp-footer-col">
            <h3>Product</h3>
            <a href="/en#how-it-works">Process</a>
            <a href="/en#what-we-check">Monitoring</a>
            <a href="/en#who-its-for">Who it&rsquo;s for</a>
            <Link href="/en/features">Features</Link>
            <Link href="/en/pricing">Pricing</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/en/contact">Contact</Link>
          </div>
          <div className="lp-footer-col">
            <h3>Legal</h3>
            <Link href="/en/privacy">Privacy Policy</Link>
            <Link href="/en/terms">Terms of Service</Link>
            <a href="#" className="csconsentlink">Cookie settings</a>
          </div>
          <div className="lp-footer-col">
            <h3>Contact</h3>
            <Link href="/en/contact">Contact form</Link>
            <a href="mailto:kontakt@bettersteps.pl">kontakt@bettersteps.pl</a>
            <a href="https://alertga4.pl/en">alertga4.pl</a>
          </div>
        </div>
        <PaymentRow lang="en" />
        <div className="wrap lp-footer-bottom">
          <span>© {new Date().getFullYear()} Bettersteps Sp. z o.o. · AlertGA4</span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="lp-footer">
      <div className="wrap lp-footer-body">
        <div>
          <BrandWordmark size={18} dark />
          <div className="lp-footer-addr">
            Bettersteps Sp. z o.o.<br />
            ul. Domaniewska 47, 02-672 Warszawa<br />
            KRS 0001011888 · NIP 5214000359
          </div>
        </div>
        <div className="lp-footer-col">
          <h3>Produkt</h3>
          <a href="/#jak-to-dziala">Proces</a>
          <a href="/#co-sprawdzamy">Monitoring</a>
          <a href="/#dla-kogo">Dla kogo</a>
          <Link href="/funkcje">Funkcje</Link>
          <Link href="/cennik">Cennik</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/kontakt">Kontakt</Link>
        </div>
        <div className="lp-footer-col">
          <h3>Prawne</h3>
          <Link href="/privacy">Polityka prywatności</Link>
          <Link href="/terms">Regulamin</Link>
          <a href="#" className="csconsentlink">Ustawienia ciasteczek</a>
        </div>
        <div className="lp-footer-col">
          <h3>Kontakt</h3>
          <Link href="/kontakt">Formularz kontaktowy</Link>
          <a href="mailto:kontakt@bettersteps.pl">kontakt@bettersteps.pl</a>
          <a href="https://alertga4.pl">alertga4.pl</a>
        </div>
      </div>
      <PaymentRow lang="pl" />
      <div className="wrap lp-footer-bottom">
        <span>© {new Date().getFullYear()} Bettersteps Sp. z o.o. · AlertGA4</span>
      </div>
    </footer>
  )
}
