// ─── Enums ────────────────────────────────────────────────────────────────────

export type Insurer =
  | 'BRADESCO'
  | 'PORTO_SEGURO'
  | 'TOKIO_MARINE'
  | 'SULAMERICA'
  | 'SUHAI'
  | 'ALIRO'
  | 'ALLIANZ'
  | 'YELLOW'

export type QuoteStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PENDING_REVIEW'
  | 'READY'
  | 'FAILED'

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface Quote {
  id: string
  processId: string
  insurer: Insurer
  status: QuoteStatus
  name: string | null
  nameSlug: string | null
  originalFileKey: string | null
  extractedData: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

// ─── Extracted data (AUTO) ────────────────────────────────────────────────────

export interface AutoQuoteData {
  plate?: string
  vehicleModel?: string
  vehicleYear?: number
  coverages: Coverage[]
  totalPremium: number
  installments?: Installment[]
  validUntil?: string
}

export interface Coverage {
  name: string
  description: string
  limit?: string
  deductible?: string
}

export interface Installment {
  number: number
  amount: number
  dueDate?: string
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface ReviewQuoteDto {
  name?: string
  extractedData?: Record<string, unknown>
}
