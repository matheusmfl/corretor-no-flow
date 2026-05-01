'use client'

import { useEffect } from 'react'
import { useQuoteTracking } from '@/hooks/use-quote-tracking'
import type { QuoteEventType } from '@corretor/types'

interface Props {
  processId: string
  event?: { type: QuoteEventType; payload?: Record<string, unknown> }
}

export function QuoteTracker({ processId, event }: Props) {
  const { track } = useQuoteTracking(processId)

  useEffect(() => {
    if (event) {
      track(event.type, event.payload)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
