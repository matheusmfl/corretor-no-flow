'use client'

import { useQuery } from '@tanstack/react-query'
import type { Company } from '@corretor/types'
import { getMyCompanyFn } from '@/lib/api/company.api'

export function useMyCompany() {
  return useQuery<Company>({
    queryKey: ['companies', 'me'],
    queryFn: getMyCompanyFn,
  })
}
