export enum QuoteProcessStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  PENDING_REVIEW = 'PENDING_REVIEW',
  READY = 'READY',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum QuoteStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PENDING_REVIEW = 'PENDING_REVIEW',
  READY = 'READY',
  FAILED = 'FAILED',
}

/**
 * Derives the aggregate QuoteProcess status from its quotes.
 * Returns null when the process status must not change (locked or already correct).
 */
export function deriveProcessStatus(
  quoteStatuses: QuoteStatus[],
  currentProcessStatus: QuoteProcessStatus,
): QuoteProcessStatus | null {
  if (
    currentProcessStatus === QuoteProcessStatus.PUBLISHED ||
    currentProcessStatus === QuoteProcessStatus.ARCHIVED
  ) {
    return null;
  }

  const hasActive = quoteStatuses.some(
    (s) => s === QuoteStatus.PROCESSING || s === QuoteStatus.PENDING,
  );
  if (hasActive) return QuoteProcessStatus.PROCESSING;

  const hasPendingReview = quoteStatuses.some((s) => s === QuoteStatus.PENDING_REVIEW);
  if (hasPendingReview) return QuoteProcessStatus.PENDING_REVIEW;

  const hasReady = quoteStatuses.some((s) => s === QuoteStatus.READY);
  if (hasReady) return QuoteProcessStatus.READY;

  if (quoteStatuses.length > 0 && quoteStatuses.every((s) => s === QuoteStatus.FAILED)) {
    return QuoteProcessStatus.PENDING_REVIEW;
  }

  return null;
}
