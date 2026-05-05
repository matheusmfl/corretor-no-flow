// ─── Enums ────────────────────────────────────────────────────────────────────

import type { InsuranceProduct } from './company.types'
export type { InsuranceProduct } from './company.types'

export type Insurer =
  | 'BRADESCO'
  | 'PORTO_SEGURO'
  | 'TOKIO_MARINE'
  | 'SULAMERICA'
  | 'SUHAI'
  | 'ALIRO'
  | 'ALLIANZ'
  | 'YELLOW'
  | 'AZUL'

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
  vehicle: {
    plate?: string
    model: string
    yearManufacture?: number
    yearModel?: number
    chassis?: string
    fipeCode?: string
    fipeValue?: number
  }
  driver: {
    name?: string
    cpf?: string
    birthDate?: string
    gender?: string
    maritalStatus?: string
  }
  quoteNumber?: string
  insurer: string
  validFrom?: string
  validUntil?: string
  bonusClass?: string
  coverage: {
    vehicle?: {
      fipePercentage?: number
      lmi?: string
      deductible?: number
      deductibleType?: string
    }
    rcf?: {
      propertyDamage?: number
      bodilyInjury?: number
      moralDamages?: number
      combinedSingle?: number
    }
    app?: {
      death?: number
      disability?: number
      medical?: number
      passengerCount?: number
    }
    assistance?: {
      towing?: boolean
      glassProtection?: boolean
      replacementVehicle?: boolean
      replacementDays?: number
    }
  }
  deductibles: Array<{
    item: string
    value: number
    type?: string
  }>
  premium: {
    base?: number
    rcfTotal?: number
    appTotal?: number
    iof?: number
    total: number
  }
  paymentMethods: Array<{
    id: string
    type: 'debit' | 'credit_bradesco' | 'credit_card' | 'coupon'
    label: string
    installments: Array<{
      number: number
      amount: number
      total?: number
      hasInterest?: boolean
      discountLabel?: string
    }>
  }>
}

// ─── Insurer detection ────────────────────────────────────────────────────────

export interface InsurerDetectionSignal {
  insurer: string
  type: 'strong' | 'medium' | 'weak'
  source: string
  value: string
}

export interface InsurerDetectionResult {
  detectedInsurer: Insurer | null
  confidence: 'high' | 'medium' | 'low'
  family?: string
  /** True when the file is known to not be processable as AUTO (family insurer, wrong product). */
  notProcessable?: boolean
  /** Detected insurance product/line (AUTO, HEALTH). Null when no clear signal found. */
  detectedProduct?: InsuranceProduct | null
  /** Confidence in the product/line detection. */
  productConfidence?: 'high' | 'medium' | 'low'
  candidates: Insurer[]
  signals: InsurerDetectionSignal[]
  reason?: string
}

export interface DetectInsurerResponse extends InsurerDetectionResult {
  supported: boolean
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface ReviewQuoteDto {
  name?: string
  extractedData?: Record<string, unknown>
}
