/**
 * Pure guards for quote-process wizard navigation (processing → review auto-redirect).
 * Keeps redirects from firing on stale React Query cache while a refetch is in flight.
 */
export function shouldProcessingAutoRedirect(params: {
  isLoading: boolean
  isFetching: boolean
  allDone: boolean
  hasFailures: boolean
}): boolean {
  if (params.isLoading) return false
  if (params.isFetching) return false
  return params.allDone && !params.hasFailures
}
