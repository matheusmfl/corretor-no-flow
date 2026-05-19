'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HealthQuoteDraft } from '@corretor/types'
import { quoteProcessApi } from '@/lib/api/quote-process.api'
import {
  buildCombinedHealthDraft,
  describeFileSelection,
  friendlyHealthUploadError,
} from './health-upload.helpers'

export const HEALTH_DRAFT_SESSION_KEY = 'health-draft-pending'

type Phase = 'idle' | 'processing' | 'partial' | 'error'
type FileStatus = 'pending' | 'processing' | 'done' | 'error'

interface UploadItem {
  id: string
  file: File
  status: FileStatus
  message?: string
}

function makeUploadItem(file: File): UploadItem {
  return {
    id: `${file.name.toLowerCase()}-${file.size}-${file.lastModified}`,
    file,
    status: 'pending',
  }
}

function storeDraftAndNavigate(router: ReturnType<typeof useRouter>, draft: HealthQuoteDraft) {
  sessionStorage.setItem(HEALTH_DRAFT_SESSION_KEY, JSON.stringify(draft))
  router.push('/dashboard/quotes/health/review')
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUpload() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-mahogany/60">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      className="animate-spin text-current">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconPdf() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function StatusIcon({ status }: { status: FileStatus }) {
  if (status === 'processing') return <IconSpinner />
  if (status === 'done') return <IconCheck />
  if (status === 'error') return <IconAlert />
  return <span className="h-2 w-2 rounded-full bg-ink-faint" />
}

