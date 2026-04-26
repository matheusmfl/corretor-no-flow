import type { InsuranceProduct } from './company.types'

// ─── Field comparison types ────────────────────────────────────────────────────

export type FieldComparisonType =
  | 'LOWER_IS_BETTER'
  | 'HIGHER_IS_BETTER'
  | 'BOOLEAN_HAS_IS_BETTER'
  | 'BOOLEAN_NONE_IS_BETTER'
  | 'RANKED_ENUM'

// ─── Comparison field ─────────────────────────────────────────────────────────

export interface ComparisonField {
  key: string
  label: string
  type: FieldComparisonType
  rankOrder?: string[]
}

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface ComparisonSchema {
  id: string
  product: InsuranceProduct
  fields: ComparisonField[]
  createdAt: string
  updatedAt: string
}
