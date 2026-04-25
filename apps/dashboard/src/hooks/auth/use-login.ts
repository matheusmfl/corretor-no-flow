'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import type { LoginDto } from '@corretor/types'
import { loginFn } from '@/lib/api/auth.api'

export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  return useMutation({
    mutationFn: (body: LoginDto) => loginFn(body),
    onSuccess(data) {
      queryClient.setQueryData(['auth', 'me'], data.user)
      const next = searchParams.get('next')
      const dest = next ?? (data.user.companyId ? '/dashboard' : '/onboarding')
      router.push(dest)
    },
  })
}
