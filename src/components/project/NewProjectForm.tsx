'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface GA4Property {
  propertyId: string
  displayName: string
  accountDisplayName: string
}

const inp: React.CSSProperties = {
  width: '100%', fontSize: 13, padding: '9px 12px',
  background: 'var(--color-background-primary)',
  border: '0.5px solid var(--color-border-secondary)',
  borderRadius: 8, color: 'var(--color-text-primary)',
  outline: 'none', boxSizing: 'border-box',
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>{hint}</p>}
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '12px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--color-text-secondary)', margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column' as const, gap: 16 }}>{children}</div>
    </div>
  )
}

export default function NewProjectForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // GA4 property picker
  const [properties, setProperties] = useState<GA4Property[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [propertiesError, setPropertiesError] = useState<string | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<GA4Property | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualPropertyId, setManualPropertyId] = useState('')

  const [form, setForm] = useState({
    name: '',
    own_domain: '',
    expected_events: '',
    alert_threshold: '70',
    alert_email: '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    async function loadProperties() {
      setPropertiesLoading(true)
      try {
        const res = await fetch('/api/ga4/properties')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Błąd ładowania')
        const flat: GA4Property[] = []
        for (const account of data.accounts ?? []) {
          for (const prop of account.properties ?? []) {
            flat.push({
              propertyId: prop.propertyId,
              displayName: prop.displayName,
              accountDisplayName: account.accountDisplayName,
            })
          }
        }
        setProperties(flat)
        if (flat.length === 0) setManualMode(true)
      } catch (e: any) {
        setPropertiesError(e.message)
        setManualMode(true) // automatyczny fallback do ręcznego wpisania
      } finally {
        setPropertiesLoading(false)
      }
    }
    loadProperties()
  }, [])

  const effectivePropertyId = manualMode
    ? manualPropertyId.replace('properties/', '')
    : selectedProperty?.propertyId ?? ''

  const canSubmit = manualMode ? !!manualPropertyId : !!selectedProperty

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) { setError('Wybierz lub wpisz property GA4'); return }
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const expected_events = form.expected_events.split(',').map(e => e.trim()).filter(Boolean)
      const propertyName = manualMode ? (form.name || `Property ${effectivePropertyId}`) : (form.name || selectedProperty!.displayName)
      const { error: err } = await supabase.from('projects').insert({
        org_id: '00000000-0000-0000-0000-000000000001',
        name: propertyName,
        ga4_property_id: `properties/${effectivePropertyId}`,
        own_domain: form.own_domain || null,
        expected_events,
        alert_threshold: parseInt(form.alert_threshold),
        alert_email: form.alert_email || null,
        ga4_auth_type: 'oauth',
      })
      if (err) throw new Error(err.message)
      router.push('/dashboard'); router.refresh()
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* GA4 Property */}
      <Section title="Wybierz property GA4">
        {propertiesLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, border: '2px solid var(--color-border-secondary)', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Ładuję dostępne konta GA4…</span>
          </div>
        ) : !manualMode && properties.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {properties.map(prop => {
                const isSelected = selectedProperty?.propertyId === prop.propertyId
                return (
                  <div key={prop.propertyId} onClick={() => { setSelectedProperty(prop); if (!form.name) set('name', prop.displayName) }} style={{
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    border: `0.5px solid ${isSelected ? '#bbf7d0' : 'var(--color-border-tertiary)'}`,
                    background: isSelected ? '#f0fdf4' : 'var(--color-background-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: isSelected ? 500 : 400, color: isSelected ? '#16a34a' : 'var(--color-text-primary)', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prop.displayName}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
                        {prop.accountDisplayName} · properties/{prop.propertyId}
                      </p>
                    </div>
                    {isSelected && <span style={{ color: '#16a34a', flexShrink: 0 }}>✓</span>}
                  </div>
                )
              })}
            </div>
            <button type="button" onClick={() => setManualMode(true)} style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
              Nie widzę swojej property — wpisz ID ręcznie
            </button>
          </>
        ) : (
          <>
            {propertiesError && !manualMode && (
              <div style={{ fontSize: 12, color: '#ca8a04', background: '#fefce8', border: '0.5px solid #fef08a', borderRadius: 8, padding: '8px 12px' }}>
                ⚠️ Nie udało się załadować listy property automatycznie. Wpisz Property ID ręcznie.
              </div>
            )}
            <Field label="GA4 Property ID" hint="Znajdziesz w GA4 Admin → Property Settings → Property ID">
              <input
                value={manualPropertyId}
                onChange={e => setManualPropertyId(e.target.value)}
                placeholder="123456789 lub properties/123456789"
                style={inp}
              />
            </Field>
            {properties.length > 0 && (
              <button type="button" onClick={() => setManualMode(false)} style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                ← Wróć do listy property
              </button>
            )}
          </>
        )}
      </Section>

      {/* Podstawowe */}
      <Section title="Podstawowe">
        <Field label="Nazwa projektu" hint="Domyślnie nazwa property GA4 — możesz zmienić">
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={selectedProperty?.displayName ?? 'Klient — property'} style={inp} />
        </Field>
      </Section>

      <Section title="Monitoring">
        <Field label="Expected events" hint="Eventy które POWINNY być w GA4 — lista po przecinku">
          <input value={form.expected_events} onChange={e => set('expected_events', e.target.value)} placeholder="purchase, add_to_cart, begin_checkout" style={inp} />
        </Field>
        <Field label="Własna domena" hint="Do checka self-referral, np. orange.pl">
          <input value={form.own_domain} onChange={e => set('own_domain', e.target.value)} placeholder="example.pl" style={inp} />
        </Field>
      </Section>

      <Section title="Alerty">
        <Field label="Próg score" hint="Alert gdy score spadnie poniżej tej wartości">
          <input type="number" min="0" max="100" value={form.alert_threshold} onChange={e => set('alert_threshold', e.target.value)} style={{ ...inp, width: 100 }} />
        </Field>
        <Field label="E-mail do alertów">
          <input type="email" value={form.alert_email} onChange={e => set('alert_email', e.target.value)} placeholder="rafal@bettersteps.pl" style={inp} />
        </Field>
      </Section>

      {error && <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>{error}</div>}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => router.back()} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
          Anuluj
        </button>
        <button type="submit" disabled={loading || !canSubmit} style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, background: !canSubmit ? '#d1d5db' : loading ? '#86efac' : '#16a34a', color: !canSubmit ? '#9ca3af' : '#fff', fontWeight: 500, border: 'none', cursor: loading || !canSubmit ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Zapisywanie...' : 'Utwórz projekt'}
        </button>
      </div>
    </form>
  )
}
