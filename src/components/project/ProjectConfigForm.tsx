'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Project, ChecksCatalog, ChecksConfig, ProjectSections, CustomEventCheck, EcommerceConfig, ParameterCheck } from '@/types'
import { SECTION_META, DEFAULT_SECTIONS } from '@/types'

const ECOMMERCE_EVENTS = [
  { event_name: 'purchase',          label: 'Purchase',           desc: 'Order completed' },
  { event_name: 'begin_checkout',    label: 'Begin checkout',     desc: 'Checkout started' },
  { event_name: 'add_to_cart',       label: 'Add to cart',        desc: 'Product added to cart' },
  { event_name: 'remove_from_cart',  label: 'Remove from cart',   desc: 'Product removed' },
  { event_name: 'view_cart',         label: 'View cart',          desc: 'Cart viewed' },
  { event_name: 'view_item',         label: 'View item',          desc: 'Product page viewed' },
  { event_name: 'view_item_list',    label: 'View item list',     desc: 'Product list viewed' },
  { event_name: 'select_item',       label: 'Select item',        desc: 'Product clicked' },
  { event_name: 'add_to_wishlist',   label: 'Add to wishlist',    desc: 'Added to wishlist' },
  { event_name: 'add_payment_info',  label: 'Add payment info',   desc: 'Payment details entered' },
  { event_name: 'add_shipping_info', label: 'Add shipping info',  desc: 'Shipping address entered' },
  { event_name: 'select_promotion',  label: 'Select promotion',   desc: 'Promotion clicked' },
  { event_name: 'view_promotion',    label: 'View promotion',     desc: 'Promotion viewed' },
  { event_name: 'refund',            label: 'Refund',             desc: 'Purchase refunded' },
]

// ── Hardcoded colour palette (no CSS variables) ───────────────
const C = {
  bg:         '#ffffff',
  bgSurface:  '#f9fafb',
  bgMuted:    '#f3f4f6',
  text:       '#111827',
  textMuted:  '#6b7280',
  border:     '#e5e7eb',
  borderMid:  '#9ca3af',
  green:      '#16a34a',
  greenBg:    '#f0fdf4',
  greenBorder:'#bbf7d0',
  amber:      '#ca8a04',
  amberBg:    '#fefce8',
  amberBorder:'#fef08a',
  orange:     '#ea580c',
  orangeBg:   '#fff7ed',
  orangeBorder:'#fed7aa',
  purple:     '#7c3aed',
  purpleBg:   '#faf5ff',
  purpleBorder:'#ddd6fe',
  red:        '#dc2626',
  redBg:      '#fef2f2',
  redBorder:  '#fecaca',
}

