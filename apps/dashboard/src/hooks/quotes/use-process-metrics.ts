'use client'

import { useQuery } from '@tanstack/react-query'
import { getProcessMetrics } from '@/lib/api/tracking.api'

export function useProcessMetrics(processId: string | null) {
  return useQuery({
    queryKey: ['process-metrics', processId],
    queryFn: () => getProcessMetrics(processId!),
    enabled: !!processId,
    staleTime: 30_000,
  })
}
