import { useQuery } from '@tanstack/react-query'
import { quoteProcessApi } from '@/lib/api/quote-process.api'

export function useQuoteProcess(id: string, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ['quote-process', id],
    queryFn: () => quoteProcessApi.getById(id),
    enabled: !!id,
    refetchInterval: options?.refetchInterval,
  })
}
