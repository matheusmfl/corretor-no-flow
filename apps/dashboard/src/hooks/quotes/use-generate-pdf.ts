import { useMutation, useQueryClient } from '@tanstack/react-query'
import { quoteProcessApi } from '@/lib/api/quote-process.api'
import { handleError } from '@/lib/handle-error'

export function useGeneratePdf(processId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => quoteProcessApi.generatePdf(processId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-process', processId] })
    },
    onError: (error) => handleError(error),
  })
}
