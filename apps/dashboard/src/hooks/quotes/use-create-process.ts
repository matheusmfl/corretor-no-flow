import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateQuoteProcessDto } from '@corretor/types'
import { quoteProcessApi } from '@/lib/api/quote-process.api'
import { handleError } from '@/lib/handle-error'

export function useCreateProcess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateQuoteProcessDto) => quoteProcessApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-processes'] })
    },
    onError: (error) => handleError(error),
  })
}
