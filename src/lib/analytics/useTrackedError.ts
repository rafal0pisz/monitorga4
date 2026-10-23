'use client'

import { useCallback, useState } from 'react'
import { pushDataLayerEvent } from './dataLayer'

// Drop-in replacement for `useState<string | null>(null)` on an "error"
// slot — same [value, setter] shape, so swapping it in is a one-line change
// — that also pushes GA4's recommended "exception" event whenever a
// component surfaces an error message to the user. `context` identifies
// which form/action it came from, since "description" alone across the
// whole site would make every error look the same in GA4.
export function useTrackedError(context: string): [string | null, (message: string | null) => void] {
  const [error, setErrorState] = useState<string | null>(null)

  const setError = useCallback((message: string | null) => {
    setErrorState(message)
    if (message) pushDataLayerEvent('exception', { description: `${context}: ${message}`, fatal: false })
  }, [context])

  return [error, setError]
}
