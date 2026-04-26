import type { InsuranceProduct } from './company.types'
import type { Insurer } from './quote.types'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'CANCELED' | 'EXPIRED'

// ─── Plan features ────────────────────────────────────────────────────────────

export interface PlanFeatures {
  customBranding: boolean
  whatsappButton: boolean
  openTracking: boolean
  comparison: boolean
}

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Plan {
  id: string
  name: string
  slug: string
  quotesPerMonth: number
  products: InsuranceProduct[]
  insurers: Insurer[]
  features: PlanFeatures
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  companyId: string
  planId: string
  plan: Plan
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  quotesUsedThisMonth: number
  createdAt: string
  updatedAt: string
}
