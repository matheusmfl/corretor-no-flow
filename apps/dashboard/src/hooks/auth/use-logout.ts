'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logoutFn } from '@/lib/api/auth.api'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutFn,
    onSettled() {
      queryClient.clear()
      // Full reload garante que o proxy reavalia os cookies limpos pelo servidor
      window.location.href = '/login'
    },
  })
}
