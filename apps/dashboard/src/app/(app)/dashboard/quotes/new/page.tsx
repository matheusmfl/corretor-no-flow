'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Insurer, InsuranceProduct } from '@corretor/types'
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

const INSURERS: { value: Insurer; label: string }[] = [
  { value: 'BRADESCO',     label: 'Bradesco Seguros' },
  { value: 'PORTO_SEGURO', label: 'Porto Seguro'     },
  { value: 'TOKIO_MARINE', label: 'Tokio Marine'     },
  { value: 'SULAMERICA',   label: 'SulAmérica'       },
  { value: 'SUHAI',        label: 'Suhai'            },
  { value: 'ALIRO',        label: 'Aliro'            },
  { value: 'ALLIANZ',      label: 'Allianz'          },
  { value: 'YELLOW',       label: 'Yellow'           },
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
  const [selectedInsurers, setSelectedInsurers] = useState<Insurer[]>([])

  function toggleInsurer(insurer: Insurer) {
    setSelectedInsurers((prev) =>
      prev.includes(insurer) ? prev.filter((i) => i !== insurer) : [...prev, insurer],
    )
  }

  async function handleNext() {
    if (selectedInsurers.length === 0) return

    const process = await createProcess.mutateAsync({
      product,
      insurers: selectedInsurers,
    })

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

      {/* Insurer selector */}
      <div className="rounded-xl bg-white border border-surface-strong p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink">Seguradoras</p>
          <p className="text-xs text-ink-muted mt-0.5">
            Selecione uma ou mais para comparar
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {INSURERS.map(({ value, label }) => {
            const checked = selectedInsurers.includes(value)
            return (
              <button
                key={value}
                onClick={() => toggleInsurer(value)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left ${
                  checked
                    ? 'border-mahogany bg-mahogany/5 text-mahogany ring-1 ring-mahogany'
                    : 'border-surface-strong bg-white text-ink hover:border-mahogany/40 hover:bg-surface/50'
                }`}
              >
                {/* Checkbox visual */}
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    checked
                      ? 'border-mahogany bg-mahogany'
                      : 'border-surface-strong bg-white'
                  }`}
                >
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {label}
              </button>
            )
          })}
        </div>

        {selectedInsurers.length > 0 && (
          <p className="text-xs text-ink-muted">
            {selectedInsurers.length} seguradora{selectedInsurers.length > 1 ? 's' : ''} selecionada{selectedInsurers.length > 1 ? 's' : ''}
          </p>
        )}
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
          disabled={selectedInsurers.length === 0 || createProcess.isPending}
          className="rounded-lg bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createProcess.isPending ? 'Criando…' : 'Próximo'}
        </button>
      </div>
    </div>
  )
}
