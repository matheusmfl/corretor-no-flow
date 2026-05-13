'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuoteProcess } from '@/hooks/quotes/use-quote-process'
import { useGeneratePdf } from '@/hooks/quotes/use-generate-pdf'
import { usePublishProcess } from '@/hooks/quotes/use-publish-process'
import { getPublicLinkBaseUrlFromEnv } from '@/lib/api/base-url'
import { quoteProcessApi } from '@/lib/api/quote-process.api'

// ─── Constants ────────────────────────────────────────────────────────────────

const INSURER_LABELS: Record<string, string> = {
  BRADESCO:        'Bradesco Seguros',
  PORTO_SEGURO:    'Porto Seguro',
  AZUL:            'Azul Seguro Auto',
  MITSUI_SUMITOMO: 'Mitsui Sumitomo Seguros',
  ITAU:            'Itaú Seguro Auto',
  TOKIO_MARINE:    'Tokio Marine',
  SULAMERICA:      'SulAmérica',
  SUHAI:           'Suhai',
  ALIRO:           'Aliro',
  ALLIANZ:         'Allianz',
  YELLOW:          'Yellow',
}

function quoteLabel(quote: { name?: string | null; insurer: string }) {
  return quote.name?.replace(/\s*—\s*\(R\$[^)]*\)\s*$/, '').trim() ?? INSURER_LABELS[quote.insurer] ?? quote.insurer
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded-lg border border-surface-strong px-3 py-2 text-xs font-medium text-ink-muted hover:border-mahogany/40 hover:text-ink transition-colors"
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  step,
  title,
  description,
  children,
  done,
}: {
  step: number
  title: string
  description: string
  children: React.ReactNode
  done?: boolean
}) {
  return (
    <div className="rounded-xl border border-surface-strong bg-white p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done ? 'bg-green-100 text-green-700' : 'bg-mahogany text-gold'
        }`}>
          {done ? '✓' : step}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="text-xs text-ink-muted mt-0.5">{description}</p>
        </div>
      </div>
      <div className="pl-9">{children}</div>
    </div>
  )
}

// ─── QuoteSelector ────────────────────────────────────────────────────────────

function QuoteSelector({
  quotes,
  selectedIds,
  onChange,
  locked = false,
}: {
  quotes: { id: string; insurer: string; name?: string | null }[]
  selectedIds: Set<string>
  onChange: (ids: Set<string>) => void
  locked?: boolean
}) {
  const [open, setOpen] = useState(false)

  const selectedCount = selectedIds.size
  const total = quotes.length
  const allSelected = selectedCount === total

  function toggle(id: string) {
    if (locked) return
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  function selectAll() {
    if (locked) return
    onChange(new Set(quotes.map((q) => q.id)))
  }

  function clearAll() {
    if (locked) return
    onChange(new Set())
  }

  return (
    <div className={`rounded-xl border bg-white p-4 space-y-3 ${locked ? 'border-green-200 bg-green-50/40' : 'border-surface-strong'}`}>
      {/* Compact summary row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <IconList />
          <span>
            <span className={selectedCount === 0 ? 'text-red-600 font-semibold' : 'text-ink font-semibold'}>
              {selectedCount}
            </span>
            {' '}de {total} cotaç{total !== 1 ? 'ões' : 'ão'} selecionada{selectedCount !== 1 ? 's' : ''}
          </span>
          {locked && <span className="text-xs text-green-700 font-medium">· confirmado</span>}
        </div>
        {!locked && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-mahogany hover:underline"
          >
            Escolher cotações
            <IconChevron className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Expandable checklist */}
      {open && (
        <div className="border-t border-surface-strong pt-3 space-y-2">
          {/* Quick actions */}
          <div className="flex gap-3 pb-1">
            <button
              onClick={selectAll}
              disabled={allSelected}
              className="text-xs text-mahogany hover:underline disabled:text-ink-faint disabled:no-underline"
            >
              Selecionar todas
            </button>
            <span className="text-ink-faint text-xs">·</span>
            <button
              onClick={clearAll}
              disabled={selectedCount === 0}
              className="text-xs text-mahogany hover:underline disabled:text-ink-faint disabled:no-underline"
            >
              Limpar seleção
            </button>
          </div>

          {/* Quote list */}
          <div className="space-y-1">
            {quotes.map((q) => {
              const checked = selectedIds.has(q.id)
              return (
                <label
                  key={q.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                    checked
                      ? 'bg-surface/60 text-ink'
                      : 'bg-white text-ink-faint'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(q.id)}
                    className="accent-mahogany h-4 w-4 shrink-0"
                  />
                  <span className="flex-1 text-sm font-medium">{quoteLabel(q)}</span>
                  {!checked && (
                    <span className="text-xs text-ink-faint italic">Não será enviada ao cliente</span>
                  )}
                </label>
              )
            })}
          </div>

          {/* Reserved space for future link options */}
          <div className="border-t border-surface-strong pt-3 mt-1">
            <p className="text-xs text-ink-faint italic">
              Opções adicionais do link (comparativo, destaque de preço…) serão disponibilizadas em breve.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GeneratePage({ params }: { params: Promise<{ processId: string }> }) {
  const { processId } = use(params)
  const router = useRouter()

  const { data: process } = useQuoteProcess(processId)
  const generatePdf = useGeneratePdf(processId)
  const publishProcess = usePublishProcess(processId)

  const quotes = process?.quotes ?? []
  const readyQuotes = quotes.filter((q) => q.status === 'READY')

  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null)
  const effectiveSelected = selectedIds ?? new Set(readyQuotes.map((q) => q.id))
  const selectedArray = Array.from(effectiveSelected)
  const noneSelected = effectiveSelected.size === 0

  const pdfResults = generatePdf.data ?? []
  const pdfsGenerated = pdfResults.length > 0

  const publishResult = publishProcess.data
  const isPublished = !!publishResult || process?.status === 'PUBLISHED'

  const envPublicBase = getPublicLinkBaseUrlFromEnv()
  const [browserOriginFallback, setBrowserOriginFallback] = useState('')
  useEffect(() => {
    if (!envPublicBase) {
      setBrowserOriginFallback(window.location.origin)
    }
  }, [envPublicBase])

  const publicLinkBase = envPublicBase || browserOriginFallback
  const publicUrl =
    publishResult?.publicUrl ??
    (process?.publicToken && publicLinkBase ? `${publicLinkBase}/c/${process.publicToken}` : null)
  const expiresAt = publishResult?.expiresAt
    ? new Date(publishResult.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null
  const openedAt = process?.openedAt
    ? new Date(process.openedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold font-display text-ink">Finalizar cotação</h2>
        <p className="text-sm text-ink-muted mt-0.5">
          {readyQuotes.length} cotaç{readyQuotes.length !== 1 ? 'ões confirmadas' : 'ão confirmada'} prontas para gerar
        </p>
      </div>

      {/* Quote selection — compact, collapsed by default; locked once PDFs are generated */}
      {!isPublished && readyQuotes.length > 0 && (
        <QuoteSelector
          quotes={readyQuotes}
          selectedIds={effectiveSelected}
          onChange={setSelectedIds}
          locked={pdfsGenerated}
        />
      )}

      {/* Zero-selection warning */}
      {noneSelected && !isPublished && (
        <p className="text-sm text-red-600 font-medium px-1">
          Selecione pelo menos uma cotação para gerar o material.
        </p>
      )}

      {/* Step 1 — Generate PDFs */}
      <Section
        step={1}
        title="Gerar PDFs"
        description="Cria um PDF profissional para cada cotação selecionada"
        done={pdfsGenerated}
      >
        {!pdfsGenerated ? (
          <button
            onClick={() => generatePdf.mutate(selectedArray)}
            disabled={generatePdf.isPending || readyQuotes.length === 0 || noneSelected}
            className="rounded-lg bg-mahogany px-4 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generatePdf.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner size={14} /> Gerando…
              </span>
            ) : (
              `Gerar ${effectiveSelected.size} PDF${effectiveSelected.size !== 1 ? 's' : ''}`
            )}
          </button>
        ) : (
          <div className="space-y-2">
            {pdfResults.map((r) => {
              const quote = quotes.find((q) => q.id === r.quoteId)
              const label = quote ? quoteLabel(quote) : r.quoteId
              const downloadUrl = quoteProcessApi.pdfDownloadUrl(processId, r.quoteId)

              return (
                <a
                  key={r.quoteId}
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-surface-strong px-4 py-3 hover:border-mahogany/30 hover:bg-surface/40 transition-colors group"
                >
                  <IconPdf />
                  <span className="flex-1 text-sm font-medium text-ink">{label}</span>
                  <span className="text-xs text-mahogany group-hover:underline">Download</span>
                </a>
              )
            })}
          </div>
        )}
      </Section>

      {/* Step 2 — Publish link */}
      <Section
        step={2}
        title="Criar link para o segurado"
        description="Gera um link público que o cliente pode acessar pelo celular"
        done={isPublished}
      >
        {!isPublished ? (
          <button
            onClick={() => publishProcess.mutate(selectedArray)}
            disabled={publishProcess.isPending || noneSelected}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors bg-ember text-white hover:bg-ember-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishProcess.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner size={14} /> Publicando…
              </span>
            ) : (
              'Criar link público'
            )}
          </button>
        ) : (
          <div className="space-y-3">
            {publicUrl && (
              <div className="flex items-center gap-2 rounded-lg border border-surface-strong bg-surface/40 px-3 py-2">
                <span className="flex-1 truncate text-sm font-mono text-ink">{publicUrl}</span>
                <CopyButton text={publicUrl} />
              </div>
            )}

            {expiresAt && (
              <p className="text-xs text-ink-faint">Expira em {expiresAt}</p>
            )}

            <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
              openedAt
                ? 'bg-green-50 text-green-700'
                : 'bg-surface text-ink-muted'
            }`}>
              {openedAt ? (
                <>
                  <IconEyeCheck />
                  Segurado visualizou em {openedAt}
                </>
              ) : (
                <>
                  <IconClock />
                  Aguardando visualização pelo segurado…
                </>
              )}
            </div>

            <a
              href={publicUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-mahogany hover:underline"
            >
              <IconExternalLink /> Abrir como segurado
            </a>
          </div>
        )}
      </Section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => router.push(`/dashboard/quotes/${processId}/review`)}
          className="text-sm text-ink-muted hover:text-ink transition"
        >
          Voltar
        </button>

        {isPublished && (
          <button
            onClick={() => router.push('/dashboard/quotes')}
            className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-light transition-colors"
          >
            Ver todas as cotações
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconList() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function IconChevron({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconPdf() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function IconExternalLink() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function IconEyeCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      <polyline points="9 11 11 13 15 9" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