function statusLabel(status: FileStatus): string {
  if (status === 'processing') return 'Processando'
  if (status === 'done') return 'Pronto'
  if (status === 'error') return 'Precisa de atenção'
  return 'Na fila'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthUploadPage() {
  const router = useRouter()
  const [items, setItems] = useState<UploadItem[]>([])
  const [draftsById, setDraftsById] = useState<Record<string, HealthQuoteDraft>>({})
  const [phase, setPhase] = useState<Phase>('idle')
  const [notice, setNotice] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const successfulCount = Object.keys(draftsById).length
  const hasFiles = items.length > 0
  const hasFailures = items.some((item) => item.status === 'error')
  const isProcessing = phase === 'processing'
  const pendingCount = items.filter((item) => item.status === 'pending' || item.status === 'processing').length

  const headerCopy = useMemo(() => {
    if (phase === 'processing') return 'Processando PDFs de Saúde'
    if (phase === 'partial') return 'Alguns PDFs precisam de atenção'
    if (phase === 'error') return 'Não foi possível montar a cotação'
    return 'Importar PDFs Saúde'
  }, [phase])

  const helperCopy = useMemo(() => {
    if (phase === 'processing') {
      return 'Estamos lendo cada PDF e separando vidas, planos, valores e avisos para revisão.'
    }
    if (phase === 'partial') {
      return 'Você pode corrigir os arquivos com falha, tentar novamente ou continuar com os PDFs processados.'
    }
    if (phase === 'error') {
      return 'Nenhum PDF foi processado com sucesso. Remova o arquivo com problema ou tente uma versão com texto selecionável.'
    }
    return 'Suba uma ou mais propostas em PDF. Vamos processar tudo antes de abrir o workspace de revisão.'
  }, [phase])

  const addFiles = useCallback((fileList: Iterable<File>) => {
    const currentFiles = items.map((item) => item.file)
    const result = describeFileSelection(fileList, currentFiles)
    if (result.files.length > 0) {
      setItems((prev) => [...prev, ...result.files.map(makeUploadItem)])
      setPhase('idle')
    }
    setNotice(result.notice)
  }, [items])

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setDraftsById((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setPhase('idle')
  }

  function clearAll() {
    setItems([])
    setDraftsById({})
    setPhase('idle')
    setNotice(null)
  }

  async function processItems(targets: UploadItem[]) {
    const nextDrafts: Record<string, HealthQuoteDraft> = { ...draftsById }
    setPhase('processing')
    setNotice(null)

    for (const item of targets) {
      setItems((prev) => prev.map((row) =>
        row.id === item.id ? { ...row, status: 'processing', message: undefined } : row,
      ))
      try {
        const draft = await quoteProcessApi.extractHealthDraft(item.file)
        nextDrafts[item.id] = draft
        setDraftsById({ ...nextDrafts })
        setItems((prev) => prev.map((row) =>
          row.id === item.id ? { ...row, status: 'done', message: 'Dados extraídos' } : row,
        ))
      } catch (err) {
        setItems((prev) => prev.map((row) =>
          row.id === item.id ? { ...row, status: 'error', message: friendlyHealthUploadError(err) } : row,
        ))
      }
    }

    const successfulDrafts = Object.values(nextDrafts)
    const failedAfterRun = targets.some((item) => !(item.id in nextDrafts))
    if (successfulDrafts.length > 0 && !failedAfterRun) {
      storeDraftAndNavigate(router, buildCombinedHealthDraft(successfulDrafts))
      return
    }
    setPhase(successfulDrafts.length > 0 ? 'partial' : 'error')
  }

  function handleStartProcessing() {
    const targets = items.filter((item) => item.status !== 'done')
    if (targets.length === 0 && successfulCount > 0) {
      storeDraftAndNavigate(router, buildCombinedHealthDraft(Object.values(draftsById)))
      return
    }
    void processItems(targets)
  }

  function handleRetryFailed() {
    const targets = items.filter((item) => item.status === 'error')
    if (targets.length > 0) void processItems(targets)
  }

  function handleContinueWithSuccess() {
    const drafts = Object.values(draftsById)
    if (drafts.length === 0) return
    storeDraftAndNavigate(router, buildCombinedHealthDraft(drafts))
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-mahogany/70">Cotação Saúde</p>
        <h2 className="text-xl font-semibold font-display text-ink mt-1">{headerCopy}</h2>
        <p className="text-sm text-ink-muted mt-1">{helperCopy}</p>
      </div>

      <label
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-mahogany bg-mahogany/5'
            : hasFiles
            ? 'border-mahogany/40 bg-mahogany/3'
            : 'border-surface-strong bg-surface/40 hover:border-mahogany/30 hover:bg-surface/60'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          addFiles(Array.from(e.dataTransfer.files))
        }}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />

        <IconUpload />
        <p className="mt-3 text-sm font-medium text-ink">
          {isDragging ? 'Solte os PDFs aqui' : 'Arraste PDFs ou toque para selecionar'}
        </p>
        <p className="mt-1 text-xs text-ink-faint">Você pode enviar mais de uma seguradora por vez</p>
      </label>

      {notice && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="mt-0.5"><IconAlert /></span>
          <p>{notice}</p>
        </div>
      )}

      {hasFiles && (
        <div className="rounded-xl border border-surface-strong bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-surface-strong px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">{items.length} PDF{items.length > 1 ? 's' : ''} selecionado{items.length > 1 ? 's' : ''}</p>
              <p className="text-xs text-ink-faint">
                {phase === 'processing'
                  ? `${pendingCount} em processamento ou na fila`
                  : successfulCount > 0
                  ? `${successfulCount} processado${successfulCount > 1 ? 's' : ''} com sucesso`
                  : 'Pronto para iniciar a extração'}
              </p>
            </div>
            <button
              type="button"
              onClick={clearAll}
              disabled={isProcessing}
              className="text-xs font-medium text-ink-faint hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Limpar
            </button>
          </div>

          <div className="divide-y divide-surface-strong">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${
                  item.status === 'done'
                    ? 'bg-green-50 text-green-700'
                    : item.status === 'error'
                    ? 'bg-red-50 text-red-700'
                    : item.status === 'processing'
                    ? 'bg-mahogany/8 text-mahogany'
                    : 'bg-surface text-ink-muted'
                }`}>
                  {item.status === 'pending' ? <IconPdf /> : <StatusIcon status={item.status} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{item.file.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.status === 'done'
                        ? 'bg-green-50 text-green-700'
                        : item.status === 'error'
                        ? 'bg-red-50 text-red-700'
                        : item.status === 'processing'
                        ? 'bg-mahogany/8 text-mahogany'
                        : 'bg-surface text-ink-faint'
                    }`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  {item.message && (
                    <p className={`mt-1 text-xs leading-relaxed ${item.status === 'error' ? 'text-red-700' : 'text-ink-faint'}`}>
                      {item.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={isProcessing}
                  className="mt-1 shrink-0 text-ink-faint hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Remover ${item.file.name}`}
                >
                  <IconX />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(phase === 'partial' || phase === 'error') && (
        <div className={`rounded-xl border px-4 py-3 ${
          phase === 'partial' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          <p className="text-sm font-semibold">
            {phase === 'partial' ? 'Processamento parcial' : 'Nenhum PDF processado'}
          </p>
          <p className="mt-1 text-sm leading-relaxed">
            {phase === 'partial'
              ? 'Alguns arquivos falharam, mas já temos dados suficientes para abrir a revisão com os PDFs processados.'
              : 'Os arquivos selecionados não geraram um rascunho de Saúde. Tente reenviar PDFs com texto selecionável.'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          onClick={() => router.push('/dashboard/quotes/health')}
          className="text-sm text-ink-muted hover:text-ink transition"
        >
          Voltar
        </button>

        <div className="flex flex-wrap justify-end gap-2">
          {hasFailures && !isProcessing && (
            <button
              type="button"
              onClick={handleRetryFailed}
              className="rounded-lg border border-surface-strong px-4 py-2.5 text-sm font-medium text-ink-muted hover:border-mahogany/30 hover:text-mahogany transition-colors"
            >
              Tentar falhas novamente
            </button>
          )}
          {phase === 'partial' && successfulCount > 0 && (
            <button
              type="button"
              onClick={handleContinueWithSuccess}
              className="rounded-lg border border-mahogany/30 bg-mahogany/5 px-4 py-2.5 text-sm font-semibold text-mahogany hover:bg-mahogany/10 transition-colors"
            >
              Continuar com {successfulCount} processado{successfulCount > 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={handleStartProcessing}
            disabled={!hasFiles || isProcessing}
            className="inline-flex items-center gap-2 rounded-lg bg-mahogany px-5 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing && <IconSpinner />}
            {isProcessing ? 'Processando...' : successfulCount > 0 && !items.some((item) => item.status !== 'done') ? 'Abrir revisão' : 'Processar PDFs'}
          </button>
        </div>
      </div>
    </div>
  )
}
