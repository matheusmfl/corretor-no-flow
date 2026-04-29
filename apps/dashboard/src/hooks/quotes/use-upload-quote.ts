import { useMutation, useQueryClient } from '@tanstack/react-query'
import { quoteProcessApi } from '@/lib/api/quote-process.api'
import { handleError } from '@/lib/handle-error'

export function useUploadQuote(processId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, file }: { quoteId: string; file: File }) =>
      quoteProcessApi.uploadQuote(processId, quoteId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-process', processId] })
    },
    onError: (error) => handleError(error),
  })
}
