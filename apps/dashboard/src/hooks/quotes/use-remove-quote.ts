import { useMutation, useQueryClient } from '@tanstack/react-query'
import { quoteProcessApi } from '@/lib/api/quote-process.api'
import { handleError } from '@/lib/handle-error'

export function useRemoveQuote(processId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId }: { quoteId: string }) =>
      quoteProcessApi.removeQuote(processId, quoteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quote-process', processId] })
      await queryClient.refetchQueries({ queryKey: ['quote-process', processId] })
    },
    onError: (error) => handleError(error),
  })
}

