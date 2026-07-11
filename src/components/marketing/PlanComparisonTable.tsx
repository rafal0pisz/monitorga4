import PlanComparisonCarousel from './PlanComparisonCarousel'

export interface Row {
  label: string
  individual: string
  pro: string
  agency: string
}

// Poza limitem usług, funkcjonalność monitoringu jest dziś identyczna na
// każdym planie — realne różnice między pakietami to limit oraz poziom
// wsparcia. Konsultacja z analitykiem to nowy wyróżnik najwyższego planu.
export const ROWS: Row[] = [
  { label: 'Monitorowane usługi GA4', individual: 'do 3', pro: 'do 10', agency: 'do 100' },
  { label: 'Codzienny automatyczny monitoring', individual: '✓', pro: '✓', agency: '✓' },
  { label: 'Zdarzenia niestandardowe, parametry i e-commerce (na usługę)', individual: 'do 5', pro: 'bez limitu', agency: 'bez limitu' },
  { label: 'Alerty e-mail przy wykrytych błędach', individual: '✓', pro: '✓', agency: '✓' },
  { label: 'Kreator konfiguracji z podpowiedziami z GA4', individual: '✓', pro: '✓', agency: '✓' },
  { label: 'Wsparcie', individual: 'e-mail', pro: 'e-mail', agency: 'dedykowany kanał' },
  { label: 'Konsultacja z analitykiem GA4', individual: '—', pro: '—', agency: '1h / miesiąc' },
]

export const PLAN_KEYS = ['individual', 'pro', 'agency'] as const
export const PLAN_LABELS: Record<typeof PLAN_KEYS[number], string> = { individual: 'Individual', pro: 'Pro', agency: 'Agency' }

export default function PlanComparisonTable() {
  return (
    <>
      {/* Desktop — full table, all 3 plans visible at once (≥641px) */}
      <div className="plan-table-wrap plan-table-desktop">
        <table className="plan-table">
          <thead>
            <tr>
              <th></th>
              <th>Individual</th>
              <th>Pro</th>
              <th>Agency</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {PLAN_KEYS.map(key => (
                  <td key={key} data-label={PLAN_LABELS[key]} data-check={row[key] === '✓' ? 'true' : undefined}>{row[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — one plan fully in view at a time, swipe/arrows/dots to move
          between them (≤640px) */}
      <div className="plan-table-mobile">
        <PlanComparisonCarousel />
      </div>
    </>
  )
}
