import { useQuery } from '@tanstack/react-query'
import type { ListProcessesQuery } from '@corretor/types'
import { quoteProcessApi } from '@/lib/api/quote-process.api'

export function useListProcesses(query: ListProcessesQuery = {}) {
  return useQuery({
    queryKey: ['quote-processes', query],
    queryFn: () => quoteProcessApi.list(query),
  })
}
