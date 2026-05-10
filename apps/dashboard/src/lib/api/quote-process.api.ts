import type {
  CreateQuoteProcessDto,
  DetectInsurerResponse,
  Insurer,
  ListProcessesQuery,
  QuoteProcess,
  QuoteProcessDetail,
  QuoteProcessListResponse,
  ReviewQuoteDto,
} from '@corretor/types'
import { apiClient } from './client'
import { getBrowserApiBaseUrl } from './base-url'

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

  generatePdf(processId: string, quoteIds?: string[]): Promise<{ quoteId: string; filePath: string }[]> {
    return apiClient.post(`/api/quotes/${processId}/generate`, quoteIds ? { quoteIds } : undefined)
  },

  publishProcess(processId: string, quoteIds?: string[]): Promise<{ publicToken: string; publicUrl: string; expiresAt: string }> {
    return apiClient.post(`/api/quotes/${processId}/publish`, quoteIds ? { quoteIds } : undefined)
  },

  detectInsurer(file: File): Promise<DetectInsurerResponse> {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post('/api/quotes/detect-insurer', form)
  },

  resetBatch(processId: string): Promise<{ deleted: number }> {
    return apiClient.post(`/api/quotes/${processId}/reset-batch`)
  },

  uploadAuto(
    processId: string,
    insurer: Insurer,
    file: File,
  ): Promise<{ quoteId: string; processId: string; status: 'queued' }> {
    const form = new FormData()
    form.append('file', file)
    form.append('insurer', insurer)
    return apiClient.post(`/api/quotes/${processId}/upload-auto`, form)
  },

  cancel(id: string): Promise<QuoteProcess> {
    return apiClient.delete(`/api/quotes/${id}`)
  },

  removeQuote(processId: string, quoteId: string): Promise<{ deleted: true }> {
    return apiClient.delete(`/api/quotes/${processId}/quotes/${quoteId}`)
  },

  pdfDownloadUrl(processId: string, quoteId: string): string {
    const base = getBrowserApiBaseUrl()
    return `${base}/api/quotes/${processId}/quotes/${quoteId}/pdf`
  },
}
