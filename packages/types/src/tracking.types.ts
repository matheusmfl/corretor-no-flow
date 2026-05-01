export type QuoteEventType =
  | 'PAGE_OPEN'
  | 'PAGE_CLOSE'
  | 'HEARTBEAT'
  | 'INSURER_VIEW'
  | 'PAYMENT_VIEW'
  | 'WHATSAPP_CLICK'
  | 'PDF_DOWNLOAD'

export interface CreateSessionDto {
  processId: string
  sessionId: string
  referrer?: string | null
}

export interface TrackEventDto {
  type: QuoteEventType
  payload?: Record<string, unknown>
}

export interface QuoteSessionSummary {
  id: string
  sessionId: string
  isOwner: boolean
  startedAt: string
  lastSeenAt: string
  endedAt: string | null
  durationSeconds: number | null
  referrer: string | null
  userAgent: string | null
  events: { type: QuoteEventType; payload: Record<string, unknown> | null; createdAt: string }[]
}

export interface QuoteInsurerViewCount {
  insurer: string
  count: number
}

export interface QuoteSessionsByDay {
  date: string  // YYYY-MM-DD
  count: number
}

export interface QuoteProcessMetrics {
  totalSessions: number
  avgDurationSeconds: number | null
  firstOpenedAt: string | null
  lastOpenedAt: string | null
  whatsappClicks: number
  pdfDownloads: number
  topInsurer: string | null
  insurerViews: QuoteInsurerViewCount[]
  sessionsByDay: QuoteSessionsByDay[]
  recentSessions: QuoteSessionSummary[]
}
