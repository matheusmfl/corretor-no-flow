import type {
  CreateQuoteProcessDto,
  ListProcessesQuery,
  QuoteProcess,
  QuoteProcessDetail,
  QuoteProcessListResponse,
  ReviewQuoteDto,
} from '@corretor/types'
import { apiClient } from './client'

export const quoteProcessApi = {
  create(dto: CreateQuoteProcessDto): Promise<QuoteProcess> {
    return apiClient.post('/api/quotes', dto)
  },

  list(query: ListProcessesQuery = {}): Promise<QuoteProcessListResponse> {
    const { page = 1, limit = 20, status, search } = query
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    return apiClient.get(`/api/quotes?${params.toString()}`)
  },

  getById(id: string): Promise<QuoteProcessDetail> {
    return apiClient.get(`/api/quotes/${id}`)
  },

  uploadQuote(processId: string, quoteId: string, file: File): Promise<{ quoteId: string; processId: string; status: 'queued' }> {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post(`/api/quotes/${processId}/quotes/${quoteId}/upload`, form)
  },

  reviewQuote(processId: string, quoteId: string, dto: ReviewQuoteDto): Promise<QuoteProcessDetail> {
    return apiClient.patch(`/api/quotes/${processId}/quote/${quoteId}/review`, dto)
  },

  generatePdf(processId: string): Promise<{ quoteId: string; filePath: string }[]> {
    return apiClient.post(`/api/quotes/${processId}/generate`)
  },

  publishProcess(processId: string): Promise<{ publicToken: string; publicUrl: string; expiresAt: string }> {
    return apiClient.post(`/api/quotes/${processId}/publish`)
  },

  cancel(id: string): Promise<QuoteProcess> {
    return apiClient.delete(`/api/quotes/${id}`)
  },

  pdfDownloadUrl(processId: string, quoteId: string): string {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    return `${base}/api/quotes/${processId}/quotes/${quoteId}/pdf`
  },
}
