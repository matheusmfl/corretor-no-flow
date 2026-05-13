export type DraftFieldSource =
  | 'extracted'
  | 'inferred'
  | 'manual'
  | 'table_lookup'
  | 'ocr'
  | 'vision_inferred'
  | 'not_found'

export interface DraftField<T> {
  value: T | null
  source: DraftFieldSource
  confidence: number
  evidence?: string
  needsReview: boolean
}

export interface HealthMemberLife {
  age: number
  name?: string
  label?: string
  relationship?: string
  ageBand?: string
  source: DraftFieldSource
  needsReview: boolean
}

export interface HealthAgeBandPrice {
  bandLabel: string
  minAge: number
  maxAge: number
  pricePerLife: number
}

export type HealthQuoteOptionSourceType =
  | 'portal_pdf'
  | 'manual_table'
  | 'spreadsheet_import'

export interface HealthQuoteOption {
  sourceType: HealthQuoteOptionSourceType
  carrierOrOperator: string
  administratorOrChannel?: string
  planName: string
  productCode?: string
  accommodation: DraftField<string>
  coparticipation: DraftField<string>
  reimbursementMode: DraftField<string>
  region?: string
  validUntil: DraftField<string>
  ageBandPrices?: HealthAgeBandPrice[]
  perLifePrices?: Array<{ lifeIndex: number; price: number; bandLabel?: string }>
  monthlyTotal?: number
  firstInstallmentTotal?: number
  dental: DraftField<string>
  notes?: string
  warnings?: string[]
}

export interface HealthManualTableSource {
  sourceName: string
  planName: string
  accommodation?: string
  coparticipation?: string
  region?: string
  validFrom?: string
  validUntil?: string
  ageBandPrices: HealthAgeBandPrice[]
  sourceFile?: string
  reviewedByBroker: boolean
}

export interface HealthQuoteDraft {
  clientName?: string
  companyDocument?: string
  state?: string
  city?: string
  sourceFiles?: string[]
  lives: HealthMemberLife[]
  quoteOptions: HealthQuoteOption[]
  tables?: HealthManualTableSource[]
  warnings?: string[]
  reviewStatus: 'pending' | 'in_review' | 'confirmed'
}
