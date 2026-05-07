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
  | 'MITSUI_SUMITOMO'
  | 'ITAU'

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
  segment?: string
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

// ─── Rich coverage display ────────────────────────────────────────────────────

/**
 * Four-state semantic for a coverage field shown in PDF/public link.
 *
 * - contracted     : coverage is present and active in the quote
 * - not_contracted : coverage exists in the product but was not taken (e.g. vidros false)
 * - not_applicable : coverage does not apply to this product line
 *                    (e.g. vehicle casco in Assistência Exclusiva, roubo-only products)
 * - not_found      : extraction did not return data — unknown, render nothing or "—"
 */
export type CoverageStatus = 'contracted' | 'not_contracted' | 'not_applicable' | 'not_found'

export interface CoverageItem {
  status: CoverageStatus
  /** Human-readable summary, e.g. "100% FIPE", "15 dias", "R$ 50.000". */
  detail?: string
}

/** Computed rich coverage ready for rendering. Produced by buildCoverageDisplay(). */
export interface RichCoverage {
  vehicle: CoverageItem & {
    fipePercentage?: number
    deductible?: number
    deductibleType?: string
  }
  rcf: CoverageItem & {
    propertyDamage?: number
    bodilyInjury?: number
    moralDamages?: number
  }
  app: CoverageItem & {
    death?: number
    disability?: number
    passengerCount?: number
  }
  towing: CoverageItem & { kmLimit?: number }
  /** Glass protection tier: repair = only windshield repair, basic = replacement, plus = enhanced. */
  glass: CoverageItem & { tier?: 'repair' | 'basic' | 'plus' }
  replacementVehicle: CoverageItem & { days?: number }
  /** Fast repair / martelinho de ouro. */
  fastRepair: CoverageItem
  /** e.g. "Rede Referenciada", "Livre Escolha". Undefined until parsed. */
  repairShopType?: string
  /** e.g. "Novas Originais", "Novas Compatíveis". Undefined until parsed. */
  partsType?: string
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
