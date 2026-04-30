export interface PublicQuoteItem {
  id: string
  insurer: string
  name: string | null
  extractedData: Record<string, unknown> | null
}

export interface PublicCompany {
  displayName: string
  slug: string
  logoUrl: string | null
  primaryColor: string
  whatsapp: string
  bio: string | null
  contactEmail: string | null
  instagram: string | null
  website: string | null
  city: string | null
  state: string | null
  street: string | null
  neighborhood: string | null
  zipCode: string | null
}

export interface PublicProcessResponse {
  process: {
    id: string
    product: string
    clientName: string | null
    expiresAt: string
  }
  quotes: PublicQuoteItem[]
  company: PublicCompany
}
