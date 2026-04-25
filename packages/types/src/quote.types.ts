import type { InsuranceProduct } from './company.types'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type QuoteStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PENDING_REVIEW'
  | 'READY'
  | 'SENT'
  | 'VIEWED'
  | 'EXPIRED'

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface Quote {
  id: string
  companyId: string
  product: InsuranceProduct
  status: QuoteStatus
  clientName: string | null
  clientPhone: string | null
  publicToken: string | null
  originalFileKey: string | null
  extractedData: AutoQuoteData | null
  expiresAt: string | null
  openedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface QuoteListItem {
  id: string
  product: InsuranceProduct
  status: QuoteStatus
  clientName: string | null
  publicToken: string | null
  createdAt: string
  updatedAt: string
}

// ─── Extracted data ───────────────────────────────────────────────────────────

export interface AutoQuoteData {
  insurer: string
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

export interface UploadQuoteDto {
  product: InsuranceProduct
  clientName?: string
}

export interface ReviewQuoteDto {
  clientName?: string
  clientPhone?: string
  extractedData?: Record<string, unknown>
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface QuoteListResponse {
  items: QuoteListItem[]
  total: number
  page: number
  limit: number
}
