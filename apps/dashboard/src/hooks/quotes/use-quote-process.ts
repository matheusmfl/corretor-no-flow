import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import type { QuoteProcessDetail } from '@corretor/types'
import { quoteProcessApi } from '@/lib/api/quote-process.api'

type RefetchInterval = NonNullable<UseQueryOptions<QuoteProcessDetail>['refetchInterval']>

export function useQuoteProcess(id: string, options?: { refetchInterval?: RefetchInterval }) {
  return useQuery({
    queryKey: ['quote-process', id],
    queryFn: () => quoteProcessApi.getById(id),
    enabled: !!id,
    refetchInterval: options?.refetchInterval,
  })
}
