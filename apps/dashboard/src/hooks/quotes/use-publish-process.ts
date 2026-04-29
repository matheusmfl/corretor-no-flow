import { useMutation, useQueryClient } from '@tanstack/react-query'
import { quoteProcessApi } from '@/lib/api/quote-process.api'
import { handleError } from '@/lib/handle-error'

export function usePublishProcess(processId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => quoteProcessApi.publishProcess(processId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-process', processId] })
      queryClient.invalidateQueries({ queryKey: ['quote-processes'] })
    },
    onError: (error) => handleError(error),
  })
}
