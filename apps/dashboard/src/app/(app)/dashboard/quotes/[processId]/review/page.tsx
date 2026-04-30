'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AutoQuoteData, Quote } from '@corretor/types'
import { useQuoteProcess } from '@/hooks/quotes/use-quote-process'
import { useReviewQuote } from '@/hooks/quotes/use-review-quote'

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

const PAYMENT_LABELS: Record<string, string> = {
  debit:           'Débito',
  credit_bradesco: 'Cartão Bradesco',
  credit_card:     'Cartão de Crédito',
  coupon:          'Boleto',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number | undefined | null) {
  if (typeof value !== 'number') return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function asAutoData(raw: Record<string, unknown> | null): Partial<AutoQuoteData> {
  return (raw ?? {}) as Partial<AutoQuoteData>
}

// ─── Row components ───────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-surface-strong last:border-0">
      <span className="text-xs text-ink-faint shrink-0">{label}</span>
      <span className="text-sm text-ink text-right">{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint pt-1">{children}</p>
  )
}

// ─── Quote confirmation card ──────────────────────────────────────────────────

function QuoteConfirmCard({ quote, processId }: { quote: Quote; processId: string }) {
  const d = asAutoData(quote.extractedData)
  const review = useReviewQuote(processId)
  const [name, setName] = useState(quote.name ?? INSURER_LABELS[quote.insurer] ?? quote.insurer)

  const isReady   = quote.status === 'READY'
  const isFailed  = quote.status === 'FAILED'
  const canReview = quote.status === 'PENDING_REVIEW'

  function handleConfirm() {
    review.mutate({
      quoteId: quote.id,
      dto: { name, extractedData: quote.extractedData ?? {} },
    })
  }

  // Vehicle
  const vehicleLabel = [d.vehicle?.model, d.vehicle?.yearModel ?? d.vehicle?.yearManufacture]
    .filter(Boolean).join(' — ')

  // Best installment per method (sem juros = total ≈ premium total)
  const premiumTotal = d.premium?.total
  function bestInstallment(method: NonNullable<AutoQuoteData['paymentMethods']>[number]) {
    if (!method.installments.length) return null
    const semJuros = method.installments.filter(
      (p) => premiumTotal != null && Math.abs((p.total ?? 0) - premiumTotal) / premiumTotal <= 0.02,
    )
    const pool = semJuros.length ? semJuros : method.installments
    return pool.reduce((best, cur) => (cur.number > best.number ? cur : best), pool[0])
  }

  return (
    <div className={`rounded-xl border bg-white overflow-hidden ${
      isReady ? 'border-green-200' : isFailed ? 'border-red-200' : 'border-surface-strong'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3 ${
        isReady ? 'bg-green-50' : isFailed ? 'bg-red-50' : 'bg-surface/40'
      }`}>
        <p className="font-semibold text-ink">{INSURER_LABELS[quote.insurer] ?? quote.insurer}</p>
        {isReady && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <IconCheck size={10} /> Confirmado
          </span>
        )}
        {isFailed && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
            Extração falhou
          </span>
        )}
        {canReview && (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Aguardando confirmação
          </span>
        )}
      </div>

      {isFailed ? (
        <p className="px-5 py-4 text-sm text-ink-faint">
          A extração falhou para esta seguradora. Você pode pular ou fazer upload novamente.
        </p>
      ) : (
        <div className="px-5 py-4 space-y-4">

          {/* Veículo */}
          {d.vehicle && (
            <div className="space-y-0">
              <SectionTitle>Veículo</SectionTitle>
              <DataRow label="Modelo" value={vehicleLabel || null} />
              <DataRow label="Placa" value={d.vehicle.plate ?? null} />
              <DataRow label="Valor FIPE" value={d.vehicle.fipeValue ? fmt(d.vehicle.fipeValue) : null} />
              <DataRow label="Código FIPE" value={d.vehicle.fipeCode ?? null} />
              <DataRow label="Chassi" value={d.vehicle.chassis ? `••• ${d.vehicle.chassis.slice(-5)}` : null} />
            </div>
          )}

          {/* Prêmio */}
          {d.premium && (
            <div className="space-y-0">
              <SectionTitle>Prêmio</SectionTitle>
              <DataRow label="Prêmio base AUTO" value={d.premium.base ? fmt(d.premium.base) : null} />
              <DataRow label="RCF" value={d.premium.rcfTotal ? fmt(d.premium.rcfTotal) : null} />
              <DataRow label="APP" value={d.premium.appTotal ? fmt(d.premium.appTotal) : null} />
              <DataRow label="IOF" value={d.premium.iof ? fmt(d.premium.iof) : null} />
              <DataRow
                label="Total"
                value={
                  <span className="font-semibold text-mahogany">{fmt(d.premium.total)}</span>
                }
              />
            </div>
          )}

          {/* Coberturas */}
          {d.coverage && (
            <div className="space-y-0">
              <SectionTitle>Coberturas</SectionTitle>
              {d.coverage.vehicle && (
                <>
                  <DataRow label="Casco" value={d.coverage.vehicle.fipePercentage != null ? `${d.coverage.vehicle.fipePercentage}% FIPE` : 'Incluída'} />
                  {d.coverage.vehicle.deductible != null && (
                    <DataRow
                      label="Franquia"
                      value={`${fmt(d.coverage.vehicle.deductible)}${d.coverage.vehicle.deductibleType ? ` (${d.coverage.vehicle.deductibleType})` : ''}`}
                    />
                  )}
                </>
              )}
              {d.coverage.rcf && (
                <>
                  {d.coverage.rcf.propertyDamage != null && <DataRow label="RCF — Danos Materiais" value={fmt(d.coverage.rcf.propertyDamage)} />}
                  {d.coverage.rcf.bodilyInjury != null && <DataRow label="RCF — Danos Corporais" value={fmt(d.coverage.rcf.bodilyInjury)} />}
                  {d.coverage.rcf.moralDamages != null && d.coverage.rcf.moralDamages > 0 && <DataRow label="RCF — Danos Morais" value={fmt(d.coverage.rcf.moralDamages)} />}
                </>
              )}
              {d.coverage.app && (
                <>
                  {d.coverage.app.death != null && d.coverage.app.death > 0 && <DataRow label="APP — Morte" value={fmt(d.coverage.app.death)} />}
                  {d.coverage.app.disability != null && d.coverage.app.disability > 0 && <DataRow label="APP — Invalidez" value={fmt(d.coverage.app.disability)} />}
                  {d.coverage.app.passengerCount != null && <DataRow label="APP — Passageiros" value={`${d.coverage.app.passengerCount} pessoas`} />}
                </>
              )}
              {d.coverage.assistance && (
                <DataRow
                  label="Assistências"
                  value={[
                    d.coverage.assistance.towing && 'Guincho',
                    d.coverage.assistance.glassProtection && 'Vidros',
                    d.coverage.assistance.replacementVehicle && `Veículo reserva${d.coverage.assistance.replacementDays ? ` (${d.coverage.assistance.replacementDays}d)` : ''}`,
                  ].filter(Boolean).join(' · ') || null}
                />
              )}
            </div>
          )}

          {/* Parcelamento */}
          {d.paymentMethods && d.paymentMethods.length > 0 && (
            <div className="space-y-0">
              <SectionTitle>Formas de pagamento</SectionTitle>
              {d.paymentMethods.map((method) => {
                const best = bestInstallment(method)
                if (!best) return null
                const isSemJuros = premiumTotal != null && Math.abs((best.total ?? 0) - premiumTotal) / premiumTotal <= 0.02
                return (
                  <DataRow
                    key={method.type}
                    label={PAYMENT_LABELS[method.type] ?? method.label}
                    value={
                      <span className="flex items-center gap-1.5">
                        {`até ${best.number}× ${fmt(best.amount)}`}
                        {isSemJuros && (
                          <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">sem juros</span>
                        )}
                      </span>
                    }
                  />
                )
              })}
            </div>
          )}

          {/* Franquias detalhadas */}
          {d.deductibles && d.deductibles.length > 0 && (
            <div className="space-y-0">
              <SectionTitle>Franquias detalhadas</SectionTitle>
              {d.deductibles.map((ded, i) => (
                <DataRow key={i} label={ded.item} value={fmt(ded.value)} />
              ))}
            </div>
          )}

          {/* Nome da cotação */}
          {canReview && (
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                Nome para o segurado
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bradesco — Reduzida (R$ 1.500,00)"
                className="w-full rounded-lg border border-surface-strong bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-mahogany/50 focus:outline-none focus:ring-1 focus:ring-mahogany/20"
              />
              <p className="text-[11px] text-ink-faint">Gerado automaticamente. Edite se quiser personalizar.</p>
            </div>
          )}

          {/* Ações */}
          {canReview && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleConfirm}
                disabled={review.isPending}
                className="rounded-lg bg-mahogany px-5 py-2 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {review.isPending ? 'Confirmando…' : 'Confirmar dados'}
              </button>
            </div>
          )}

          {isReady && (
            <div className="flex items-center gap-2 text-xs text-green-700 pt-1">
              <IconCheck size={14} />
              Dados confirmados — pronto para gerar PDF
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-surface-strong bg-white overflow-hidden">
      <div className="h-10 bg-surface animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-16 rounded bg-surface animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 rounded bg-surface animate-pulse" />
          <div className="h-8 rounded bg-surface animate-pulse" />
          <div className="h-8 rounded bg-surface animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewPage({ params }: { params: Promise<{ processId: string }> }) {
  const { processId } = use(params)
  const router = useRouter()
  const { data: process, isLoading } = useQuoteProcess(processId)

  const quotes = process?.quotes ?? []
  const allReady = quotes.length > 0 && quotes.every(
    (q) => q.status === 'READY' || q.status === 'FAILED',
  )
  const readyCount = quotes.filter((q) => q.status === 'READY').length

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold font-display text-ink">Confirmar cotações</h2>
        <p className="text-sm text-ink-muted mt-0.5">
          {isLoading
            ? 'Carregando…'
            : `Verifique os dados extraídos e confirme cada cotação`}
        </p>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <QuoteConfirmCard key={quote.id} quote={quote} processId={processId} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => router.push(`/dashboard/quotes/${processId}/processing`)}
          className="text-sm text-ink-muted hover:text-ink transition"
        >
          Voltar
        </button>

        {allReady && readyCount > 0 && (
          <button
            onClick={() => router.push(`/dashboard/quotes/${processId}/generate`)}
            className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-light transition-colors"
          >
            Gerar PDF e link →
          </button>
        )}
      </div>
    </div>
  )
}
