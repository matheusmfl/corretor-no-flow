'use client'

import { useEffect, useRef } from 'react'
import type { QuoteEventType } from '@corretor/types'
import { createSession, endSession, sendHeartbeat, trackEvent } from '@/lib/api/tracking.api'

const HEARTBEAT_INTERVAL_MS = 30_000
const SESSION_KEY = (processId: string) => `session_id_${processId}`

function getOrCreateSessionId(processId: string): string {
  const key = SESSION_KEY(processId)
  const stored = sessionStorage.getItem(key)
  if (stored) return stored
  const id = crypto.randomUUID()
  sessionStorage.setItem(key, id)
  return id
}

export function useQuoteTracking(processId: string) {
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    const sessionId = getOrCreateSessionId(processId)
    sessionIdRef.current = sessionId

    const referrer = document.referrer || undefined
    createSession(processId, sessionId, referrer)

    const heartbeatTimer = setInterval(() => {
      sendHeartbeat(sessionId)
    }, HEARTBEAT_INTERVAL_MS)

    function handleUnload() {
      endSession(sessionId)
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(heartbeatTimer)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [processId])

  function track(type: QuoteEventType, payload?: Record<string, unknown>) {
    if (sessionIdRef.current) {
      trackEvent(sessionIdRef.current, type, payload)
    }
  }

  return { track }
}
