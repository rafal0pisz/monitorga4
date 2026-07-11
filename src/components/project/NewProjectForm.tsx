'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GA4_STANDARD_PARAMS, GA4_STANDARD_METRICS } from '@/lib/ga4/standardParams'
import { ECOMMERCE_CATALOG } from '@/lib/ga4/ecommerceCatalog'
import { PARAMETER_CATALOG } from '@/lib/ga4/parameterCatalog'
import { ga4Fetch } from '@/lib/ga4/clientQueue'

interface GA4Property {
  propertyId: string
  displayName: string
  accountDisplayName: string
}

interface DiscoveredEvent { name: string; count: number; isStandard: boolean }
interface CustomEvent { event_name: string; check_type: string; is_enabled: boolean }
interface ParamCheck { event_name: string; parameter_name: string }

const STEPS = ['GA4 property', 'Custom events', 'Ecommerce', 'Parameters', 'Alerts']
const RECOMMENDED_COUNT = 6

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

function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
      {STEPS.map((label, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10.5, fontWeight: 600,
                background: done || active ? '#16a34a' : 'var(--color-background-secondary)',
                color: done || active ? '#fff' : 'var(--color-text-secondary)',
                border: done || active ? 'none' : '0.5px solid var(--color-border-secondary)',
              }}>
                {done ? '✓' : idx}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: done ? '#bbf7d0' : 'var(--color-border-tertiary)', margin: '0 12px' }} />}
          </div>
        )
      })}
    </div>
  )
}

function EventTag({ isStandard }: { isStandard: boolean }) {
  return (
    <span style={{
      fontSize: 9.5, padding: '1.5px 7px', borderRadius: 999, fontWeight: 500,
      background: isStandard ? '#dbeafe' : '#ede9fe', color: isStandard ? '#1d4ed8' : '#6d28d9',
    }}>
      {isStandard ? 'standard' : 'custom'}
    </span>
  )
}

