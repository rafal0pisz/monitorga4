// Shared by every admin-only route/page (the dashboard itself, the CSV
// export) so the allowlist check can't drift between them.
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const allowlist = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return allowlist.includes(email.toLowerCase())
}
