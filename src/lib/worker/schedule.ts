// Shared between /api/worker/run (writes this marker after a successful
// automatic pass) and /api/worker/watchdog (reads it to confirm today's
// automatic run actually happened) — a single source of truth for the key
// name and the "what day is it in Poland" calculation, so the two can't
// silently drift apart.
export const AUTO_RUN_MARKER_KEY = 'worker_last_auto_run_date'

export function currentWarsawDate(): string {
  // en-CA gives YYYY-MM-DD directly, matching dqs_runs.run_date's format.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date())
}