export default function NewProjectForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
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
    alert_threshold: '70',
    alert_email: '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // Suggestions sourced from the connected GA4 property
  const [discovered, setDiscovered] = useState<DiscoveredEvent[] | null>(null)
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverError, setDiscoverError] = useState<string | null>(null)
  const [showMoreEvents, setShowMoreEvents] = useState(false)
  const [manualEventInput, setManualEventInput] = useState('')

  const [customDimensions, setCustomDimensions] = useState<Set<string> | null>(null)

  // Step 2 — custom (non-ecommerce) events
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([])
  // Step 3 — ecommerce
  const [ecomEnabled, setEcomEnabled] = useState<Set<string>>(new Set())
  // Step 4 — parameters
  const [params, setParams] = useState<ParamCheck[]>([])
  const [newEvtName, setNewEvtName] = useState('')
  const [newParamName, setNewParamName] = useState('')
  const [paramWarning, setParamWarning] = useState<string | null>(null)
  const [pendingParam, setPendingParam] = useState<ParamCheck | null>(null)

  useEffect(() => {
    async function loadProperties() {
      setPropertiesLoading(true)
      try {
        const res = await ga4Fetch('/api/ga4/properties')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load')
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
        // The UI only shows a generic fallback message — full detail (e.g.
        // Google reporting the Admin API is disabled for this project) goes
        // to the console so it's diagnosable without guessing.
        console.error('[ga4/properties] fetch failed:', e.message)
        setPropertiesError(e.message)
        setManualMode(true) // automatic fallback to manual entry
      } finally {
        setPropertiesLoading(false)
      }
    }
    loadProperties()
  }, [])

  const effectivePropertyId = manualMode
    ? manualPropertyId.replace('properties/', '')
    : selectedProperty?.propertyId ?? ''

  const canSubmitProperty = manualMode ? !!manualPropertyId : !!selectedProperty

  // Pull real event volume + registered custom dimensions from GA4 once a
  // property is chosen, so steps 2–4 can suggest instead of asking for
  // blind text entry.
  useEffect(() => {
    if (!effectivePropertyId || discovered !== null || discoverLoading) return
    setDiscoverLoading(true)
    const propertyName = `properties/${effectivePropertyId}`
    Promise.all([
      ga4Fetch(`/api/ga4/discover-events?propertyId=${encodeURIComponent(propertyName)}`).then(async r => {
        const data = await r.json().catch(() => null)
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`)
        return data
      }),
      ga4Fetch(`/api/ga4/custom-dimensions?propertyId=${encodeURIComponent(propertyName)}`).then(async r => {
        const data = await r.json().catch(() => null)
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`)
        return data
      }),
    ])
      .then(([eventsData, dimsData]) => {
        setDiscovered(eventsData.events ?? [])
        if (dimsData?.parameterNames) setCustomDimensions(new Set(dimsData.parameterNames))
      })
      .catch(e => {
        console.error('[discover] fetch failed:', e.message)
        setDiscoverError(e.message)
        setDiscovered([]) // don't block the wizard — fall back to manual entry
      })
      .finally(() => setDiscoverLoading(false))
  }, [effectivePropertyId, discovered, discoverLoading])

  const ecommerceEventNames = useMemo(() => new Set(ECOMMERCE_CATALOG.map(c => c.event_name)), [])
  const nonEcommerceDiscovered = useMemo(
    () => (discovered ?? []).filter(e => !ecommerceEventNames.has(e.name)),
    [discovered, ecommerceEventNames]
  )
  const recommendedEvents = nonEcommerceDiscovered.slice(0, RECOMMENDED_COUNT)
  const otherDiscoveredEvents = nonEcommerceDiscovered.slice(RECOMMENDED_COUNT)

  function isCustomEventSelected(name: string) {
    return customEvents.some(e => e.event_name === name)
  }
  function toggleCustomEvent(name: string) {
    setCustomEvents(prev =>
      prev.some(e => e.event_name === name)
        ? prev.filter(e => e.event_name !== name)
        : [...prev, { event_name: name, check_type: 'presence', is_enabled: true }]
    )
  }
  function addManualEvent() {
    const n = manualEventInput.trim().replace(/\s+/g, '_')
    if (!n || customEvents.some(e => e.event_name === n)) return
    setCustomEvents(prev => [...prev, { event_name: n, check_type: 'presence', is_enabled: true }])
    setManualEventInput('')
  }
  function removeCustomEvent(name: string) {
    setCustomEvents(prev => prev.filter(e => e.event_name !== name))
  }

  function toggleEcom(ev: string) {
    setEcomEnabled(prev => {
      const next = new Set(prev)
      next.has(ev) ? next.delete(ev) : next.add(ev)
      return next
    })
  }

  const selectedEventNames = useMemo(
    () => [...new Set([...customEvents.map(e => e.event_name), ...ecomEnabled])],
    [customEvents, ecomEnabled]
  )
  const suggestedParams = useMemo(
    () => PARAMETER_CATALOG.filter(p => selectedEventNames.includes(p.event_name)),
    [selectedEventNames]
  )
  const suggestedParamsByEvent = useMemo(() => {
    const grouped: Record<string, typeof suggestedParams> = {}
    for (const p of suggestedParams) (grouped[p.event_name] ??= []).push(p)
    return grouped
  }, [suggestedParams])

  function isParamSelected(eventName: string, paramName: string) {
    return params.some(p => p.event_name === eventName && p.parameter_name === paramName)
  }
  function toggleSuggestedParam(eventName: string, paramName: string) {
    setParams(prev =>
      prev.some(p => p.event_name === eventName && p.parameter_name === paramName)
        ? prev.filter(p => !(p.event_name === eventName && p.parameter_name === paramName))
        : [...prev, { event_name: eventName, parameter_name: paramName }]
    )
  }
  function removeParam(eventName: string, paramName: string) {
    setParams(prev => prev.filter(p => !(p.event_name === eventName && p.parameter_name === paramName)))
  }

  function addManualParam() {
    const evt = newEvtName.trim().replace(/\s+/g, '_')
    const param = newParamName.trim().replace(/\s+/g, '_')
    if (!evt || !param) return
    if (params.some(p => p.event_name === evt && p.parameter_name === param)) return

    const isStandard = param in GA4_STANDARD_PARAMS || param in GA4_STANDARD_METRICS
    if (!isStandard && customDimensions && !customDimensions.has(param)) {
      setPendingParam({ event_name: evt, parameter_name: param })
      setParamWarning(
        `"${param}" is not a standard GA4 parameter and no custom dimension with that exact name is registered on this property. ` +
        `Check GA4 Admin → Custom definitions for the correct name/casing, or add it anyway if this is a new event that hasn't fired yet.`
      )
      return
    }
    setParams(prev => [...prev, { event_name: evt, parameter_name: param }])
    setNewEvtName(''); setNewParamName('')
  }
  function confirmAddParamAnyway() {
    if (!pendingParam) return
    setParams(prev => [...prev, pendingParam])
    setPendingParam(null); setParamWarning(null)
    setNewEvtName(''); setNewParamName('')
  }
  function cancelAddParam() {
    setPendingParam(null); setParamWarning(null)
  }

  async function handleSubmit() {
    if (!canSubmitProperty) { setError('Select or enter a GA4 property'); setStep(1); return }
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in to create a project.')
      const propertyName = manualMode ? (form.name || `Property ${effectivePropertyId}`) : (form.name || selectedProperty!.displayName)

      // Goes through the create_project RPC (not a raw insert) so the
      // caller's plan project-limit is enforced server-side, not just in
      // the UI — see plan_project_limit()/create_project() in
      // supabase/migrations/011_billing.sql.
      const { data: projectRow, error: projErr } = await supabase.rpc('create_project', {
        p_owner_id: user.id,
        p_name: propertyName,
        p_ga4_property_id: `properties/${effectivePropertyId}`,
        p_own_domain: form.own_domain || null,
        p_expected_events: customEvents.map(e => e.event_name),
        p_alert_threshold: parseInt(form.alert_threshold),
        p_alert_email: form.alert_email || null,
      })
      if (projErr) {
        if (projErr.message.includes('PLAN_LIMIT_REACHED')) {
          throw new Error("You've reached your plan's project limit. Upgrade to add more projects.")
        }
        throw new Error(projErr.message)
      }

      const projectId = projectRow.id
      if (customEvents.length > 0) {
        const { error: ceErr } = await supabase.rpc('save_custom_event_checks', {
          p_project_id: projectId,
          p_events: customEvents.map((e, i) => ({ event_name: e.event_name, check_type: e.check_type, is_enabled: e.is_enabled, sort_order: i })),
        })
        if (ceErr) throw new Error(ceErr.message.includes('ITEM_LIMIT_REACHED') ? "Your plan allows up to 10 custom events per project. Upgrade to add more." : `Custom events: ${ceErr.message}`)
      }
      if (ecomEnabled.size > 0) {
        const { error: ecErr } = await supabase.rpc('save_ecommerce_config', {
          p_project_id: projectId,
          p_events: [...ecomEnabled].map(event_name => ({ event_name })),
        })
        if (ecErr) throw new Error(ecErr.message.includes('ITEM_LIMIT_REACHED') ? "Your plan allows up to 10 e-commerce events per project. Upgrade to add more." : `Ecommerce: ${ecErr.message}`)
      }
      if (params.length > 0) {
        const { error: pcErr } = await supabase.rpc('save_parameter_checks', {
          p_project_id: projectId,
          p_params: params.map((p, i) => ({ event_name: p.event_name, parameter_name: p.parameter_name, sort_order: i })),
        })
        if (pcErr) throw new Error(pcErr.message.includes('ITEM_LIMIT_REACHED') ? "Your plan allows up to 10 parameter checks per project. Upgrade to add more." : `Parameters: ${pcErr.message}`)
      }

      router.push('/dashboard'); router.refresh()
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  const canGoNext = step !== 1 || canSubmitProperty

  return (
    <div>
      <Stepper current={step} />

      {/* ── STEP 1 — GA4 PROPERTY ────────────────────────────────────────── */}
      {step === 1 && (
        <Section title="Choose a GA4 property">
          {propertiesLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, border: '2px solid var(--color-border-secondary)', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading available GA4 accounts…</span>
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
                Don't see your property — enter the ID manually
              </button>
            </>
          ) : (
            <>
              {propertiesError && !manualMode && (
                <div style={{ fontSize: 12, color: '#ca8a04', background: '#fefce8', border: '0.5px solid #fef08a', borderRadius: 8, padding: '8px 12px' }}>
                  ⚠️ Couldn't load the property list automatically. Enter the Property ID manually.
                </div>
              )}
              <Field label="GA4 Property ID" hint="Found in GA4 Admin → Property Settings → Property ID">
                <input
                  value={manualPropertyId}
                  onChange={e => setManualPropertyId(e.target.value)}
                  placeholder="123456789 or properties/123456789"
                  style={inp}
                />
              </Field>
              {properties.length > 0 && (
                <button type="button" onClick={() => setManualMode(false)} style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                  ← Back to the property list
                </button>
              )}
            </>
          )}
        </Section>
      )}

      {step === 1 && (
        <Section title="Project name">
          <Field label="Name" hint="Defaults to the GA4 property name — you can change it">
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={selectedProperty?.displayName ?? 'Client — property'} style={inp} />
          </Field>
        </Section>
      )}

      {/* ── STEP 2 — CUSTOM EVENTS ───────────────────────────────────────── */}
      {step === 2 && (
        <Section title="Custom events">
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '-10px 0 0' }}>
            Events AlertGA4 should check for presence and volume, beyond the standard ecommerce set covered next.
          </p>

          {discoverLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, border: '2px solid var(--color-border-secondary)', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Reading events from GA4…</span>
            </div>
          )}
          {discoverError && (
            <div style={{ fontSize: 12, color: '#ca8a04', background: '#fefce8', border: '0.5px solid #fef08a', borderRadius: 8, padding: '8px 12px' }}>
              ⚠️ Couldn't read events from GA4 ({discoverError}). Add them manually below.
            </div>
          )}

          {!discoverLoading && recommendedEvents.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Recommended</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recommendedEvents.map(ev => {
                  const checked = isCustomEventSelected(ev.name)
                  return (
                    <label key={ev.name} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                      border: `0.5px solid ${checked ? '#bbf7d0' : 'var(--color-border-tertiary)'}`,
                      background: checked ? '#f0fdf4' : 'var(--color-background-secondary)',
                    }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleCustomEvent(ev.name)} style={{ accentColor: '#16a34a' }} />
                      <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 500, color: checked ? '#16a34a' : 'var(--color-text-primary)' }}>{ev.name}</span>
                      <EventTag isStandard={ev.isStandard} />
                      <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 11.5, color: 'var(--color-text-secondary)' }}>
                        {ev.count.toLocaleString()} / 30 days
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {!discoverLoading && otherDiscoveredEvents.length > 0 && (
            <div>
              <button type="button" onClick={() => setShowMoreEvents(v => !v)} style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                {showMoreEvents ? 'Hide other detected events' : `Show ${otherDiscoveredEvents.length} more detected events`}
              </button>
              {showMoreEvents && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {otherDiscoveredEvents.map(ev => {
                    const checked = isCustomEventSelected(ev.name)
                    return (
                      <label key={ev.name} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                        border: `0.5px solid ${checked ? '#bbf7d0' : 'var(--color-border-tertiary)'}`,
                        background: checked ? '#f0fdf4' : 'var(--color-background-secondary)',
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCustomEvent(ev.name)} style={{ accentColor: '#16a34a' }} />
                        <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 500, color: checked ? '#16a34a' : 'var(--color-text-primary)' }}>{ev.name}</span>
                        <EventTag isStandard={ev.isStandard} />
                        <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 11.5, color: 'var(--color-text-secondary)' }}>
                          {ev.count.toLocaleString()} / 30 days
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {customEvents.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Selected ({customEvents.length})</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {customEvents.map(e => (
                  <div key={e.event_name} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500, fontFamily: 'monospace' }}>{e.event_name}</span>
                    <button onClick={() => removeCustomEvent(e.event_name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Field label="Add manually" hint="Not seen it yet? Add the event name directly">
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={manualEventInput} onChange={e => setManualEventInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addManualEvent()}
                placeholder="event_name" style={{ ...inp, flex: 1 }} />
              <button type="button" onClick={addManualEvent}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: '#16a34a', color: '#fff', border: 'none', flexShrink: 0 }}>
                Add
              </button>
            </div>
          </Field>
        </Section>
      )}

      {/* ── STEP 3 — ECOMMERCE ───────────────────────────────────────────── */}
      {step === 3 && (
        <Section title="Ecommerce events">
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '-10px 0 0' }}>
            Standard GA4 ecommerce events to monitor for presence and completeness. Events detected on this property in the last 30 days are pre-selected.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ECOMMERCE_CATALOG.map(({ event_name, label }) => {
              const detected = discovered?.find(d => d.name === event_name)
              const active = ecomEnabled.has(event_name)
              return (
                <label key={event_name} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `0.5px solid ${active ? '#bbf7d0' : 'var(--color-border-tertiary)'}`,
                  background: active ? '#f0fdf4' : 'var(--color-background-secondary)',
                  opacity: !detected && discovered ? 0.7 : 1,
                }}>
                  <input type="checkbox" checked={active} onChange={() => toggleEcom(event_name)} style={{ accentColor: '#16a34a' }} />
                  <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, color: active ? '#16a34a' : 'var(--color-text-primary)' }}>{label}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text-secondary)' }}>{event_name}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 11.5, color: 'var(--color-text-secondary)' }}>
                    {detected ? `${detected.count.toLocaleString()} / 30 days` : discovered ? 'not detected' : ''}
                  </span>
                </label>
              )
            })}
          </div>
          {ecomEnabled.size > 0 && (
            <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>
              {ecomEnabled.size} event{ecomEnabled.size !== 1 ? 's' : ''} selected
            </div>
          )}
        </Section>
      )}

      {/* ── STEP 4 — PARAMETERS ──────────────────────────────────────────── */}
      {step === 4 && (
        <Section title="Parameter checks">
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '-10px 0 0' }}>
            Event + parameter pairs to check coverage week-over-week. Suggestions below match the events you selected.
          </p>

          {Object.keys(suggestedParamsByEvent).length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
              No built-in suggestions for the events you selected — add pairs manually below.
            </p>
          )}

          {Object.entries(suggestedParamsByEvent).map(([eventName, entries]) => (
            <div key={eventName}>
              <p style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>{eventName}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {entries.map(p => {
                  const checked = isParamSelected(p.event_name, p.parameter_name)
                  return (
                    <label key={p.parameter_name} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                      border: `0.5px solid ${checked ? '#bbf7d0' : 'var(--color-border-tertiary)'}`,
                      background: checked ? '#f0fdf4' : 'var(--color-background-secondary)',
                    }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleSuggestedParam(p.event_name, p.parameter_name)} style={{ accentColor: '#16a34a' }} />
                      <span style={{ fontSize: 13, color: checked ? '#16a34a' : 'var(--color-text-primary)' }}>{p.label}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text-secondary)' }}>{p.parameter_name}</span>
                      {!p.is_required_default && (
                        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--color-text-secondary)' }}>optional</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

          {params.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Selected ({params.length})</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {params.map(p => (
                  <div key={`${p.event_name}.${p.parameter_name}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500, fontFamily: 'monospace' }}>{p.event_name}.{p.parameter_name}</span>
                    <button onClick={() => removeParam(p.event_name, p.parameter_name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Field label="Add manually">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <input value={newEvtName} onChange={e => setNewEvtName(e.target.value)} placeholder="event_name" style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <input value={newParamName} onChange={e => setNewParamName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addManualParam()}
                  placeholder="parameter_name" style={inp} />
              </div>
              <button type="button" onClick={addManualParam}
                style={{ padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: '#16a34a', color: '#fff', border: 'none', flexShrink: 0 }}>
                Add
              </button>
            </div>
          </Field>

          {paramWarning && (
            <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: '#fefce8', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 12, color: '#854d0e', marginBottom: 8 }}>⚠ {paramWarning}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={confirmAddParamAnyway}
                  style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: '#ca8a04', color: '#fff', border: 'none' }}>
                  Add anyway
                </button>
                <button onClick={cancelAddParam}
                  style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: 'transparent', color: '#854d0e', border: '1px solid #fde68a' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── STEP 5 — ALERTS ──────────────────────────────────────────────── */}
      {step === 5 && (
        <Section title="Alerts">
          <Field label="Score threshold" hint="Alert when the score drops below this value">
            <input type="number" min="0" max="100" value={form.alert_threshold} onChange={e => set('alert_threshold', e.target.value)} style={{ ...inp, width: 100 }} />
          </Field>
          <Field label="Alert email">
            <input type="email" value={form.alert_email} onChange={e => set('alert_email', e.target.value)} placeholder="you@company.com" style={inp} />
          </Field>
        </Section>
      )}

      {error && <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>{error}</div>}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <button type="button" onClick={() => step === 1 ? router.back() : setStep(s => s - 1)} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
          {step === 1 ? 'Cancel' : '← Back'}
        </button>
        {step < STEPS.length ? (
          <button type="button" disabled={!canGoNext} onClick={() => setStep(s => s + 1)} style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, background: !canGoNext ? '#d1d5db' : '#16a34a', color: !canGoNext ? '#9ca3af' : '#fff', fontWeight: 500, border: 'none', cursor: !canGoNext ? 'not-allowed' : 'pointer' }}>
            Next
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading || !canSubmitProperty} style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, background: !canSubmitProperty ? '#d1d5db' : loading ? '#86efac' : '#16a34a', color: !canSubmitProperty ? '#9ca3af' : '#fff', fontWeight: 500, border: 'none', cursor: loading || !canSubmitProperty ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Creating…' : 'Create project'}
          </button>
        )}
      </div>
    </div>
  )
}
