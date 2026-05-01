'use client'

import { useEffect, useRef } from 'react'
import type { QuoteProcessMetrics, QuoteSessionSummary, QuoteSessionsByDay } from '@corretor/types'
import { useProcessMetrics } from '@/hooks/quotes/use-process-metrics'

// ─── Constants ────────────────────────────────────────────────────────────────

const INSURER_LABELS: Record<string, string> = {
  BRADESCO:     'Bradesco',
  PORTO_SEGURO: 'Porto Seguro',
  TOKIO_MARINE: 'Tokio Marine',
  SULAMERICA:   'SulAmérica',
  SUHAI:        'Suhai',
  ALIRO:        'Aliro',
  ALLIANZ:      'Allianz',
  YELLOW:       'Yellow',
}

const EVENT_LABELS: Record<string, string> = {
  PAGE_OPEN:     'Abertura',
  PAGE_CLOSE:    'Fechamento',
  INSURER_VIEW:  'Visualizou seguradora',
  PAYMENT_VIEW:  'Visualizou pagamento',
  WHATSAPP_CLICK:'Clicou WhatsApp',
  PDF_DOWNLOAD:  'Baixou PDF',
  HEARTBEAT:     'Heartbeat',
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDuration(seconds: number | null): string {
  if (seconds == null) return '—'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}min` : `${m}min ${s}s`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })
}

function referrerLabel(referrer: string | null): string {
  if (!referrer) return 'Acesso direto'
  if (referrer.includes('whatsapp')) return 'WhatsApp'
  if (referrer.includes('instagram')) return 'Instagram'
  if (referrer.includes('facebook')) return 'Facebook'
  if (referrer.includes('google')) return 'Google'
  try {
    return new URL(referrer).hostname
  } catch {
    return referrer
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, highlight = false,
}: {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-mahogany text-white' : 'bg-surface'}`}>
      <p className={`text-xs font-medium mb-1 ${highlight ? 'text-white/60' : 'text-ink-faint'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-ink'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-0.5 ${highlight ? 'text-white/50' : 'text-ink-faint'}`}>{sub}</p>
      )}
    </div>
  )
}

function BarChart({ data }: { data: QuoteSessionsByDay[] }) {
  if (data.length === 0) {
    return (
      <p className="text-xs text-ink-faint text-center py-6">Nenhuma visita registrada ainda.</p>
    )
  }
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
          <div
            className="w-full rounded-sm bg-mahogany/80 transition-all group-hover:bg-mahogany"
            style={{ height: `${Math.max(4, (d.count / max) * 68)}px` }}
            title={`${fmtDateShort(d.date + 'T00:00:00')}: ${d.count} visita${d.count !== 1 ? 's' : ''}`}
          />
          <span className="text-[9px] text-ink-faint hidden group-hover:block absolute -bottom-4">
            {fmtDateShort(d.date + 'T00:00:00')}
          </span>
        </div>
      ))}
    </div>
  )
}

