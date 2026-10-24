import PlanComparisonCarousel from './PlanComparisonCarousel'

export interface Row {
  label: string
  lite: string
  pro: string
  agency: string
}

// Lite (plan_id 'lite' — renamed from 'individual' in migration 033) caps
// custom events/e-commerce/parameters at 5 each per service
// (plan_item_limit() in supabase/migrations/031_...) — Pro and Agency stay
// unlimited. Beyond that and the service count itself, the monitoring
// functionality is identical across plans; support level and the analyst
// consultation (Agency only) are the other real differences.
export const ROWS: Row[] = [
  { label: 'Monitorowane usługi GA4', lite: 'do 3', pro: 'do 15', agency: 'do 100' },
  // Lite/Pro have no team-invite feature at all (app/api/team/invite/route.ts
  // only allows 'agency'/'trial') — 1 seat isn't a marketing number, it's
  // literally the only account that can ever access those plans' projects.
  // Agency's 5 mirrors MAX_TEAM_SEATS in src/lib/team/access.ts exactly.
  { label: 'Użytkownicy', lite: '1', pro: '1', agency: '5' },
  { label: 'Codzienny automatyczny monitoring', lite: '✓', pro: '✓', agency: '✓' },
  { label: 'Niestandardowe zdarzenia (na usługę)', lite: '5', pro: 'bez limitu', agency: 'bez limitu' },
  { label: 'Zdarzenia e-commerce (na usługę)', lite: '5', pro: 'bez limitu', agency: 'bez limitu' },
  { label: 'Parametry (na usługę)', lite: '5', pro: 'bez limitu', agency: 'bez limitu' },
  { label: 'Codzienny alert mailowy', lite: '✓', pro: '✓', agency: '✓' },
  { label: 'Kreator konfiguracji z podpowiedziami z GA4', lite: '✓', pro: '✓', agency: '✓' },
  { label: 'Wsparcie', lite: 'e-mail', pro: 'e-mail', agency: 'dedykowany kanał' },
  { label: 'Konsultacja z analitykiem GA4', lite: '—', pro: '—', agency: '1h / miesiąc' },
  // Compliance/trust claims (read-only access, EU data residency, GDPR,
  // Google verification) live in the trust strip on the marketing pages
  // instead of here — they're identical across every plan, so a table row
  // for each just repeated the same checkmark three times.
]

export const PLAN_KEYS = ['lite', 'pro', 'agency'] as const
export const PLAN_LABELS: Record<typeof PLAN_KEYS[number], string> = { lite: 'Lite', pro: 'Pro', agency: 'Agency' }

export default function PlanComparisonTable() {
  return (
    <>
      {/* Desktop — full table, all 3 plans visible at once (≥641px) */}
      <div className="plan-table-wrap plan-table-desktop">
        <table className="plan-table">
          <thead>
            <tr>
              <th></th>
              <th>Lite</th>
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
