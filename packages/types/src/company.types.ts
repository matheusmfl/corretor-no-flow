// ─── Enums ────────────────────────────────────────────────────────────────────

export type AccountType = 'INDIVIDUAL' | 'BUSINESS'

export type TeamSize = 'SOLO' | 'SMALL_2_5' | 'MEDIUM_6_20' | 'LARGE_21_PLUS'

export type InsuranceProduct = 'AUTO' | 'HEALTH' | 'LIFE' | 'TRAVEL' | 'HOME' | 'BUSINESS' | 'RURAL'

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface Company {
  id: string
  accountType: AccountType
  legalName: string
  tradeName: string | null
  document: string
  susepNumber: string
  displayName: string
  slug: string
  logoUrl: string | null
  primaryColor: string
  bio: string | null
  whatsapp: string
  contactEmail: string | null
  instagram: string | null
  website: string | null
  city: string | null
  state: string | null
  teamSize: TeamSize | null
  specialties: InsuranceProduct[]
  createdAt: string
  updatedAt: string
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export interface CreateCompanyDto {
  accountType: AccountType
  legalName: string
  tradeName?: string
  displayName: string
  document: string
  susepNumber: string
  whatsapp: string
  contactEmail?: string
  primaryColor?: string
  state?: string
  city?: string
}

export interface UpdateCompanyDto {
  tradeName?: string
  displayName?: string
  bio?: string
  logoUrl?: string
  primaryColor?: string
  whatsapp?: string
  contactEmail?: string
  instagram?: string
  website?: string
  city?: string
  state?: string
  teamSize?: TeamSize
  specialties?: InsuranceProduct[]
}
