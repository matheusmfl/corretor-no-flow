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
  vehicleUsage?: string
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
  /**
   * Insurer-specific enrichment extracted from the PDF.
   * These fields go beyond the generic coverage flags and hold plan names,
   * tier labels, service booleans, and repair conditions that vary by insurer.
   * Kept separate from `coverage` so generic fields remain cross-insurer.
   */
  coverageDetails?: {
    assistance?: {
      /** Plan name as printed, e.g. "Completa", "VIP". */
      planName?: string
      /** Base towing km included in the plan (e.g. 200). */
      towingKmBase?: number
      /** Additional towing km contracted (e.g. 100). */
      towingKmAdditional?: number
      /** Total towing km = base + additional, when the PDF states the formula. */
      towingKmTotal?: number
    }
    glass?: {
      /** Tier label as printed, e.g. "Completo", "Básico", "Não possui". */
      tier?: string
    }
    replacementVehicle?: {
      /** Category as printed, e.g. "Básico (Mecânico)". */
      category?: string
    }
    services?: {
      martelinho?: boolean
      latariaEPintura?: boolean
      repareFacil?: boolean
      trocaParaChoque?: boolean
      rodaPneuSuspensao?: boolean
      logoMarcaVidros?: boolean
    }
    repair?: {
      /** e.g. "Livre Escolha", "Rede Referenciada". */
      shopType?: string
      /** e.g. "Novas originais", "Novas Compatíveis". */
      partsType?: string
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
  towing: CoverageItem & {
    /** Total towing km limit (base + additional), when known. */
    kmTotal?: number
    /** Base towing km included in the plan (e.g. 200). */
    kmBase?: number
    /** Additional towing km contracted beyond the base (e.g. 100). */
    kmAdditional?: number
    /** Plan name as extracted, e.g. "Completa", "VIP". */
    planName?: string
    /** Short catalog tooltip for the plan — used in hover/title UI. Comes from insurer knowledge, not the PDF. */
    tooltip?: string
    /** Structured PDF footnote — includes km breakdown when base/additional/total are all known. */
    footnote?: string
  }
  /** Glass protection. tier is the raw value from the PDF, e.g. "Completo", "Básico", "Não possui". */
  glass: CoverageItem & {
    tier?: string
    /** Static catalog tooltip for the glass tier. */
    tooltip?: string
  }
  replacementVehicle: CoverageItem & {
    days?: number
    /** Category as extracted, e.g. "Básico (Mecânico)". */
    category?: string
  }
  /** Fast repair / martelinho e para-choque. */
  martelinho: CoverageItem
  /** Bodywork and painting service / lataria e pintura. */
  latariaEPintura: CoverageItem
  /** Repare Fácil — Reparo Rápido (Bradesco code 126). */
  repareFacil: CoverageItem
  /** Troca de Para-Choque (Bradesco code 128). */
  trocaParaChoque: CoverageItem
  /** Wheel, tyre and suspension / roda, pneu e suspensão. */
  rodaPneuSuspensao: CoverageItem
  /** Brand logo on glass / logomarca (vidros). */
  logoMarcaVidros: CoverageItem
  /** e.g. "Rede Referenciada", "Livre Escolha". */
  repairShopType?: string
  /** e.g. "Novas originais", "Novas Compatíveis". */
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
