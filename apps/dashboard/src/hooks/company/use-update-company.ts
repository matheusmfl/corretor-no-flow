'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Company, UpdateCompanyDto } from '@corretor/types'
import { updateCompanyFn } from '@/lib/api/company.api'
import { handleError } from '@/lib/handle-error'

export function useUpdateCompany(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: UpdateCompanyDto) => updateCompanyFn(companyId, dto),
    onSuccess(company: Company) {
      queryClient.setQueryData(['companies', 'me'], company)
    },
    onError: (err) => handleError(err),
  })
}
