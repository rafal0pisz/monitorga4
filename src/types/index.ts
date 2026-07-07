// ============================================================
// GA4 Quality Score — Shared TypeScript Types
// Odpowiadają dokładnie tabelom w Supabase
// ============================================================

export type CheckStatus = 'pass' | 'warn' | 'fail'
export type RunStatus = 'completed' | 'failed' | 'running'
export type AuthType = 'service_account' | 'oauth'
export type ProjectStatus = 'active' | 'paused'
export type CheckLevel = 'core' | 'optional'

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Profile {
  id: string
  org_id: string
  full_name: string | null
  role: 'owner' | 'member'
  created_at: string
}

export interface Project {
  id: string
  org_id: string
  name: string
  ga4_property_id: string
  ga4_auth_type: AuthType
  ga4_credentials: string | null
  own_domain: string | null
  expected_events: string[]
  alert_threshold: number
  alert_email: string | null
  share_token: string
  status: ProjectStatus
  auto_run?: boolean | null
  sections?: Record<string, boolean> | null
  created_at: string
  updated_at: string
}

export interface ChecksCatalog {
  check_key: string
  level: CheckLevel
  weight_default: number
  label: string
  description: string
  fail_advice: string
}

export interface ChecksConfig {
  id: string
  project_id: string
  check_key: string
  is_enabled: boolean
  weight_override: number | null
}

export interface DqsRun {
  id: string
  project_id: string
  run_date: string
  score_total: number | null
  status: RunStatus
  error_message: string | null
  ran_at: string
}

export interface DqsResult {
  id: string
  run_id: string
  check_key: string
  check_level: CheckLevel
  status: CheckStatus
  score: number
  weight: number
  value: Record<string, unknown> | null
  message: string
}

export interface AlertLog {
  id: string
  project_id: string
  run_id: string
  score: number
  sent_at: string
}

export interface WeeklyReport {
  id: string
  project_id: string
  week_start: string
  pdf_url: string | null
  sent_at: string | null
}

// ============================================================
// Widoki Supabase (views)
// ============================================================

export interface DashboardProject {
  id: string
  org_id: string
  name: string
  ga4_property_id: string
  status: ProjectStatus
  alert_threshold: number
  share_token: string
  last_run_date: string | null
  last_score: number | null
  run_status: RunStatus | null
  prev_week_score: number | null
}

export interface ScoreHistory {
  run_date: string
  score_total: number
}

// ============================================================
// Worker types
// ============================================================

export interface CheckResult {
  check_key: string
  check_level: CheckLevel
  status: CheckStatus
  score: number
  weight: number
  value: Record<string, unknown>
  message: string
}

export interface WorkerRunResult {
  project_id: string
  run_date: string
  score_total: number
  results: CheckResult[]
}

// ============================================================
// Score helper
// ============================================================

export type ScoreGrade = 'excellent' | 'good' | 'warning' | 'critical'

// Single source of truth for score → grade/color across the whole app
// (sidebar, dashboard, project page, share page). Scale:
//   0–50   critical  red
//   51–80  warning   orange
//   81–90  good      green
//   91–100 excellent dark green
export function getScoreGrade(score: number | null): ScoreGrade {
  if (score === null) return 'critical'
  if (score >= 91) return 'excellent'
  if (score >= 81) return 'good'
  if (score >= 51) return 'warning'
  return 'critical'
}

export const SCORE_GRADE_STYLE: Record<ScoreGrade, { color: string; bg: string; border: string; label: string }> = {
  excellent: { color: '#15803d', bg: '#f0fdf4', border: '#86efac', label: 'Excellent' },
  good:      { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Good' },
  warning:   { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: 'Warning' },
  critical:  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Critical' },
}

export function getScoreColor(grade: ScoreGrade): string {
  return SCORE_GRADE_STYLE[grade].color
}

export function getScoreLabel(grade: ScoreGrade): string {
  return SCORE_GRADE_STYLE[grade].label
}

// Convenience: go straight from a raw score to its color.
export function scoreColor(score: number | null): string {
  return getScoreColor(getScoreGrade(score))
}

// ============================================================
// Sections architecture (Migration 005)
// ============================================================

export interface ProjectSections {
  traffic:       boolean
  engagement:    boolean
  users:         boolean
  custom_events: boolean
  ecommerce:     boolean
  parameters:    boolean
}

export interface CustomEventCheck {
  id: string
  project_id: string
  event_name: string
  check_type: 'presence' | 'volume' | 'anomaly'
  min_expected_count: number | null
  is_enabled: boolean
  sort_order: number
  created_at: string
}

export interface EcommerceConfig {
  id: string
  project_id: string
  event_name: string
  is_enabled: boolean
  check_revenue: boolean
  check_quantity: boolean
  check_funnel: boolean
  created_at: string
}

export interface ParameterCheck {
  id: string
  project_id: string
  event_name: string
  parameter_name: string
  check_type: 'not_null' | 'not_empty' | 'regex' | 'in_list'
  expected_value: string | null
  is_required: boolean
  sort_order: number
  created_at: string
}

export interface EcommerceEventCatalog {
  event_name: string
  label: string
  description: string | null
  is_standard: boolean
  sort_order: number
}

export interface ParameterCatalogItem {
  event_name: string
  parameter_name: string
  label: string
  check_type_default: string
  is_required_default: boolean
}

export const DEFAULT_SECTIONS: ProjectSections = {
  traffic:       true,
  engagement:    true,
  users:         true,
  custom_events: false,
  ecommerce:     false,
  parameters:    false,
}

export const SECTION_META: Record<keyof ProjectSections, { label: string; description: string; icon: string }> = {
  traffic:       { label: 'Traffic source',  description: 'Traffic sources, channels, attribution',   icon: 'ti-arrows-exchange' },
  engagement:    { label: 'Engagement',      description: 'Bounce rate, sessions, page titles',       icon: 'ti-activity'        },
  users:         { label: 'Users',           description: 'Geography, bot traffic, user types',       icon: 'ti-users'           },
  custom_events: { label: 'Custom events',   description: 'Monitor custom events from your config',   icon: 'ti-bolt'            },
  ecommerce:     { label: 'Ecommerce',       description: 'Revenue, funnel, purchase events',         icon: 'ti-shopping-cart'   },
  parameters:    { label: 'Parameters',      description: 'Verify event parameters per event',        icon: 'ti-code'            },
}
