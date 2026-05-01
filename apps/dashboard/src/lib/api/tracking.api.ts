import type { QuoteEventType, QuoteProcessMetrics } from '@corretor/types'
import { apiClient } from './client'
import { getBrowserApiBaseUrl } from './base-url'

const API_URL = getBrowserApiBaseUrl()

async function post(path: string, body?: unknown): Promise<void> {
  await fetch(`${API_URL}/api/tracking${path}`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        body ? JSON.stringify(body) : undefined,
    keepalive:   true,
  }).catch(() => undefined) // tracking is fire-and-forget
}

export async function createSession(processId: string, sessionId: string, referrer?: string) {
  await post('/sessions', { processId, sessionId, referrer })
}

export async function sendHeartbeat(sessionId: string) {
  await post(`/sessions/${sessionId}/heartbeat`)
}

export async function trackEvent(sessionId: string, type: QuoteEventType, payload?: Record<string, unknown>) {
  await post(`/sessions/${sessionId}/events`, { type, payload })
}

export async function endSession(sessionId: string) {
  await post(`/sessions/${sessionId}/end`)
}

export function getProcessMetrics(processId: string): Promise<QuoteProcessMetrics> {
  return apiClient.get<QuoteProcessMetrics>(`/api/quotes/${processId}/metrics`)
}
