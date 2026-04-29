import type { InsuranceProduct } from './company.types'
import type { Insurer, Quote } from './quote.types'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type QuoteProcessStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'PENDING_REVIEW'
  | 'READY'
  | 'PUBLISHED'
  | 'ARCHIVED'

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface QuoteProcess {
  id: string
  companyId: string
  product: InsuranceProduct
  status: QuoteProcessStatus
  clientName: string | null
  clientPhone: string | null
  publicToken: string | null
  expiresAt: string | null
  openedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface QuoteProcessDetail extends QuoteProcess {
  quotes: Quote[]
}

export interface QuoteProcessListItem {
  id: string
  product: InsuranceProduct
  status: QuoteProcessStatus
  clientName: string | null
  publicToken: string | null
  openedAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface ListProcessesQuery {
  status?: QuoteProcessStatus
  search?: string
  page?: number
  limit?: number
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateQuoteProcessDto {
  product: InsuranceProduct
  insurers: Insurer[]
  clientName?: string
  clientPhone?: string
}

export interface UpdateQuoteProcessDto {
  clientName?: string
  clientPhone?: string
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface QuoteProcessListResponse {
  items: QuoteProcessListItem[]
  total: number
  page: number
  limit: number
}

export type { Insurer }
