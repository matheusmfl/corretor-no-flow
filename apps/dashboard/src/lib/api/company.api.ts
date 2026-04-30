import type { Company, CreateCompanyDto, UpdateCompanyDto } from '@corretor/types'
import { apiClient } from './client'

export function createCompanyFn(body: CreateCompanyDto) {
  return apiClient.post<Company>('/api/companies', body)
}

export function updateCompanyFn(id: string, body: UpdateCompanyDto) {
  return apiClient.patch<Company>(`/api/companies/${id}`, body)
}

export function getMyCompanyFn() {
  return apiClient.get<Company>('/api/companies/me')
}

export function uploadLogoFn(companyId: string, file: File): Promise<{ logoUrl: string }> {
  const form = new FormData()
  form.append('logo', file)
  return apiClient.post(`/api/companies/${companyId}/logo`, form)
}
