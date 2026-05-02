'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InsuranceProduct } from '@corretor/types'
import { useCreateProcess } from '@/hooks/quotes/use-create-process'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCTS: { value: InsuranceProduct; label: string; available: boolean }[] = [
  { value: 'AUTO',     label: 'Automóvel',    available: true  },
  { value: 'HOME',     label: 'Residencial',  available: false },
  { value: 'HEALTH',   label: 'Saúde',        available: false },
  { value: 'LIFE',     label: 'Vida',         available: false },
  { value: 'TRAVEL',   label: 'Viagem',       available: false },
  { value: 'BUSINESS', label: 'Empresarial',  available: false },
]

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

// ─── Step 1 ───────────────────────────────────────────────────────────────────

export default function NewQuotePage() {
  const router = useRouter()
  const createProcess = useCreateProcess()

  const [product, setProduct] = useState<InsuranceProduct>('AUTO')

  async function handleNext() {
    const process = await createProcess.mutateAsync({ product, insurers: [] })
    router.push(`/dashboard/quotes/${process.id}/upload`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-display text-ink">Nova cotação</h2>
          <p className="text-sm text-ink-muted mt-0.5">Passo 1 de 3 — Configuração</p>
        </div>
        <StepIndicator current={1} total={3} />
      </div>

      {/* Product selector */}
      <div className="rounded-xl bg-white border border-surface-strong p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink">Ramo</p>
          <p className="text-xs text-ink-muted mt-0.5">Selecione o tipo de seguro</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRODUCTS.map(({ value, label, available }) => (
            <button
              key={value}
              onClick={() => available && setProduct(value)}
              disabled={!available}
              className={`relative flex flex-col items-start gap-1 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                !available
                  ? 'cursor-not-allowed border-surface-strong bg-surface/50 text-ink-faint'
                  : value === product
                  ? 'border-mahogany bg-mahogany/5 text-mahogany ring-1 ring-mahogany'
                  : 'border-surface-strong bg-white text-ink hover:border-mahogany/40 hover:bg-surface/50'
              }`}
            >
              {label}
              {!available && (
                <span className="text-[10px] font-normal text-ink-faint">Em breve</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl bg-surface/60 border border-surface-strong px-5 py-4 flex items-start gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-ink-muted mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-xs text-ink-muted leading-relaxed">
          A seguradora será detectada automaticamente a partir do PDF. Você poderá confirmar antes do processamento.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => router.back()}
          className="text-sm text-ink-muted hover:text-ink transition"
        >
          Cancelar
        </button>

        <button
          onClick={handleNext}
          disabled={createProcess.isPending}
          className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createProcess.isPending ? 'Criando…' : 'Próximo'}
        </button>
      </div>
    </div>
  )
}
