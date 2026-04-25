'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { RegisterDto } from '@corretor/types'
import { registerFn } from '@/lib/api/auth.api'

export function useRegister() {
  const router = useRouter()

  return useMutation({
    mutationFn: (body: RegisterDto) => registerFn(body),
    onSuccess() {
      router.push('/login?registered=1')
    },
  })
}
