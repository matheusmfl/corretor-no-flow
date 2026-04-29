'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuoteProcess } from '@/hooks/quotes/use-quote-process'
import { useGeneratePdf } from '@/hooks/quotes/use-generate-pdf'
import { usePublishProcess } from '@/hooks/quotes/use-publish-process'
import { quoteProcessApi } from '@/lib/api/quote-process.api'

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

// ─── Copy button ──────────────────────────────────────────────────────────────

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

// ─── Section wrapper ──────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GeneratePage({ params }: { params: Promise<{ processId: string }> }) {
  const { processId } = use(params)
  const router = useRouter()

  const { data: process } = useQuoteProcess(processId)
  const generatePdf = useGeneratePdf(processId)
  const publishProcess = usePublishProcess(processId)

  const quotes = process?.quotes ?? []
  const readyQuotes = quotes.filter((q) => q.status === 'READY')

  const pdfResults = generatePdf.data ?? []
  const pdfsGenerated = pdfResults.length > 0

  const publishResult = publishProcess.data
  const isPublished = !!publishResult || process?.status === 'PUBLISHED'
  const publicUrl = publishResult?.publicUrl ?? (
    process?.publicToken
      ? `${window.location.origin}/c/${process.publicToken}`
      : null
  )
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

      {/* Step 1 — Generate PDFs */}
      <Section
        step={1}
        title="Gerar PDFs"
        description="Cria um PDF profissional para cada cotação confirmada"
        done={pdfsGenerated}
      >
        {!pdfsGenerated ? (
          <button
            onClick={() => generatePdf.mutate()}
            disabled={generatePdf.isPending || readyQuotes.length === 0}
            className="rounded-lg bg-mahogany px-4 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generatePdf.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner size={14} /> Gerando…
              </span>
            ) : (
              `Gerar ${readyQuotes.length} PDF${readyQuotes.length !== 1 ? 's' : ''}`
            )}
          </button>
        ) : (
          <div className="space-y-2">
            {pdfResults.map((r) => {
              const quote = quotes.find((q) => q.id === r.quoteId)
              const label = quote ? (INSURER_LABELS[quote.insurer] ?? quote.insurer) : r.quoteId
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
            onClick={() => publishProcess.mutate()}
            disabled={publishProcess.isPending}
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

            {/* Status de visualização */}
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