const inp: React.CSSProperties = {
  fontSize: 13, padding: '8px 11px',
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 7, color: C.text,
  outline: 'none', boxSizing: 'border-box', width: '100%',
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '11px 18px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: C.textMuted, margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 4 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: C.textMuted, margin: '0 0 5px' }}>{hint}</p>}
      {children}
    </div>
  )
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: enabled ? C.green : C.borderMid, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s', padding: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: enabled ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s', display: 'block', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 4, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` }}>
      {label}
      <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.green, fontSize: 14, lineHeight: 1, padding: 0, opacity: 0.6 }}>×</button>
    </span>
  )
}

interface SectionRowProps {
  icon: string; title: string; desc: string; enabled: boolean; color: string; bg: string; border: string;
  onToggle: () => void; children?: React.ReactNode;
}

function SectionRow({ icon, title, desc, enabled, color, bg, border, onToggle, children }: SectionRowProps) {
  return (
    <div style={{ marginBottom: 8, border: `1.5px solid ${enabled ? border : C.border}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: enabled ? bg : C.bgMuted }}>
        <i className={`ti ${icon}`} style={{ fontSize: 15, color: enabled ? color : C.borderMid }} aria-hidden="true" />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: C.text }}>{title}</p>
          <p style={{ fontSize: 11, margin: 0, color: C.textMuted }}>{desc}</p>
        </div>
        <Toggle enabled={enabled} onToggle={onToggle} />
      </div>
      {enabled && children && (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${border}`, background: C.bg }}>
          {children}
        </div>
      )}
    </div>
  )
}

interface Props {
  project: Project; catalog: ChecksCatalog[]; checksConfig: ChecksConfig[];
  customEvents: CustomEventCheck[]; ecommerceConfig: EcommerceConfig[];
  parameterChecks: ParameterCheck[]; ecommerceCatalog: any[];
  initialSections?: ProjectSections;
}

export default function ProjectConfigForm({ project, catalog, checksConfig, customEvents, ecommerceConfig, parameterChecks, initialSections }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: project.name, ga4_property_id: project.ga4_property_id,
    own_domain: project.own_domain ?? '', alert_threshold: project.alert_threshold,
    alert_email: project.alert_email ?? '', status: project.status,
  })
  const [events, setEvents] = useState<string[]>(project.expected_events)
  const [eventInput, setEventInput] = useState('')

  function addEvent() {
    const val = eventInput.trim().replace(/,/g, '')
    if (val && !events.includes(val)) setEvents(p => [...p, val])
    setEventInput('')
  }

  const [sections, setSections] = useState<ProjectSections>({
    ...DEFAULT_SECTIONS,
    ...(initialSections ?? (project.sections as ProjectSections ?? {})),
  })

  const optChecks = catalog.filter(c => c.level === 'optional')
  const coreChecks = catalog.filter(c => c.level === 'core')
  const [optEnabled, setOptEnabled] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (const c of optChecks) {
      const cfg = checksConfig.find(cc => cc.check_key === c.check_key)
      map[c.check_key] = cfg ? cfg.is_enabled : true
    }
    return map
  })

  const [customEventList, setCustomEventList] = useState<CustomEventCheck[]>(customEvents)
  const [newCustomEvent, setNewCustomEvent] = useState('')
  const [newCustomType, setNewCustomType] = useState<'presence' | 'volume' | 'anomaly'>('presence')

  function addCustomEvent() {
    const name = newCustomEvent.trim()
    if (!name || customEventList.find(e => e.event_name === name)) return
    setCustomEventList(prev => [...prev, { id: `new_${Date.now()}`, project_id: project.id, event_name: name, check_type: newCustomType, min_expected_count: null, is_enabled: true, sort_order: prev.length, created_at: new Date().toISOString() }])
    setNewCustomEvent('')
  }

  const [ecomEnabled, setEcomEnabled] = useState<Set<string>>(() =>
    new Set(ecommerceConfig.filter(e => e.is_enabled).map(e => e.event_name))
  )

  const [paramList, setParamList] = useState<ParameterCheck[]>(parameterChecks)
  const [newParamEvent, setNewParamEvent] = useState('')
  const [newParamName, setNewParamName] = useState('')

  function addParam() {
    const ev = newParamEvent.trim(); const pn = newParamName.trim()
    if (!ev || !pn || paramList.find(p => p.event_name === ev && p.parameter_name === pn)) return
    setParamList(prev => [...prev, { id: `new_${Date.now()}`, project_id: project.id, event_name: ev, parameter_name: pn, check_type: 'not_null', expected_value: null, is_required: true, sort_order: prev.length, created_at: new Date().toISOString() }])
    setNewParamName('')
  }

  function setField<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(p => ({ ...p, [k]: v })); setSuccess(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setSuccess(false)
    try {
      const supabase = createClient()
      const pid = project.id
      const propertyId = form.ga4_property_id.startsWith('properties/') ? form.ga4_property_id : `properties/${form.ga4_property_id}`

      // 1. Core project fields
      const { error: err } = await supabase.from('projects').update({
        name: form.name, ga4_property_id: propertyId,
        own_domain: form.own_domain || null, expected_events: events,
        alert_threshold: form.alert_threshold, alert_email: form.alert_email || null,
        status: form.status,
      }).eq('id', pid)
      if (err) throw new Error(`Project update failed: ${err.message}`)

      // 2. Sections via RPC
      await supabase.rpc('update_project_sections', { p_project_id: pid, p_sections: sections })

      // 3. Optional checks config
      for (const [check_key, is_enabled] of Object.entries(optEnabled)) {
        await supabase.from('checks_config').upsert({ project_id: pid, check_key, is_enabled }, { onConflict: 'project_id,check_key' })
      }

      // 4. Custom events via RPC (bypasses PostgREST schema cache)
      const { error: ceErr } = await supabase.rpc('save_custom_event_checks', {
        p_project_id: pid,
        p_events: customEventList.map((e, i) => ({
          event_name: e.event_name, check_type: e.check_type,
          is_enabled: e.is_enabled, sort_order: i,
        })),
      })
      if (ceErr) throw new Error(`Custom events save failed: ${ceErr.message}`)

      // 5. Ecommerce config via RPC
      const { error: ecErr } = await supabase.rpc('save_ecommerce_config', {
        p_project_id: pid,
        p_events: [...ecomEnabled].map(event_name => ({ event_name })),
      })
      if (ecErr) throw new Error(`Ecommerce config save failed: ${ecErr.message}`)

      // 6. Parameter checks via RPC
      const { error: pcErr } = await supabase.rpc('save_parameter_checks', {
        p_project_id: pid,
        p_params: paramList.map((p, i) => ({
          event_name: p.event_name, parameter_name: p.parameter_name, sort_order: i,
        })),
      })
      if (pcErr) throw new Error(`Parameter checks save failed: ${pcErr.message}`)

      setSuccess(true); router.refresh()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try { await createClient().from('projects').delete().eq('id', project.id); router.push('/dashboard') }
    catch (err: any) { setError(err.message); setDeleting(false) }
  }

  const thresholdColor = form.alert_threshold >= 90 ? C.green : form.alert_threshold >= 70 ? C.amber : form.alert_threshold >= 50 ? C.orange : C.red

  return (
    <form onSubmit={handleSave}>

      {/* Basic */}
      <Card title="Basic settings">
        <Field label="Project name">
          <input required value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Client — property" style={inp} />
        </Field>
        <Field label="GA4 Property ID" hint="GA4 Admin → Property Settings → Property ID">
          <input required value={form.ga4_property_id} onChange={e => setField('ga4_property_id', e.target.value)} placeholder="properties/123456789" style={inp} />
        </Field>
        <Field label="Status">
          <div style={{ display: 'flex', gap: 8 }}>
            {(['active', 'paused'] as const).map(s => (
              <button key={s} type="button" onClick={() => setField('status', s)} style={{ flex: 1, padding: '7px 12px', borderRadius: 7, fontSize: 13, cursor: 'pointer', border: `1.5px solid ${form.status === s ? (s === 'active' ? C.greenBorder : C.borderMid) : C.border}`, background: form.status === s ? (s === 'active' ? C.greenBg : C.bgMuted) : C.bgSurface, color: form.status === s ? (s === 'active' ? C.green : C.text) : C.textMuted, fontWeight: form.status === s ? 500 : 400 }}>
                {s === 'active' ? '● Active' : '○ Paused'}
              </button>
            ))}
          </div>
        </Field>
      </Card>

      {/* Expected events */}
      <Card title="Expected events">
        <Field label="Events that should be present in GA4" hint="Type and press Enter or comma">
          <div style={{ minHeight: 40, display: 'flex', flexWrap: 'wrap' as const, gap: 6, padding: '7px 10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            {events.map(ev => <Tag key={ev} label={ev} onRemove={() => setEvents(p => p.filter(e => e !== ev))} />)}
            <input value={eventInput} onChange={e => setEventInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEvent() } if (e.key === 'Backspace' && !eventInput && events.length) setEvents(p => p.slice(0, -1)) }}
              onBlur={addEvent}
              placeholder={events.length === 0 ? 'page_view, purchase...' : ''}
              style={{ flex: 1, minWidth: 120, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.text }} />
          </div>
          {events.length > 0 && <p style={{ fontSize: 11, color: C.textMuted, margin: '4px 0 0' }}>{events.length} events configured</p>}
        </Field>
        <Field label="Own domain" hint="Used for self-referral check, e.g. orange.pl">
          <input value={form.own_domain} onChange={e => setField('own_domain', e.target.value)} placeholder="example.pl" style={inp} />
        </Field>
      </Card>

      {/* Report sections */}
      <Card title="Report sections">
        {/* Fixed */}
        {(['traffic', 'engagement', 'users'] as const).map(key => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, borderRadius: 8, background: C.bgMuted, border: `1px solid ${C.border}` }}>
            <i className={`ti ${SECTION_META[key].icon}`} style={{ fontSize: 14, color: C.green }} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: C.text }}>{SECTION_META[key].label}</p>
              <p style={{ fontSize: 11, margin: 0, color: C.textMuted }}>{SECTION_META[key].description}</p>
            </div>
            <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 20, background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}` }}>always on</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${C.border}`, margin: '10px 0 8px' }} />
        <p style={{ fontSize: 11, color: C.textMuted, margin: '0 0 10px' }}>Toggle additional sections. Configuration expands inline.</p>

        {/* Custom events */}
        <SectionRow icon="ti-bolt" title="Custom events" desc="Monitor specific custom events — presence, volume, anomaly"
          enabled={sections.custom_events} color={C.amber} bg={C.amberBg} border={C.amberBorder}
          onToggle={() => setSections(p => ({ ...p, custom_events: !p.custom_events }))}>
          {customEventList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5, marginBottom: 10 }}>
              {customEventList.map(ev => (
                <div key={ev.event_name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, background: C.bgMuted, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', flex: 1, color: C.text }}>{ev.event_name}</span>
                  <select value={ev.check_type} onChange={e => setCustomEventList(p => p.map(x => x.event_name === ev.event_name ? { ...x, check_type: e.target.value as any } : x))} style={{ ...inp, width: 'auto', fontSize: 11, padding: '3px 7px' }}>
                    <option value="presence">Presence</option>
                    <option value="volume">Volume WoW</option>
                    <option value="anomaly">Anomaly</option>
                  </select>
                  <button type="button" onClick={() => setCustomEventList(p => p.filter(x => x.event_name !== ev.event_name))} style={{ fontSize: 14, color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newCustomEvent} onChange={e => setNewCustomEvent(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomEvent())} placeholder="event_name" style={{ ...inp, flex: 1 }} />
            <select value={newCustomType} onChange={e => setNewCustomType(e.target.value as any)} style={{ ...inp, width: 'auto', flexShrink: 0 }}>
              <option value="presence">Presence</option>
              <option value="volume">Volume WoW</option>
              <option value="anomaly">Anomaly</option>
            </select>
            <button type="button" onClick={addCustomEvent} style={{ fontSize: 13, padding: '8px 14px', borderRadius: 7, background: C.green, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}>+ Add</button>
          </div>
          {customEventList.length === 0 && <p style={{ fontSize: 11, color: C.textMuted, margin: '8px 0 0' }}>No custom events yet. Add event names above.</p>}
        </SectionRow>

        {/* Ecommerce */}
        <SectionRow icon="ti-shopping-cart" title="Ecommerce" desc="Track standard GA4 ecommerce events"
          enabled={sections.ecommerce} color={C.orange} bg={C.orangeBg} border={C.orangeBorder}
          onToggle={() => setSections(p => ({ ...p, ecommerce: !p.ecommerce }))}>
          <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 10px' }}>Select events to monitor:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {ECOMMERCE_EVENTS.map(ev => {
              const isOn = ecomEnabled.has(ev.event_name)
              return (
                <div key={ev.event_name} onClick={() => setEcomEnabled(prev => { const n = new Set(prev); if (n.has(ev.event_name)) n.delete(ev.event_name); else n.add(ev.event_name); return n })}
                  style={{ padding: '9px 12px', borderRadius: 7, cursor: 'pointer', border: `1.5px solid ${isOn ? C.orange : C.borderMid}`, background: isOn ? C.orangeBg : C.bgSurface, userSelect: 'none' as const }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: isOn ? 500 : 400, color: isOn ? C.orange : C.text }}>{ev.label}</span>
                    {isOn && <span style={{ fontSize: 12, color: C.orange, fontWeight: 700 }}>✓</span>}
                  </div>
                  <p style={{ fontSize: 10, fontFamily: 'monospace', color: C.textMuted, margin: '2px 0 0' }}>{ev.event_name}</p>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 11, color: C.textMuted, margin: '8px 0 0' }}>{ecomEnabled.size} event{ecomEnabled.size !== 1 ? 's' : ''} selected</p>
        </SectionRow>

        {/* Parameters */}
        <SectionRow icon="ti-code" title="Parameters" desc="Verify event parameters — coverage and WoW change"
          enabled={sections.parameters} color={C.purple} bg={C.purpleBg} border={C.purpleBorder}
          onToggle={() => setSections(p => ({ ...p, parameters: !p.parameters }))}>
          <p style={{ fontSize: 11, color: C.textMuted, margin: '0 0 8px' }}>
            Report will show: <strong>coverage %</strong> (events with non-empty value) and <strong>WoW change</strong>.
            Parameter must be registered as a custom dimension in GA4 Admin → Custom definitions.
          </p>
          {paramList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5, marginBottom: 10 }}>
              {paramList.map(p => (
                <div key={`${p.event_name}_${p.parameter_name}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, background: C.bgMuted, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: C.textMuted, minWidth: 90 }}>{p.event_name}</span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', flex: 1, color: C.text }}>{p.parameter_name}</span>
                  <button type="button" onClick={() => setParamList(prev => prev.filter(x => !(x.event_name === p.event_name && x.parameter_name === p.parameter_name)))} style={{ fontSize: 14, color: C.red, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            <div style={{ flex: '0 0 140px' }}>
              <p style={{ fontSize: 10, color: C.textMuted, margin: '0 0 3px' }}>Event name</p>
              <input value={newParamEvent} onChange={e => setNewParamEvent(e.target.value)} placeholder="e.g. purchase" style={inp} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <p style={{ fontSize: 10, color: C.textMuted, margin: '0 0 3px' }}>Parameter name</p>
              <input value={newParamName} onChange={e => setNewParamName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addParam())} placeholder="e.g. transaction_id" style={inp} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
              <button type="button" onClick={addParam} style={{ fontSize: 13, padding: '8px 14px', borderRadius: 7, background: C.purple, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>+ Add</button>
            </div>
          </div>
          {paramList.length === 0 && <p style={{ fontSize: 11, color: C.textMuted, margin: '8px 0 0' }}>No parameters configured yet.</p>}
        </SectionRow>
      </Card>

      {/* Core checks */}
      <Card title="Core checks">
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
          {coreChecks.map(c => (
            <div key={c.check_key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 7, background: C.bgMuted, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.text }}>{c.label}</span>
              <span style={{ fontSize: 10, color: C.green, padding: '1px 6px', borderRadius: 3, background: C.greenBg, border: `1px solid ${C.greenBorder}` }}>CORE</span>
            </div>
          ))}
          {optChecks.map(c => (
            <div key={c.check_key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 7, background: C.bgMuted, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: C.text }}>{c.label}</span>
                <span style={{ fontSize: 10, color: C.amber, padding: '1px 6px', borderRadius: 3, background: C.amberBg, border: `1px solid ${C.amberBorder}` }}>OPT</span>
              </div>
              <Toggle enabled={optEnabled[c.check_key] ?? true} onToggle={() => setOptEnabled(p => ({ ...p, [c.check_key]: !p[c.check_key] }))} />
            </div>
          ))}
        </div>
      </Card>

      {/* Alerts */}
      <Card title="Email alerts">
        <Field label="Score threshold" hint="Alert sent when score drops below this value">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="range" min="0" max="100" step="5" value={form.alert_threshold} onChange={e => setField('alert_threshold', parseInt(e.target.value))} style={{ flex: 1, accentColor: thresholdColor }} />
            <span style={{ fontSize: 20, fontWeight: 500, color: thresholdColor, minWidth: 36, textAlign: 'right' as const }}>{form.alert_threshold}</span>
          </div>
        </Field>
        <Field label="Email address">
          <input type="email" value={form.alert_email} onChange={e => setField('alert_email', e.target.value)} placeholder="rafal@bettersteps.pl" style={inp} />
        </Field>
      </Card>

      {error && <div style={{ fontSize: 12, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ fontSize: 12, color: C.green, background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>✓ Changes saved</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" onClick={handleDelete} disabled={deleting} style={{ fontSize: 12, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          {deleting ? 'Deleting...' : 'Delete project'}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => router.back()} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgMuted, color: C.textMuted, cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ fontSize: 13, padding: '8px 20px', borderRadius: 8, background: saving ? '#86efac' : C.green, color: '#fff', fontWeight: 500, border: 'none', cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
