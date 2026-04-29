import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReviewQuoteDto } from '@corretor/types'
import { quoteProcessApi } from '@/lib/api/quote-process.api'
import { handleError } from '@/lib/handle-error'

export function useReviewQuote(processId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, dto }: { quoteId: string; dto: ReviewQuoteDto }) =>
      quoteProcessApi.reviewQuote(processId, quoteId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-process', processId] })
    },
    onError: (error) => handleError(error),
  })
}
