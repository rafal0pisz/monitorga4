interface Row {
  label: string
  individual: string
  pro: string
  agency: string
}

// Poza limitem usług, funkcjonalność monitoringu jest dziś identyczna na
// każdym planie — realne różnice między pakietami to limit oraz poziom
// wsparcia. Konsultacja z analitykiem to nowy wyróżnik najwyższego planu.
const ROWS: Row[] = [
  { label: 'Monitorowane usługi GA4', individual: 'do 3', pro: 'do 10', agency: 'do 100' },
  { label: 'Codzienny automatyczny monitoring', individual: '✓', pro: '✓', agency: '✓' },
  { label: 'Zdarzenia niestandardowe, parametry i e-commerce (na usługę)', individual: 'do 10', pro: 'bez limitu', agency: 'bez limitu' },
  { label: 'Alerty e-mail przy wykrytych błędach', individual: '✓', pro: '✓', agency: '✓' },
  { label: 'Kreator konfiguracji z podpowiedziami z GA4', individual: '✓', pro: '✓', agency: '✓' },
  { label: 'Wsparcie', individual: 'e-mail', pro: 'e-mail', agency: 'dedykowany kanał' },
  { label: 'Konsultacja z analitykiem GA4', individual: '—', pro: '—', agency: '1h / miesiąc' },
]

const PLAN_KEYS = ['individual', 'pro', 'agency'] as const

export default function PlanComparisonTable() {
  return (
    <div className="plan-table-wrap">
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
                <td key={key} data-check={row[key] === '✓' ? 'true' : undefined}>{row[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
