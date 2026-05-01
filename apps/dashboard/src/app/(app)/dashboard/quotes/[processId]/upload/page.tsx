'use client'

import { use, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Insurer, Quote, QuoteProcessDetail, QuoteStatus } from '@corretor/types'
import { useQuoteProcess } from '@/hooks/quotes/use-quote-process'
import { useUploadQuote } from '@/hooks/quotes/use-upload-quote'

// ─── Constants ────────────────────────────────────────────────────────────────

const INSURER_LABELS: Record<Insurer, string> = {
  BRADESCO:     'Bradesco Seguros',
  PORTO_SEGURO: 'Porto Seguro',
  TOKIO_MARINE: 'Tokio Marine',
  SULAMERICA:   'SulAmérica',
  SUHAI:        'Suhai',
  ALIRO:        'Aliro',
  ALLIANZ:      'Allianz',
  YELLOW:       'Yellow',
}

// ─── Step indicator (shared) ──────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i + 1 === current
              ? 'w-6 bg-ember'
              : i + 1 < current
              ? 'w-4 bg-ember/40'
              : 'w-4 bg-surface-strong'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: QuoteStatus }) {
  const map: Record<QuoteStatus, { label: string; className: string }> = {
    PENDING:        { label: 'Aguardando',   className: 'bg-surface text-ink-muted'          },
    PROCESSING:     { label: 'Processando',  className: 'bg-amber-50 text-amber-700'          },
    PENDING_REVIEW: { label: 'Pronto',       className: 'bg-green-50 text-green-700'          },
    READY:          { label: 'Confirmado',   className: 'bg-green-100 text-green-800'         },
    FAILED:         { label: 'Falhou',       className: 'bg-red-50 text-red-700'              },
  }
  const { label, className } = map[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

// ─── Upload card ──────────────────────────────────────────────────────────────

function QuoteUploadCard({ quote, processId }: { quote: Quote; processId: string }) {
  const [isDragging, setIsDragging] = useState(false)
  const [localStatus, setLocalStatus] = useState<'idle' | 'uploading'>('idle')
  const upload = useUploadQuote(processId)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.pdf')) return
      setLocalStatus('uploading')
      upload.mutate(
        { quoteId: quote.id, file },
        { onSettled: () => setLocalStatus('idle') },
      )
    },
    [upload, quote.id],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const canUpload = quote.status === 'PENDING' || quote.status === 'FAILED'
  const isUploading = localStatus === 'uploading'

  const dropZoneClass = `
    relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed
    px-4 py-8 text-center transition-colors
    ${isDragging ? 'border-mahogany bg-mahogany/5' : 'border-surface-strong bg-surface/40'}
    ${canUpload && !isUploading ? 'cursor-pointer hover:border-mahogany/50 hover:bg-surface/60' : ''}
  `

  return (
    <div className="rounded-xl bg-white border border-surface-strong p-4 space-y-3">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{INSURER_LABELS[quote.insurer]}</p>
        <StatusBadge status={quote.status} />
      </div>

      {/* Drop zone */}
      {canUpload ? (
        <label
          className={dropZoneClass}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            accept=".pdf"
            className="sr-only"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />

          {isUploading ? (
            <>
              <Spinner />
              <p className="mt-2 text-xs text-ink-muted">Enviando…</p>
            </>
          ) : (
            <>
              <IconUpload />
              <p className="mt-2 text-xs font-medium text-ink">
                {isDragging ? 'Solte o arquivo aqui' : 'Arraste o PDF ou toque para selecionar'}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-faint">Apenas arquivos .pdf</p>
            </>
          )}
        </label>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg bg-surface/40 px-4 py-8 text-center">
          {quote.status === 'PROCESSING' && (
            <>
              <Spinner />
              <p className="mt-2 text-xs text-ink-muted">Processando com IA…</p>
            </>
          )}
          {(quote.status === 'PENDING_REVIEW' || quote.status === 'READY') && (
            <>
              <IconCheck />
              <p className="mt-2 text-xs text-ink-muted">Extração concluída</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUpload() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-ink-faint">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-green-600">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      className="text-ember animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UploadPage({ params }: { params: Promise<{ processId: string }> }) {
  const { processId } = use(params)
  const router = useRouter()
  const { data: process, isLoading } = useQuoteProcess(processId, {
    refetchInterval: (query) => {
      const data = query.state.data as QuoteProcessDetail | undefined
      const quotes = data?.quotes ?? []
      return quotes.some((q) => q.status === 'PROCESSING') ? 2000 : false
    },
  })

  const quotes = process?.quotes ?? []
  const allDone = quotes.length > 0 && quotes.every(
    (q) => q.status === 'PENDING_REVIEW' || q.status === 'READY' || q.status === 'FAILED',
  )
  const uploadedCount = quotes.filter((q) => q.status !== 'PENDING').length

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-display text-ink">Nova cotação</h2>
          <p className="text-sm text-ink-muted mt-0.5">Passo 2 de 3 — Upload dos PDFs</p>
        </div>
        <StepIndicator current={2} total={3} />
      </div>

      {/* Progress summary */}
      {quotes.length > 0 && (
        <p className="text-sm text-ink-muted">
          {uploadedCount} de {quotes.length} seguradora{quotes.length > 1 ? 's' : ''} enviada{uploadedCount !== 1 ? 's' : ''}
        </p>
      )}

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quotes.map((quote) => (
            <QuoteUploadCard key={quote.id} quote={quote} processId={processId} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => router.push('/dashboard/quotes/new')}
          className="text-sm text-ink-muted hover:text-ink transition"
        >
          Voltar
        </button>

        <button
          onClick={() => router.push(`/dashboard/quotes/${processId}/processing`)}
          disabled={uploadedCount === 0}
          className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {allDone ? 'Ver resultados' : 'Acompanhar processamento'}
        </button>
      </div>
    </div>
  )
}
