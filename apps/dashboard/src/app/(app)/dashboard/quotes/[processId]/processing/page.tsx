'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Quote, QuoteStatus } from '@corretor/types'
import { useQuoteProcess } from '@/hooks/quotes/use-quote-process'

// ─── Constants ────────────────────────────────────────────────────────────────

const INSURER_LABELS: Record<string, string> = {
  BRADESCO:     'Bradesco Seguros',
  PORTO_SEGURO: 'Porto Seguro',
  TOKIO_MARINE: 'Tokio Marine',
  SULAMERICA:   'SulAmérica',
  SUHAI:        'Suhai',
  ALIRO:        'Aliro',
  ALLIANZ:      'Allianz',
  YELLOW:       'Yellow',
}

const TERMINAL_STATUSES: QuoteStatus[] = ['PENDING_REVIEW', 'READY', 'FAILED']

function isTerminal(status: QuoteStatus) {
  return TERMINAL_STATUSES.includes(status)
}

// ─── Step indicator ───────────────────────────────────────────────────────────

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

// ─── Quote status row ─────────────────────────────────────────────────────────

function QuoteStatusRow({ quote }: { quote: Quote }) {
  const done = isTerminal(quote.status)
  const failed = quote.status === 'FAILED'
  const pending = quote.status === 'PENDING'

  return (
    <div className="flex items-center gap-4 py-3.5">
      {/* Icon */}
      <div className="shrink-0 w-8 h-8 flex items-center justify-center">
        {failed ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
            <IconX className="text-red-500" />
          </span>
        ) : done ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50">
            <IconCheck className="text-green-600" />
          </span>
        ) : pending ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
            <IconClock className="text-ink-faint" />
          </span>
        ) : (
          <Spinner />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">
          {INSURER_LABELS[quote.insurer] ?? quote.insurer}
        </p>
        <p className="text-xs text-ink-muted mt-0.5">
          {STATUS_LABELS[quote.status]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-24 hidden sm:block">
        <div className="h-1.5 rounded-full bg-surface-strong overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              failed
                ? 'w-full bg-red-400'
                : done
                ? 'w-full bg-green-500'
                : pending
                ? 'w-0'
                : 'w-2/3 bg-ember animate-pulse'
            }`}
          />
        </div>
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  PENDING:        'Aguardando upload',
  PROCESSING:     'Extraindo dados com IA…',
  PENDING_REVIEW: 'Pronto para revisão',
  READY:          'Confirmado',
  FAILED:         'Falha na extração',
}

// ─── Overall progress bar ─────────────────────────────────────────────────────

function OverallProgress({ quotes }: { quotes: Quote[] }) {
  if (quotes.length === 0) return null

  const done = quotes.filter((q) => isTerminal(q.status)).length
  const pct = Math.round((done / quotes.length) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{done} de {quotes.length} concluídas</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-strong overflow-hidden">
        <div
          className="h-full rounded-full bg-ember transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconX({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconClock({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-ember animate-spin">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.15" />
      <path d="M16 3a13 13 0 0 1 13 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProcessingPage({ params }: { params: Promise<{ processId: string }> }) {
  const { processId } = use(params)
  const router = useRouter()

  const { data: process, isLoading } = useQuoteProcess(processId, { refetchInterval: 3000 })

  const quotes = process?.quotes ?? []
  const allDone = quotes.length > 0 && quotes.every((q) => isTerminal(q.status))
  const hasFailures = quotes.some((q) => q.status === 'FAILED')
  const inProgress = quotes.some((q) => q.status === 'PROCESSING')

  useEffect(() => {
    if (allDone && !hasFailures) {
      const timer = setTimeout(() => {
        router.push(`/dashboard/quotes/${processId}/review`)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [allDone, hasFailures, processId, router])

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-display text-ink">Nova cotação</h2>
          <p className="text-sm text-ink-muted mt-0.5">Passo 3 de 3 — Processamento</p>
        </div>
        <StepIndicator current={3} total={3} />
      </div>

      {/* Status card */}
      <div className="rounded-xl bg-white border border-surface-strong p-5 space-y-4">
        {/* Summary message */}
        <div className="pb-1">
          {isLoading ? (
            <div className="h-4 w-48 rounded bg-surface animate-pulse" />
          ) : allDone ? (
            <p className="text-sm font-semibold text-ink">
              {hasFailures ? 'Processamento concluído com falhas' : 'Tudo pronto! Redirecionando…'}
            </p>
          ) : inProgress ? (
            <p className="text-sm font-semibold text-ink">
              Processando com IA — isso pode levar alguns segundos
            </p>
          ) : (
            <p className="text-sm font-semibold text-ink">
              Aguardando início do processamento…
            </p>
          )}
        </div>

        {/* Overall progress */}
        {!isLoading && <OverallProgress quotes={quotes} />}

        {/* Divider */}
        <div className="border-t border-surface-strong" />

        {/* Per-quote rows */}
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3.5">
                <div className="h-8 w-8 rounded-full bg-surface animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-surface animate-pulse" />
                  <div className="h-2.5 w-24 rounded bg-surface animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-surface">
            {quotes.map((quote) => (
              <QuoteStatusRow key={quote.id} quote={quote} />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => router.push(`/dashboard/quotes/${processId}/upload`)}
          className="text-sm text-ink-muted hover:text-ink transition"
        >
          Voltar
        </button>

        {allDone && (
          <button
            onClick={() => router.push(`/dashboard/quotes/${processId}/review`)}
            className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-light transition-colors"
          >
            {hasFailures ? 'Revisar resultados' : 'Ver revisão'}
          </button>
        )}
      </div>
    </div>
  )
}
