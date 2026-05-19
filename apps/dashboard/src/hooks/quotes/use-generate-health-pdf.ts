import { useState } from 'react'
import type { HealthQuoteDraft } from '@corretor/types'
import { quoteProcessApi } from '@/lib/api/quote-process.api'

export type GenerateHealthPdfStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

export function useGenerateHealthPdf() {
  const [status, setStatus] = useState<GenerateHealthPdfStatus>({ kind: 'idle' })

  async function generate(draft: HealthQuoteDraft) {
    setStatus({ kind: 'loading' })
    try {
      const blob = await quoteProcessApi.generateHealthPdf(draft)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      const slug = (draft.clientName ?? 'rascunho')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40)
      anchor.download = `cotacao-saude-${slug}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setStatus({ kind: 'success' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar PDF'
      setStatus({ kind: 'error', message })
    }
  }

  function reset() {
    setStatus({ kind: 'idle' })
  }

  return { status, generate, reset }
}
