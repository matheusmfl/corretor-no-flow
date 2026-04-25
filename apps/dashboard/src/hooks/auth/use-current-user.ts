'use client'

import { useQuery } from '@tanstack/react-query'
import { getMeFn } from '@/lib/api/auth.api'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMeFn,
    retry: false,
  })
}