function InsurerBar({ insurer, count, max }: { insurer: string; count: number; max: number }) {
  const pct = Math.round((count / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink font-medium">{INSURER_LABELS[insurer] ?? insurer}</span>
        <span className="text-ink-faint">{count}×</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-strong overflow-hidden">
        <div
          className="h-full rounded-full bg-mahogany transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function SessionItem({ session }: { session: QuoteSessionSummary }) {
  const events = session.events.filter((e) => e.type !== 'HEARTBEAT')
  return (
    <div className="py-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <IconUser />
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink truncate">
              {fmtDateShort(session.startedAt)} às {fmtTime(session.startedAt)}
            </p>
            <p className="text-[11px] text-ink-faint">{referrerLabel(session.referrer)}</p>
          </div>
        </div>
        <span className="text-xs text-ink-faint shrink-0 font-mono">
          {fmtDuration(session.durationSeconds)}
        </span>
      </div>
      {events.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-5">
          {events.map((e, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface text-ink-faint font-medium"
            >
              {EVENT_LABELS[e.type] ?? e.type}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function MetricsSkeleton() {
  return (
    <div className="p-5 space-y-5 animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-surface" />
        ))}
      </div>
      <div className="h-32 rounded-xl bg-surface" />
      <div className="h-40 rounded-xl bg-surface" />
    </div>
  )
}

function MetricsEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
        <IconBarChart className="text-ink-faint" />
      </div>
      <p className="text-sm font-medium text-ink">Sem dados ainda</p>
      <p className="text-xs text-ink-faint leading-relaxed">
        As métricas aparecem quando o segurado abre o link público da cotação.
      </p>
    </div>
  )
}

function MetricsContent({ metrics }: { metrics: QuoteProcessMetrics }) {
  const hasInsurers = metrics.insurerViews.length > 0
  const hasSessions = metrics.recentSessions.length > 0
  const maxInsurer  = hasInsurers ? Math.max(...metrics.insurerViews.map((v) => v.count)) : 1

  return (
    <div className="p-5 space-y-6 overflow-y-auto flex-1">

      {/* Datas de acesso */}
      {metrics.firstOpenedAt && (
        <div className="flex items-center gap-3 text-xs text-ink-faint bg-surface rounded-lg px-4 py-3">
          <IconClock />
          <span>
            Primeiro acesso em <strong className="text-ink">{fmtDate(metrics.firstOpenedAt)}</strong>
            {metrics.lastOpenedAt && metrics.lastOpenedAt !== metrics.firstOpenedAt && (
              <> — último em <strong className="text-ink">{fmtDate(metrics.lastOpenedAt)}</strong></>
            )}
          </span>
        </div>
      )}

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Visitantes únicos"
          value={metrics.totalSessions}
          highlight={metrics.totalSessions > 0}
        />
        <StatCard
          label="Tempo médio"
          value={fmtDuration(metrics.avgDurationSeconds)}
          sub="por sessão"
        />
        <StatCard
          label="Cliques no WhatsApp"
          value={metrics.whatsappClicks}
        />
        <StatCard
          label="Downloads PDF"
          value={metrics.pdfDownloads}
        />
      </div>

      {/* Gráfico de visitas por dia */}
      {metrics.sessionsByDay.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Visitas por dia</SectionTitle>
          <div className="bg-surface rounded-xl px-4 pt-4 pb-5">
            <BarChart data={metrics.sessionsByDay} />
            <div className="flex justify-between mt-2">
              {metrics.sessionsByDay.length > 1 && (
                <>
                  <span className="text-[10px] text-ink-faint">
                    {fmtDateShort(metrics.sessionsByDay[0].date + 'T00:00:00')}
                  </span>
                  <span className="text-[10px] text-ink-faint">
                    {fmtDateShort(metrics.sessionsByDay[metrics.sessionsByDay.length - 1].date + 'T00:00:00')}
                  </span>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Seguradoras mais vistas */}
      {hasInsurers && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle>Seguradoras mais vistas</SectionTitle>
            {metrics.topInsurer && (
              <span className="text-[10px] text-mahogany font-semibold bg-mahogany/8 px-2 py-0.5 rounded-full">
                Top: {INSURER_LABELS[metrics.topInsurer] ?? metrics.topInsurer}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {metrics.insurerViews.map((v) => (
              <InsurerBar key={v.insurer} insurer={v.insurer} count={v.count} max={maxInsurer} />
            ))}
          </div>
        </section>
      )}

      {/* Sessões recentes */}
      {hasSessions && (
        <section className="space-y-1">
          <SectionTitle>Sessões recentes</SectionTitle>
          <div className="divide-y divide-surface-strong">
            {metrics.recentSessions.map((s) => (
              <SessionItem key={s.sessionId} session={s} />
            ))}
          </div>
        </section>
      )}

      {metrics.totalSessions > 0 && !hasSessions && (
        <p className="text-xs text-ink-faint text-center py-4">
          Nenhuma sessão recente disponível.
        </p>
      )}
    </div>
  )
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

interface MetricsDrawerProps {
  processId: string | null
  clientName: string | null
  onClose: () => void
}

export function MetricsDrawer({ processId, clientName, onClose }: MetricsDrawerProps) {
  const { data: metrics, isLoading } = useProcessMetrics(processId)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const isOpen = !!processId

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-strong shrink-0">
          <IconBarChart className="text-mahogany shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">
              Métricas de engajamento
            </p>
            {clientName && (
              <p className="text-xs text-ink-faint truncate">{clientName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-surface hover:text-ink transition-colors"
            aria-label="Fechar"
          >
            <IconX />
          </button>
        </div>

        {/* Content */}
        {!isOpen ? null : isLoading ? (
          <MetricsSkeleton />
        ) : !metrics || metrics.totalSessions === 0 ? (
          <MetricsEmpty />
        ) : (
          <MetricsContent metrics={metrics} />
        )}
      </div>
    </>
  )
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{children}</p>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBarChart({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
      <line x1="2"  y1="20" x2="22" y2="20" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6"  y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-ink-faint shrink-0">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
