'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── ECOMMERCE EVENT LIST ─────────────────────────────────────────────────────

const ECOM_EVENTS = [
  'purchase', 'add_to_cart', 'remove_from_cart', 'view_item',
  'view_item_list', 'begin_checkout', 'add_payment_info',
  'add_shipping_info', 'view_cart', 'refund', 'select_item',
  'select_promotion', 'view_promotion', 'generate_lead',
]

// ─── TYPES ────────────────────────────────────────────────────────────────────

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
  }
  // All legacy props from config/page.tsx — accepted but ignored (data loaded via RPC)
  catalog?: unknown
  checksConfig?: unknown
  customEvents?: unknown
  ecommerceConfig?: unknown
  parameterChecks?: unknown
  ecommerceCatalog?: unknown
  initialSections?: unknown
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function ProjectConfigForm({ project }: Props) {
  const router  = useRouter()
  const supabase = createClient()

  // Basic fields
  const [name,         setName]         = useState(project.name ?? '')
  const [propertyId,   setPropertyId]   = useState(project.ga4_property_id ?? '')
  const [ownDomain,    setOwnDomain]    = useState(project.own_domain ?? '')
  const [alertEmail,   setAlertEmail]   = useState(project.alert_email ?? '')
  const [alertThresh,  setAlertThresh]  = useState(String(project.alert_threshold ?? 70))
  const [status,       setStatus]       = useState(project.status ?? 'active')

  // Custom events
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([])
  const [newEvent,     setNewEvent]     = useState('')

  // Ecommerce
  const [ecomEnabled,  setEcomEnabled]  = useState<Set<string>>(new Set())

  // Parameters
  const [params,       setParams]       = useState<ParamCheck[]>([])
  const [newEvtName,   setNewEvtName]   = useState('')
  const [newParamName, setNewParamName] = useState('')

  // UI state
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)
  const [loading,  setLoading]  = useState(true)

  // ─── LOAD CONFIG ───────────────────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const [ceRes, ecRes, pcRes] = await Promise.all([
        supabase.rpc('get_custom_event_checks', { p_project_id: project.id }),
        supabase.rpc('get_ecommerce_config',    { p_project_id: project.id }),
        supabase.rpc('get_parameter_checks',    { p_project_id: project.id }),
      ])

      if (ceRes.data) {
        const raw = Array.isArray(ceRes.data) ? ceRes.data : (typeof ceRes.data === 'string' ? JSON.parse(ceRes.data) : [])
        setCustomEvents(raw.map((e: any) => ({ event_name: e.event_name, check_type: e.check_type ?? 'presence', is_enabled: e.is_enabled !== false })))
      }

      if (ecRes.data) {
        const raw = Array.isArray(ecRes.data) ? ecRes.data : (typeof ecRes.data === 'string' ? JSON.parse(ecRes.data) : [])
        setEcomEnabled(new Set(raw.filter((e: any) => e.is_enabled !== false).map((e: any) => e.event_name as string)))
      }

      if (pcRes.data) {
        const raw = Array.isArray(pcRes.data) ? pcRes.data : (typeof pcRes.data === 'string' ? JSON.parse(pcRes.data) : [])
        setParams(raw.map((p: any) => ({ event_name: p.event_name, parameter_name: p.parameter_name })))
      }
    } catch (e: any) {
      console.error('Config load error:', e)
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => { loadConfig() }, [loadConfig])

  // ─── CUSTOM EVENTS ─────────────────────────────────────────────────────────

  function addCustomEvent() {
    const name = newEvent.trim().toLowerCase().replace(/\s+/g, '_')
    if (!name || customEvents.some(e => e.event_name === name)) return
    setCustomEvents(prev => [...prev, { event_name: name, check_type: 'presence', is_enabled: true }])
    setNewEvent('')
  }

  function removeCustomEvent(idx: number) {
    setCustomEvents(prev => prev.filter((_, i) => i !== idx))
  }

  // ─── ECOMMERCE ─────────────────────────────────────────────────────────────

  function toggleEcom(ev: string) {
    setEcomEnabled(prev => {
      const next = new Set(prev)
      next.has(ev) ? next.delete(ev) : next.add(ev)
      return next
    })
  }

  // ─── PARAMETERS ────────────────────────────────────────────────────────────

  function addParam() {
    const evt   = newEvtName.trim().toLowerCase().replace(/\s+/g, '_')
    const param = newParamName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!evt || !param) return
    if (params.some(p => p.event_name === evt && p.parameter_name === param)) return
    setParams(prev => [...prev, { event_name: evt, parameter_name: param }])
    setNewEvtName(''); setNewParamName('')
  }

  function removeParam(idx: number) {
    setParams(prev => prev.filter((_, i) => i !== idx))
  }

  // ─── SAVE ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false)
    try {
      const pid = project.id

      // 1. Basic project info
      const pid_clean = propertyId.startsWith('properties/')
        ? propertyId : `properties/${propertyId.replace(/\D/g, '')}`

      const { error: projErr } = await supabase
        .from('projects')
        .update({
          name:                name.trim(),
          ga4_property_id:     pid_clean,
          own_domain:          ownDomain.trim() || null,
          alert_email:         alertEmail.trim() || null,
          alert_threshold:     Number(alertThresh) || 70,
          status,
          expected_events:     customEvents.filter(e => e.is_enabled).map(e => e.event_name),
        })
        .eq('id', pid)

      if (projErr) throw new Error(`Project update failed: ${projErr.message}`)

      // 2. Custom events via RPC
      const { error: ceErr } = await supabase.rpc('save_custom_event_checks', {
        p_project_id: pid,
        p_events: customEvents.map((e, i) => ({
          event_name: e.event_name,
          check_type: e.check_type,
          is_enabled: e.is_enabled,
          sort_order: i,
        })),
      })
      if (ceErr) throw new Error(`Custom events save failed: ${ceErr.message}`)

      // 3. Ecommerce config via RPC
      const { error: ecErr } = await supabase.rpc('save_ecommerce_config', {
        p_project_id: pid,
        p_events: [...ecomEnabled].map(event_name => ({ event_name })),
      })
      if (ecErr) throw new Error(`Ecommerce config save failed: ${ecErr.message}`)

      // 4. Parameter checks via RPC
      const { error: pcErr } = await supabase.rpc('save_parameter_checks', {
        p_project_id: pid,
        p_params: params.map((p, i) => ({
          event_name:     p.event_name,
          parameter_name: p.parameter_name,
          sort_order:     i,
        })),
      })
      if (pcErr) throw new Error(`Parameter checks save failed: ${pcErr.message}`)

      setSuccess(true)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!confirm('Delete this project? This cannot be undone.')) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id)
      if (error) throw error
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message)
      setDeleting(false)
    }
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 13,
    border: '1px solid var(--color-border-tertiary)',
    backgroundColor: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)',
    display: 'block', marginBottom: 4,
  }
  const sectionStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background-primary)',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 10, padding: '16px 18px', marginBottom: 16,
  }
  const sectionTitle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)',
    marginBottom: 14,
  }
  const tagStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 11px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
    border: `1px solid ${active ? '#bbf7d0' : 'var(--color-border-tertiary)'}`,
    backgroundColor: active ? '#f0fdf4' : 'var(--color-background-secondary)',
    color: active ? '#16a34a' : 'var(--color-text-secondary)',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
  })

  if (loading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        Loading configuration…
      </div>
    )
  }

  return (
    <div>
      {/* ── BASIC ─────────────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Basic settings</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Project name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>GA4 Property ID</label>
            <input value={propertyId} onChange={e => setPropertyId(e.target.value)} placeholder="properties/123456789 or 123456789" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Own domain (for self-referral check)</label>
            <input value={ownDomain} onChange={e => setOwnDomain(e.target.value)} placeholder="example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              <option value="active">● Active</option>
              <option value="paused">○ Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── CUSTOM EVENTS ─────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Custom Events</div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          Events the worker will check for presence and volume changes.
        </p>

        {/* Existing events */}
        {customEvents.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {customEvents.map((e, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 6,
                backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                fontSize: 12,
              }}>
                <span style={{ color: '#16a34a', fontWeight: 500 }}>{e.event_name}</span>
                <button
                  onClick={() => removeCustomEvent(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1, padding: '0 2px' }}
                >×</button>
              </div>
            ))}
          </div>
        )}

        {/* Add new */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newEvent}
            onChange={e => setNewEvent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomEvent()}
            placeholder="event_name"
            style={{ ...inputStyle, width: 'auto', flex: 1 }}
          />
          <button
            onClick={addCustomEvent}
            style={{ padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
          >
            Add
          </button>
        </div>
      </div>

      {/* ── ECOMMERCE ─────────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Ecommerce Events</div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          Select GA4 standard ecommerce events to monitor.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ECOM_EVENTS.map(ev => (
            <button key={ev} onClick={() => toggleEcom(ev)} style={tagStyle(ecomEnabled.has(ev))}>
              {ev}
            </button>
          ))}
        </div>
        {ecomEnabled.size > 0 && (
          <div style={{ fontSize: 11, color: '#16a34a', marginTop: 10 }}>
            {ecomEnabled.size} event{ecomEnabled.size !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* ── PARAMETERS ────────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Parameter Checks</div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          For each event + parameter pair the worker checks: coverage rate (% of events with non-empty value) and week-over-week delta.
        </p>

        {/* Existing params */}
        {params.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 0', fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Event</th>
                  <th style={{ textAlign: 'left', padding: '4px 0', fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Parameter</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {params.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '7px 0', fontFamily: 'monospace', fontSize: 12 }}>{p.event_name}</td>
                    <td style={{ padding: '7px 0', fontFamily: 'monospace', fontSize: 12 }}>{p.parameter_name}</td>
                    <td style={{ padding: '7px 0', textAlign: 'right' }}>
                      <button
                        onClick={() => removeParam(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}
                      >×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add new param */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Event name</label>
            <input
              value={newEvtName}
              onChange={e => setNewEvtName(e.target.value)}
              placeholder="purchase"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Parameter name</label>
            <input
              value={newParamName}
              onChange={e => setNewParamName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addParam()}
              placeholder="transaction_id"
              style={inputStyle}
            />
          </div>
          <button
            onClick={addParam}
            style={{ padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', backgroundColor: '#16a34a', color: '#fff', border: 'none', flexShrink: 0 }}
          >
            Add
          </button>
        </div>
      </div>

      {/* ── ALERTS ────────────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Email Alerts</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Alert email</label>
            <input value={alertEmail} onChange={e => setAlertEmail(e.target.value)} placeholder="you@company.com" type="email" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Alert threshold (score below this triggers alert)</label>
            <input value={alertThresh} onChange={e => setAlertThresh(e.target.value)} type="number" min="0" max="100" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* ── FEEDBACK ──────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#dc2626' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12, color: '#16a34a' }}>
          Settings saved successfully.
        </div>
      )}

      {/* ── ACTIONS ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ fontSize: 12, color: '#dc2626', background: 'none', border: '1px solid #fecaca', borderRadius: 7, padding: '8px 14px', cursor: 'pointer' }}
        >
          {deleting ? 'Deleting…' : 'Delete project'}
        </button>

        {/* Save button — ALWAYS enabled (no isDirty gate) */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            fontSize: 13, fontWeight: 600, padding: '9px 24px', borderRadius: 8,
            backgroundColor: saving ? '#86efac' : '#16a34a',
            color: '#fff', border: 'none',
            cursor: saving ? 'wait' : 'pointer',
            opacity: 1,
          }}
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
