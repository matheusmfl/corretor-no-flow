'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { logoutFn } from '@/lib/api/auth.api'

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: logoutFn,
    onSettled() {
      queryClient.clear()
      router.push('/login')
    },
  })
}
