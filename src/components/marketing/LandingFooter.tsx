import Link from 'next/link'
import BrandWordmark from '@/components/ui/BrandWordmark'

export default function LandingFooter() {
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
          <Link href="/funkcje">Funkcje</Link>
          <a href="/#dla-kogo">Dla kogo</a>
        </div>
        <div className="lp-footer-col">
          <h3>Prawne</h3>
          <Link href="/privacy">Polityka prywatności</Link>
          <Link href="/terms">Regulamin</Link>
        </div>
        <div className="lp-footer-col">
          <h3>Kontakt</h3>
          <Link href="/kontakt">Formularz kontaktowy</Link>
          <a href="mailto:kontakt@bettersteps.pl">kontakt@bettersteps.pl</a>
          <a href="https://www.bettersteps.pl">www.bettersteps.pl</a>
        </div>
      </div>
      <div className="wrap lp-footer-bottom">
        <span>© {new Date().getFullYear()} Bettersteps Sp. z o.o. · AlertGA4</span>
      </div>
    </footer>
  )
}
