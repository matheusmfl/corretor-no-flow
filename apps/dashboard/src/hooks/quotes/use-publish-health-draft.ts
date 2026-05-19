import { useState } from 'react'
import type { HealthQuoteDraft } from '@corretor/types'
import { quoteProcessApi } from '@/lib/api/quote-process.api'

export type PublishHealthDraftStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; publicUrl: string; expiresAt: string }
  | { kind: 'error'; message: string }

export function usePublishHealthDraft() {
  const [status, setStatus] = useState<PublishHealthDraftStatus>({ kind: 'idle' })

  async function publish(draft: HealthQuoteDraft) {
    setStatus({ kind: 'loading' })
    try {
      const result = await quoteProcessApi.publishHealthDraft(draft)
      setStatus({ kind: 'success', publicUrl: result.publicUrl, expiresAt: result.expiresAt })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar link'
      setStatus({ kind: 'error', message })
    }
  }

  function reset() {
    setStatus({ kind: 'idle' })
  }

  return { status, publish, reset }
}
