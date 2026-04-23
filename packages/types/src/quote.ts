export type QuoteStatus = 'processing' | 'ready' | 'error' | 'pending_review'

export type QuoteProduct = 'auto' | 'health' | 'travel' | 'home'

export interface Quote {
  id: string
  companyId: string
  product: QuoteProduct
  status: QuoteStatus
  clientName?: string
  clientEmail?: string
  originalPdfUrl?: string
  generatedPdfUrl?: string
  publicLinkToken?: string
  publicLinkExpiresAt?: Date
  extractedData?: AutoQuoteData
  createdAt: Date
  updatedAt: Date
}

export interface AutoQuoteData {
  insurer: string
  plate?: string
  vehicleModel?: string
  vehicleYear?: number
  coverages: Coverage[]
  totalPremium: number
  installments?: Installment[]
  validUntil?: Date
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
  dueDate?: Date
}
