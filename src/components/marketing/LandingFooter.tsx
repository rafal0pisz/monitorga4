import Link from 'next/link'
import BrandWordmark from '@/components/ui/BrandWordmark'
import type { Locale } from '@/lib/i18n/routes'

// Accepted payment methods, drawn flat on the dark footer background (no
// white chip containers) — each mark kept as close to its real brand
// treatment as a hand-drawn approximation allows. For production-grade
// pixel accuracy, swap these for the official SVGs from each brand's own
// partner/press kit (Visa, Mastercard, Apple, Klarna and Revolut all
// provide them free for merchants).
function PaymentLogos() {
  return (
    <div className="lp-footer-methods">
      <span className="lp-pay-apple">
        <svg viewBox="0 0 90 110" fill="#fff"><path d="M62.6 22.2c-3.8 4.5-9.9 8-15.9 7.5-.7-6.1 2.2-12.5 5.7-16.5C56.2 8.7 62.8 5.4 68.3 5.1c.6 6.3-1.8 12.5-5.7 17.1zm5.6 8.9c-8.8-.5-16.3 5-20.5 5-4.3 0-10.9-4.7-18-4.6-9.3.1-17.8 5.4-22.6 13.7-9.6 16.7-2.5 41.3 6.9 54.8 4.6 6.6 10.1 14 17.3 13.7 6.9-.3 9.6-4.5 17.9-4.5s10.8 4.5 18.1 4.4c7.5-.1 12.2-6.7 16.8-13.3 5.2-7.5 7.3-14.7 7.4-15.1-.2-.1-14.2-5.5-14.3-21.6-.1-13.5 11-19.9 11.5-20.3-6.3-9.3-16-10.3-19.5-10.6z"/></svg>
        Pay
      </span>
      <span className="lp-pay-klarna">Klarna.</span>
      <span className="lp-pay-visa">VISA</span>
      <span className="lp-pay-mc"><span /><span /></span>
      <span className="lp-pay-revolut">Revolut Pay</span>
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
