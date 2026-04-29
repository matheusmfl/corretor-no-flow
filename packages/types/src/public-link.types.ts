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
