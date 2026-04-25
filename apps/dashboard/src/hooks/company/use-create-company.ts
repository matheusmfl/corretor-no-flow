'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { CreateCompanyDto } from '@corretor/types'
import { createCompanyFn } from '@/lib/api/company.api'

export function useCreateCompany() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (body: CreateCompanyDto) => createCompanyFn(body),
    onSuccess(company) {
      // Atualiza companyId no cache do usuário sem refetch extra
      queryClient.setQueryData(['auth', 'me'], (prev: { companyId: string | null } | undefined) =>
        prev ? { ...prev, companyId: company.id } : prev,
      )
      queryClient.setQueryData(['companies', 'me'], company)
      router.push('/dashboard')
    },
  })
}
