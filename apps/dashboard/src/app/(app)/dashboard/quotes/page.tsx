'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useListProcesses } from '@/hooks/quotes/use-list-processes'
import type { InsuranceProduct, ListProcessesQuery, QuoteProcessListItem, QuoteProcessStatus } from '@corretor/types'

// ─── Labels ───────────────────────────────────────────────────────────────────

const PRODUCT_LABELS: Record<InsuranceProduct, string> = {
  AUTO:     'Automóvel',
  HEALTH:   'Saúde',
  LIFE:     'Vida',
  TRAVEL:   'Viagem',
  HOME:     'Residencial',
  BUSINESS: 'Empresarial',
  RURAL:    'Rural',
}

const STATUS_CONFIG: Record<QuoteProcessStatus, { label: string; className: string }> = {
  DRAFT:          { label: 'Rascunho',    className: 'bg-surface text-ink-muted'      },
  PROCESSING:     { label: 'Processando', className: 'bg-amber-50 text-amber-700'     },
  PENDING_REVIEW: { label: 'Revisar',     className: 'bg-blue-50 text-blue-700'       },
  READY:          { label: 'Pronto',      className: 'bg-green-50 text-green-700'     },
  PUBLISHED:      { label: 'Publicado',   className: 'bg-green-100 text-green-800'    },
  ARCHIVED:       { label: 'Arquivado',   className: 'bg-surface text-ink-faint'      },
}

const STATUS_FILTER_TABS: { label: string; value: QuoteProcessStatus | undefined }[] = [
  { label: 'Todos',       value: undefined         },
  { label: 'Processando', value: 'PROCESSING'      },
  { label: 'Revisar',     value: 'PENDING_REVIEW'  },
  { label: 'Pronto',      value: 'READY'           },
  { label: 'Publicado',   value: 'PUBLISHED'       },
]

function processHref(p: QuoteProcessListItem): string {
  if (p.status === 'DRAFT')          return `/dashboard/quotes/${p.id}/upload`
  if (p.status === 'PROCESSING')     return `/dashboard/quotes/${p.id}/processing`
  if (p.status === 'PENDING_REVIEW') return `/dashboard/quotes/${p.id}/review`
  if (p.status === 'READY')          return `/dashboard/quotes/${p.id}/review`
  if (p.status === 'PUBLISHED')      return `/dashboard/quotes/${p.id}/generate`
  return `/dashboard/quotes/${p.id}/upload`
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: QuoteProcessStatus }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function ProcessRow({ process }: { process: QuoteProcessListItem }) {
  const href = processHref(process)
  const date = new Date(process.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  const openedAt = process.openedAt
    ? new Date(process.openedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null

  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-5 py-4 hover:bg-surface/60 transition-colors group"
    >
      <span className="shrink-0 rounded-md bg-surface px-2.5 py-1 text-xs font-semibold text-ink-muted">
        {PRODUCT_LABELS[process.product]}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">
          {process.clientName ?? 'Sem nome'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-ink-faint">{date}</p>
          {openedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
              <IconEye size={11} />
              Aberto em {openedAt}
            </span>
          )}
        </div>
      </div>

      <StatusBadge status={process.status} />

      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0 text-ink-faint group-hover:text-ink-muted transition-colors"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  )
}

function StatusTabs({
  active,
  onChange,
}: {
  active: QuoteProcessStatus | undefined
  onChange: (s: QuoteProcessStatus | undefined) => void
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {STATUS_FILTER_TABS.map((tab) => (
        <button
          key={tab.label}
          onClick={() => onChange(tab.value)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            active === tab.value
              ? 'bg-mahogany text-gold'
              : 'text-ink-muted hover:bg-surface hover:text-ink'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        type="text"
        placeholder="Buscar por nome do cliente…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-surface-strong bg-white pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-mahogany focus:outline-none focus:ring-1 focus:ring-mahogany"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
        >
          <IconX />
        </button>
      )}
    </div>
  )
}

function EmptyState({ hasFilters, search, onClear }: { hasFilters: boolean; search: string; onClear: () => void }) {
  if (!hasFilters) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-sm text-ink-faint">Nenhuma cotação ainda.</p>
        <Link
          href="/dashboard/quotes/new"
          className="mt-3 inline-block text-xs font-medium text-mahogany hover:underline"
        >
          Criar primeira cotação
        </Link>
      </div>
    )
  }

  return (
    <div className="px-5 py-16 text-center space-y-2">
      <p className="text-sm text-ink-faint">
        {search
          ? `Nenhuma cotação encontrada para "${search}"`
          : 'Nenhuma cotação com esse status'}
      </p>
      <button
        onClick={onClear}
        className="text-xs font-medium text-mahogany hover:underline"
      >
        Limpar filtros
      </button>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="h-6 w-20 rounded-md bg-surface animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-36 rounded bg-surface animate-pulse" />
        <div className="h-2.5 w-20 rounded bg-surface animate-pulse" />
      </div>
      <div className="h-5 w-16 rounded-full bg-surface animate-pulse" />
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconEye({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconSearch({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuotesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const statusParam = searchParams.get('status') as QuoteProcessStatus | null
  const searchParam = searchParams.get('search') ?? ''

  const [searchInput, setSearchInput] = useState(searchParam)
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Sync filters to URL
  const setFilter = useCallback(
    (status: QuoteProcessStatus | undefined, search: string) => {
      const p = new URLSearchParams()
      if (status) p.set('status', status)
      if (search) p.set('search', search)
      router.replace(`${pathname}?${p.toString()}`)
    },
    [pathname, router],
  )

  useEffect(() => {
    setFilter(statusParam ?? undefined, debouncedSearch)
  }, [debouncedSearch, statusParam, setFilter])

  const query: ListProcessesQuery = {
    status: statusParam ?? undefined,
    search: debouncedSearch || undefined,
  }

  const { data, isLoading } = useListProcesses(query)
  const items = data?.items ?? []
  const hasFilters = !!statusParam || !!debouncedSearch

  function clearFilters() {
    setSearchInput('')
    setDebouncedSearch('')
    router.replace(pathname)
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-display text-ink">Cotações</h2>
          {data && (
            <p className="text-sm text-ink-muted mt-0.5">
              {data.total} processo{data.total !== 1 ? 's' : ''} no total
            </p>
          )}
        </div>
        <Link
          href="/dashboard/quotes/new"
          className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white hover:bg-ember-light transition-colors"
        >
          Nova cotação
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <SearchInput value={searchInput} onChange={setSearchInput} />
        <StatusTabs
          active={statusParam ?? undefined}
          onChange={(s) => setFilter(s, debouncedSearch)}
        />
      </div>

      {/* List */}
      <div className="rounded-xl border border-surface-strong bg-white overflow-hidden divide-y divide-surface-strong">
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : items.length === 0 ? (
          <EmptyState hasFilters={hasFilters} search={debouncedSearch} onClear={clearFilters} />
        ) : (
          items.map((p) => <ProcessRow key={p.id} process={p} />)
        )}
      </div>
    </div>
  )
}
