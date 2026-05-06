'use client'

import { use, useReducer, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import type { DetectInsurerResponse, Insurer, Quote } from '@corretor/types'
import { quoteProcessApi } from '@/lib/api/quote-process.api'

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPORTED_INSURERS: { value: Insurer; label: string }[] = [
  { value: 'BRADESCO',        label: 'Bradesco Seguros'        },
  { value: 'PORTO_SEGURO',    label: 'Porto Seguro'            },
  { value: 'AZUL',            label: 'Azul Seguros'            },
  { value: 'MITSUI_SUMITOMO', label: 'Mitsui Sumitomo Seguros' },
  { value: 'ITAU',            label: 'Itaú Seguro Auto'        },
]

const INSURER_LABEL: Record<Insurer, string> = {
  BRADESCO:        'Bradesco',
  PORTO_SEGURO:    'Porto Seguro',
  TOKIO_MARINE:    'Tokio Marine',
  SULAMERICA:      'SulAmérica',
  SUHAI:           'Suhai',
  ALIRO:           'Aliro',
  ALLIANZ:         'Allianz',
  YELLOW:          'Yellow',
  AZUL:            'Azul Seguros',
  MITSUI_SUMITOMO: 'Mitsui Sumitomo',
  ITAU:            'Itaú Seguro Auto',
}

// ─── State machine ────────────────────────────────────────────────────────────

type FilePhase =
  | 'detecting'
  | 'ready'
  | 'needs_override'
  | 'unsupported'
  | 'submitting'
  | 'done'
  | 'error'

type FileEntry = {
  uid: string
  file: File
  phase: FilePhase
  detection?: DetectInsurerResponse
  override?: Insurer
  errorMsg?: string
}

type Action =
  | { type: 'ADD_ENTRIES'; entries: FileEntry[] }
  | { type: 'DETECTION_OK'; uid: string; result: DetectInsurerResponse }
  | { type: 'DETECTION_FAIL'; uid: string }
  | { type: 'SET_OVERRIDE'; uid: string; insurer: Insurer | '' }
  | { type: 'CONFIRM_OVERRIDE'; uid: string }
  | { type: 'REMOVE'; uid: string }
  | { type: 'SET_SUBMITTING'; uid: string }
  | { type: 'SET_DONE'; uid: string }
  | { type: 'SET_ERROR'; uid: string; errorMsg: string }

function phaseFromDetection(result: DetectInsurerResponse): FilePhase {
  // notProcessable = known blocker (family insurer, wrong product) — no override path
  if (result.notProcessable) return 'unsupported'
  if (result.confidence === 'high' && result.supported) return 'ready'
  if (!result.supported && result.detectedInsurer !== null) return 'unsupported'
  return 'needs_override'
}

function reducer(state: FileEntry[], action: Action): FileEntry[] {
  switch (action.type) {
    case 'ADD_ENTRIES':
      return [...state, ...action.entries]
    case 'DETECTION_OK': {
      const phase = phaseFromDetection(action.result)
      return state.map((e) =>
        e.uid === action.uid
          ? {
              ...e,
              phase,
              detection: action.result,
              override:
                phase === 'needs_override' &&
                action.result.detectedInsurer &&
                SUPPORTED_INSURERS.some((s) => s.value === action.result.detectedInsurer)
                  ? action.result.detectedInsurer
                  : undefined,
            }
          : e,
      )
    }
    case 'DETECTION_FAIL':
      return state.map((e) =>
        e.uid === action.uid ? { ...e, phase: 'needs_override' } : e,
      )
    case 'SET_OVERRIDE':
      return state.map((e) =>
        e.uid === action.uid
          ? { ...e, override: action.insurer as Insurer | undefined }
          : e,
      )
    case 'CONFIRM_OVERRIDE':
      return state.map((e) =>
        e.uid === action.uid && e.override ? { ...e, phase: 'ready' } : e,
      )
    case 'REMOVE':
      return state.filter((e) => e.uid !== action.uid)
    case 'SET_SUBMITTING':
      return state.map((e) => e.uid === action.uid ? { ...e, phase: 'submitting' } : e)
    case 'SET_DONE':
      return state.map((e) => e.uid === action.uid ? { ...e, phase: 'done' } : e)
    case 'SET_ERROR':
      return state.map((e) =>
        e.uid === action.uid ? { ...e, phase: 'error', errorMsg: action.errorMsg } : e,
      )
    default:
      return state
  }
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

// ─── Badges ───────────────────────────────────────────────────────────────────

function InsurerBadge({ insurer }: { insurer: Insurer }) {
  return (
    <span className="inline-flex items-center rounded-full bg-mahogany/10 px-2 py-0.5 text-xs font-semibold text-mahogany">
      {INSURER_LABEL[insurer]}
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const cfg = {
    high:   { label: 'Alta',  cls: 'bg-green-50 text-green-700' },
    medium: { label: 'Média', cls: 'bg-amber-50 text-amber-700' },
    low:    { label: 'Baixa', cls: 'bg-red-50 text-red-700' },
  }[confidence]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUpload() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-ink-faint">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-ember animate-spin shrink-0">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-green-600 shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconWarning() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-amber-600 shrink-0 mt-0.5">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

// ─── File row ─────────────────────────────────────────────────────────────────

function FileRow({
  entry,
  onRemove,
  onSetOverride,
  onConfirmOverride,
}: {
  entry: FileEntry
  onRemove: () => void
  onSetOverride: (insurer: Insurer | '') => void
  onConfirmOverride: () => void
}) {
  const { file, phase, detection, override } = entry

  return (
    <div className="flex items-start gap-3 rounded-xl bg-white border border-surface-strong p-4">
      {/* PDF icon */}
      <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-ink-faint text-[10px] font-bold">
        PDF
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{file.name}</p>

        {phase === 'detecting' && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Spinner />
            <span className="text-xs text-ink-muted">Identificando seguradora…</span>
          </div>
        )}

        {phase === 'ready' && detection && (
          <div className="flex items-center gap-2 mt-1.5">
            <IconCheck />
            <InsurerBadge insurer={override ?? detection.detectedInsurer!} />
            <ConfidenceBadge confidence={detection.confidence} />
          </div>
        )}

        {phase === 'needs_override' && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-amber-700">
              {detection?.reason
                ? detection.reason
                : detection
                ? detection.confidence === 'medium'
                  ? 'Confiança média — confirme a seguradora antes de processar:'
                  : 'Seguradora não reconhecida — selecione manualmente:'
                : 'Falha na detecção — selecione a seguradora:'}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={override ?? ''}
                onChange={(e) => onSetOverride(e.target.value as Insurer | '')}
                className="flex-1 rounded-lg border border-surface-strong bg-white px-3 py-1.5 text-sm text-ink focus:border-mahogany focus:outline-none"
              >
                <option value="">Selecionar seguradora…</option>
                {SUPPORTED_INSURERS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button
                onClick={onConfirmOverride}
                disabled={!override}
                className="rounded-lg bg-ember px-3 py-1.5 text-sm font-semibold text-white hover:bg-ember-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}

        {phase === 'unsupported' && (
          <p className="mt-1.5 text-xs text-red-600">
            {detection?.reason
              ? detection.reason
              : detection?.detectedInsurer
              ? `${INSURER_LABEL[detection.detectedInsurer]} detectada — ainda não suportada. Remova o arquivo.`
              : 'Seguradora não suportada. Remova o arquivo.'}
          </p>
        )}

        {phase === 'submitting' && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Spinner />
            <span className="text-xs text-ink-muted">Enviando para processamento…</span>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <IconCheck />
            <span className="text-xs text-green-700">Enfileirado para extração</span>
          </div>
        )}

        {phase === 'error' && (
          <p className="mt-1.5 text-xs text-red-600">{entry.errorMsg ?? 'Erro ao enviar'}</p>
        )}
      </div>

      {/* Remove button */}
      {phase !== 'submitting' && phase !== 'done' && (
        <button
          onClick={onRemove}
          className="shrink-0 mt-0.5 text-ink-faint hover:text-red-500 transition-colors"
          aria-label="Remover arquivo"
        >
          <IconX />
        </button>
      )}
    </div>
  )
}

// ─── Existing quotes banner ───────────────────────────────────────────────────

function ExistingQuotesBanner({
  quotes,
  replaceExisting,
  onReplaceChange,
  onDismiss,
}: {
  quotes: Quote[]
  replaceExisting: boolean
  onReplaceChange: (value: boolean) => void
  onDismiss: () => void
}) {
  const count = quotes.length
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
      <IconWarning />
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm font-medium text-amber-800">
          {count === 1
            ? 'Este processo já tem 1 cotação de uma tentativa anterior.'
            : `Este processo já tem ${count} cotações de uma tentativa anterior.`}
        </p>
        <p className="text-xs text-amber-700">
          Por padrão, os PDFs acima serão <strong className="font-semibold">adicionados</strong> a este
          processo. Para descartar todas as cotações anteriores e manter só este novo lote, marque a opção
          abaixo.
        </p>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-amber-900">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => onReplaceChange(e.target.checked)}
            className="mt-0.5 rounded border-amber-400 text-mahogany focus:ring-mahogany"
          />
          <span>Substituir todas as cotações anteriores por este lote</span>
        </label>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
        aria-label="Fechar aviso"
      >
        <IconX />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UploadPage({ params }: { params: Promise<{ processId: string }> }) {
  const { processId } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [entries, dispatch] = useReducer(reducer, [])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [existingQuotes, setExistingQuotes] = useState<Quote[]>([])
  const [showExistingBanner, setShowExistingBanner] = useState(false)
  const [replaceExisting, setReplaceExisting] = useState(false)

  // Load existing quotes on mount so the user knows what will be replaced
  useEffect(() => {
    quoteProcessApi.getById(processId).then((process) => {
      const existing = (process.quotes ?? []).filter((q) => q.status !== 'FAILED')
      if (existing.length > 0) {
        setExistingQuotes(existing)
        setShowExistingBanner(true)
      }
    }).catch(() => { /* ignore — non-critical */ })
  }, [processId])

  const handleFilesAdded = useCallback(
    (files: File[]) => {
      const newEntries: FileEntry[] = files
        .filter((f) => f.name.toLowerCase().endsWith('.pdf'))
        .map((file) => ({ uid: crypto.randomUUID(), file, phase: 'detecting' as const }))

      if (newEntries.length === 0) return
      dispatch({ type: 'ADD_ENTRIES', entries: newEntries })

      newEntries.forEach((entry) => {
        quoteProcessApi
          .detectInsurer(entry.file)
          .then((result) => dispatch({ type: 'DETECTION_OK', uid: entry.uid, result }))
          .catch(() => dispatch({ type: 'DETECTION_FAIL', uid: entry.uid }))
      })
    },
    [],
  )

  const readyCount = entries.filter((e) => e.phase === 'ready').length
  const doneCount = entries.filter((e) => e.phase === 'done').length
  const allSettled =
    entries.length > 0 &&
    entries.every((e) => e.phase === 'ready' || e.phase === 'done')
  const canProcess = allSettled && (readyCount > 0 || doneCount > 0)

  async function handleProcess() {
    setIsProcessing(true)
    const readyEntries = entries.filter((e) => e.phase === 'ready')
    let anyFailed = false

    if (readyEntries.length > 0) {
      if (replaceExisting) {
        try {
          await quoteProcessApi.resetBatch(processId)
          setExistingQuotes([])
          setShowExistingBanner(false)
          setReplaceExisting(false)
        } catch {
          setIsProcessing(false)
          return
        }
      }

      await Promise.all(
        readyEntries.map(async (entry) => {
          const insurer = entry.override ?? entry.detection?.detectedInsurer
          if (!insurer) {
            anyFailed = true
            dispatch({
              type: 'SET_ERROR',
              uid: entry.uid,
              errorMsg: 'Seguradora não definida para este arquivo.',
            })
            return
          }
          dispatch({ type: 'SET_SUBMITTING', uid: entry.uid })
          try {
            await quoteProcessApi.uploadAuto(processId, insurer, entry.file)
            dispatch({ type: 'SET_DONE', uid: entry.uid })
          } catch {
            anyFailed = true
            dispatch({ type: 'SET_ERROR', uid: entry.uid, errorMsg: 'Falha ao enviar — remova ou tente novamente' })
          }
        }),
      )
    }

    setIsProcessing(false)
    if (!anyFailed) {
      await queryClient.invalidateQueries({ queryKey: ['quote-process', processId] })
      await queryClient.refetchQueries({ queryKey: ['quote-process', processId] })
      router.push(`/dashboard/quotes/${processId}/processing`)
    }
  }

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

      {/* Drop zone */}
      <label
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-mahogany bg-mahogany/5'
            : 'border-surface-strong bg-surface/40 hover:border-mahogany/40 hover:bg-surface/60'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFilesAdded([...e.dataTransfer.files])
        }}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) handleFilesAdded([...e.target.files])
            e.target.value = ''
          }}
        />
        <IconUpload />
        <p className="mt-3 text-sm font-medium text-ink">
          {isDragging ? 'Solte os arquivos aqui' : 'Arraste os PDFs aqui ou toque para selecionar'}
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          Várias cotações de uma vez · somente .pdf · seguradora detectada automaticamente
        </p>
      </label>

      {/* File list */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <FileRow
              key={entry.uid}
              entry={entry}
              onRemove={() => dispatch({ type: 'REMOVE', uid: entry.uid })}
              onSetOverride={(insurer) => dispatch({ type: 'SET_OVERRIDE', uid: entry.uid, insurer })}
              onConfirmOverride={() => dispatch({ type: 'CONFIRM_OVERRIDE', uid: entry.uid })}
            />
          ))}
        </div>
      )}

      {/* Help text when items need action */}
      {entries.some((e) => e.phase === 'needs_override') && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-4 py-3">
          Alguns arquivos precisam de confirmação manual antes de serem processados.
        </p>
      )}

      {/* Existing quotes warning */}
      {showExistingBanner && existingQuotes.length > 0 && (
        <ExistingQuotesBanner
          quotes={existingQuotes}
          replaceExisting={replaceExisting}
          onReplaceChange={setReplaceExisting}
          onDismiss={() => {
            setReplaceExisting(false)
            setShowExistingBanner(false)
          }}
        />
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
          onClick={handleProcess}
          disabled={!canProcess || isProcessing}
          className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing
            ? 'Enviando…'
            : readyCount > 0
            ? `Processar ${readyCount} cotaç${readyCount !== 1 ? 'ões' : 'ão'}`
            : 'Ir para processamento'}
        </button>
      </div>
    </div>
  )
}
