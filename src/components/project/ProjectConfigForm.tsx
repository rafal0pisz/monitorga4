'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ECOM_EVENTS = [
  'purchase', 'add_to_cart', 'remove_from_cart', 'view_item',
  'view_item_list', 'begin_checkout', 'add_payment_info',
  'add_shipping_info', 'view_cart', 'refund', 'select_item',
  'select_promotion', 'view_promotion', 'generate_lead',
]

interface CustomEvent { event_name: string; check_type: string; is_enabled: boolean }
interface ParamCheck  { event_name: string; parameter_name: string }

interface Props {
  project: {
    id: string
    name: string
    ga4_property_id: string | null
    own_domain?: string | null
    expected_events?: string[] | null
    alert_threshold?: number | null
    alert_email?: string | null
    status?: string | null
    auto_run?: boolean | null
  }
  catalog?: unknown
  checksConfig?: unknown
  customEvents?: unknown
  ecommerceConfig?: unknown
  parameterChecks?: unknown
  ecommerceCatalog?: unknown
  initialSections?: unknown
}

export default function ProjectConfigForm({ project }: Props) {
  const router   = useRouter()
  const supabase = createClient()

  const [name,        setName]        = useState(project.name ?? '')
  const [propertyId,  setPropertyId]  = useState(project.ga4_property_id ?? '')
  const [ownDomain,   setOwnDomain]   = useState(project.own_domain ?? '')
  const [alertEmail,  setAlertEmail]  = useState(project.alert_email ?? '')
  const [alertThresh, setAlertThresh] = useState(String(project.alert_threshold ?? 70))
  const [status,      setStatus]      = useState(project.status ?? 'active')
  const [autoRun,     setAutoRun]     = useState(project.auto_run ?? false)

  const [customEvents,  setCustomEvents]  = useState<CustomEvent[]>([])
  const [ecomEnabled,   setEcomEnabled]   = useState<Set<string>>(new Set())
  const [params,        setParams]        = useState<ParamCheck[]>([])

  const [newEvent,    setNewEvent]    = useState('')
  const [newEvtName,  setNewEvtName]  = useState('')
  const [newParamName,setNewParamName]= useState('')

  const [openSection, setOpenSection] = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState(false)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const [ceRes, ecRes, pcRes] = await Promise.all([
        supabase.rpc('get_custom_event_checks', { p_project_id: project.id }),
        supabase.rpc('get_ecommerce_config',    { p_project_id: project.id }),
        supabase.rpc('get_parameter_checks',    { p_project_id: project.id }),
      ])
      if (ceRes.data) {
        const raw = Array.isArray(ceRes.data) ? ceRes.data : []
        setCustomEvents(raw.map((e: any) => ({ event_name: e.event_name, check_type: e.check_type ?? 'presence', is_enabled: e.is_enabled !== false })))
      }
      if (ecRes.data) {
        const raw = Array.isArray(ecRes.data) ? ecRes.data : []
        setEcomEnabled(new Set(raw.filter((e: any) => e.is_enabled !== false).map((e: any) => e.event_name as string)))
      }
      if (pcRes.data) {
        const raw = Array.isArray(pcRes.data) ? pcRes.data : []
        setParams(raw.map((p: any) => ({ event_name: p.event_name, parameter_name: p.parameter_name })))
      }
    } catch (e: any) {
      console.error('Config load error:', e)
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => { loadConfig() }, [loadConfig])

  function addCustomEvent() {
    const n = newEvent.trim().toLowerCase().replace(/\s+/g, '_')
    if (!n || customEvents.some(e => e.event_name === n)) return
    setCustomEvents(prev => [...prev, { event_name: n, check_type: 'presence', is_enabled: true }])
    setNewEvent('')
  }

  function toggleEcom(ev: string) {
    setEcomEnabled(prev => {
      const next = new Set(prev)
      next.has(ev) ? next.delete(ev) : next.add(ev)
      return next
    })
  }

  function addParam() {
    const evt   = newEvtName.trim().toLowerCase().replace(/\s+/g, '_')
    const param = newParamName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!evt || !param) return
    if (params.some(p => p.event_name === evt && p.parameter_name === param)) return
    setParams(prev => [...prev, { event_name: evt, parameter_name: param }])
    setNewEvtName(''); setNewParamName('')
  }

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false)
    try {
      const pid = project.id
      const pidClean = propertyId.startsWith('properties/')
        ? propertyId : propertyId ? `properties/${propertyId.replace(/\D/g, '')}` : ''

      const { error: projErr } = await supabase.from('projects').update({
        name: name.trim(),
        ga4_property_id: pidClean || null,
        own_domain: ownDomain.trim() || null,
        alert_email: alertEmail.trim() || null,
        alert_threshold: Number(alertThresh) || 70,
        status,
        auto_run: autoRun,
        expected_events: customEvents.filter(e => e.is_enabled).map(e => e.event_name),
      }).eq('id', pid)
      if (projErr) throw new Error(`Project: ${projErr.message}`)

      const { error: ceErr } = await supabase.rpc('save_custom_event_checks', {
        p_project_id: pid,
        p_events: customEvents.map((e, i) => ({ event_name: e.event_name, check_type: e.check_type, is_enabled: e.is_enabled, sort_order: i })),
      })
      if (ceErr) throw new Error(`Custom events: ${ceErr.message}`)

      const { error: ecErr } = await supabase.rpc('save_ecommerce_config', {
        p_project_id: pid,
        p_events: [...ecomEnabled].map(event_name => ({ event_name })),
      })
      if (ecErr) throw new Error(`Ecommerce: ${ecErr.message}`)

      const { error: pcErr } = await supabase.rpc('save_parameter_checks', {
        p_project_id: pid,
        p_params: params.map((p, i) => ({ event_name: p.event_name, parameter_name: p.parameter_name, sort_order: i })),
      })
      if (pcErr) throw new Error(`Parameters: ${pcErr.message}`)

      setSuccess(true)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this project? This cannot be undone.')) return
    setDeleting(true)
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (error) { setError(error.message); setDeleting(false); return }
    router.push('/dashboard')
  }

  // ─── STYLES ──────────────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13,
    border: '1px solid var(--color-border-tertiary)',
    backgroundColor: 'var(--color-background-secondary)',
    color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)',
    display: 'block', marginBottom: 5,
  }
  const card: React.CSSProperties = {
    backgroundColor: 'var(--color-background-primary)',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 12, marginBottom: 12, overflow: 'hidden',
  }

  function SectionHeader({ id, title, subtitle, count }: { id: string; title: string; subtitle: string; count?: number }) {
    const open = openSection === id
    return (
      <button
        onClick={() => setOpenSection(open ? null : id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--color-border-tertiary)' : 'none',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {title}
            {count !== undefined && count > 0 && (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                {count} configured
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{subtitle}</div>
        </div>
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
    )
  }

  if (loading) return (
    <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
      Loading configuration…
    </div>
  )

  return (
    <div>

      {/* ── BASIC ─────────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Basic settings</div>
        </div>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={lbl}>Project name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>GA4 Property ID</label>
            <input value={propertyId} onChange={e => setPropertyId(e.target.value)} placeholder="properties/123456789" style={inp} />
          </div>
          <div>
            <label style={lbl}>Own domain (self-referral check)</label>
            <input value={ownDomain} onChange={e => setOwnDomain(e.target.value)} placeholder="example.com" style={inp} />
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
              <option value="active">● Active</option>
              <option value="paused">○ Paused</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={lbl}>Automated daily check</label>
            <button
              type="button"
              onClick={() => setAutoRun(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${autoRun ? '#bbf7d0' : 'var(--color-border-tertiary)'}`,
                backgroundColor: autoRun ? '#f0fdf4' : 'var(--color-background-secondary)',
                width: '100%', textAlign: 'left',
              }}
            >
              <div style={{
                width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                backgroundColor: autoRun ? '#16a34a' : '#d1d5db',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 2,
                  left: autoRun ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: 13, color: autoRun ? '#16a34a' : 'var(--color-text-secondary)', fontWeight: autoRun ? 600 : 400 }}>
                {autoRun ? 'Enabled — worker runs daily at 23:00 UTC' : 'Disabled — use Run now to check manually'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CUSTOM EVENTS ─────────────────────────────────────────────────── */}
      <div style={card}>
        <SectionHeader id="custom_events" title="Custom Events" subtitle="Events the worker checks for presence and volume changes" count={customEvents.length} />
        {openSection === 'custom_events' && (
          <div style={{ padding: 18 }}>
            {customEvents.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {customEvents.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>{e.event_name}</span>
                    <button onClick={() => setCustomEvents(prev => prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 15, lineHeight: 1, padding: '0 2px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newEvent} onChange={e => setNewEvent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomEvent()}
                placeholder="event_name" style={{ ...inp, flex: 1 }} />
              <button onClick={addCustomEvent}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: '#16a34a', color: '#fff', border: 'none', flexShrink: 0 }}>
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ECOMMERCE ─────────────────────────────────────────────────────── */}
      <div style={card}>
        <SectionHeader id="ecommerce" title="Ecommerce Events" subtitle="Standard GA4 ecommerce events to monitor for presence and completeness" count={ecomEnabled.size} />
        {openSection === 'ecommerce' && (
          <div style={{ padding: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ECOM_EVENTS.map(ev => {
                const active = ecomEnabled.has(ev)
                return (
                  <button key={ev} onClick={() => toggleEcom(ev)} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    border: `1px solid ${active ? '#bbf7d0' : 'var(--color-border-tertiary)'}`,
                    backgroundColor: active ? '#f0fdf4' : 'var(--color-background-secondary)',
                    color: active ? '#16a34a' : 'var(--color-text-secondary)',
                    fontWeight: active ? 600 : 400, transition: 'all 0.15s',
                  }}>
                    {active ? '✓ ' : ''}{ev}
                  </button>
                )
              })}
            </div>
            {ecomEnabled.size > 0 && (
              <div style={{ fontSize: 11, color: '#16a34a', marginTop: 12, fontWeight: 500 }}>
                {ecomEnabled.size} event{ecomEnabled.size !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PARAMETERS ────────────────────────────────────────────────────── */}
      <div style={card}>
        <SectionHeader id="parameters" title="Parameter Checks" subtitle="Event + parameter pairs to check coverage rate week-over-week" count={params.length} />
        {openSection === 'parameters' && (
          <div style={{ padding: 18 }}>
            {params.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 0', fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Event</th>
                    <th style={{ textAlign: 'left', padding: '4px 0', fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Parameter</th>
                    <th style={{ width: 32 }} />
                  </tr>
                </thead>
                <tbody>
                  {params.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                      <td style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: 12 }}>{p.event_name}</td>
                      <td style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: 12 }}>{p.parameter_name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => setParams(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Event name</label>
                <input value={newEvtName} onChange={e => setNewEvtName(e.target.value)} placeholder="purchase" style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Parameter name</label>
                <input value={newParamName} onChange={e => setNewParamName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addParam()}
                  placeholder="transaction_id" style={inp} />
              </div>
              <button onClick={addParam}
                style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: '#16a34a', color: '#fff', border: 'none', flexShrink: 0 }}>
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ALERTS ────────────────────────────────────────────────────────── */}
      <div style={card}>
        <SectionHeader id="alerts" title="Email Alerts" subtitle="Get notified when the score drops below threshold" />
        {openSection === 'alerts' && (
          <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Alert email</label>
              <input value={alertEmail} onChange={e => setAlertEmail(e.target.value)} placeholder="you@company.com" type="email" style={inp} />
            </div>
            <div>
              <label style={lbl}>Alert threshold (score)</label>
              <input value={alertThresh} onChange={e => setAlertThresh(e.target.value)} type="number" min="0" max="100" style={inp} />
            </div>
          </div>
        )}
      </div>

      {/* ── FEEDBACK ──────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#dc2626' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12, color: '#16a34a' }}>
          Settings saved. Run the worker to update check results.
        </div>
      )}

      {/* ── ACTIONS ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
        <button onClick={handleDelete} disabled={deleting}
          style={{ fontSize: 12, color: '#dc2626', background: 'none', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
          {deleting ? 'Deleting…' : 'Delete project'}
        </button>
        <button onClick={handleSave} disabled={saving}
          style={{ fontSize: 13, fontWeight: 600, padding: '9px 28px', borderRadius: 8, backgroundColor: saving ? '#86efac' : '#16a34a', color: '#fff', border: 'none', cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
