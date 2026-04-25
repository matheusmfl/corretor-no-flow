'use client'

import Link from 'next/link'
import { useCurrentUser } from '@/hooks/auth/use-current-user'

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-xl bg-white border border-surface-strong p-5">
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-bold font-display text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-faint">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { data: user } = useCurrentUser()

  const firstName = user?.name?.split(' ')[0] ?? 'Corretor'

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold font-display text-ink">
          Olá, {firstName}!
        </h2>
        <p className="text-sm text-ink-muted mt-0.5">
          Aqui está um resumo da sua atividade.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cotações este mês" value={0} sub="Nenhuma ainda" />
        <StatCard label="Enviadas"           value={0} />
        <StatCard label="Visualizadas"       value={0} />
        <StatCard label="Conversão"          value="—" sub="Sem dados ainda" />
      </div>

      {/* CTA — primeira cotação */}
      <div className="rounded-xl bg-mahogany p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gold font-display">Crie sua primeira cotação</p>
          <p className="text-sm text-gold/70 mt-0.5">
            Faça upload de um PDF do Bradesco e gere uma proposta profissional em segundos.
          </p>
        </div>
        <Link
          href="/dashboard/quotes/new"
          className="shrink-0 rounded-lg bg-ember px-4 py-2.5 text-sm font-semibold text-white hover:bg-ember-light transition"
        >
          Nova cotação
        </Link>
      </div>

      {/* Recent quotes placeholder */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">Cotações recentes</h3>
          <Link href="/dashboard/quotes" className="text-xs text-mahogany hover:underline">
            Ver todas
          </Link>
        </div>

        <div className="rounded-xl border border-surface-strong bg-white divide-y divide-surface-strong overflow-hidden">
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-ink-faint">Nenhuma cotação ainda.</p>
            <Link
              href="/dashboard/quotes/new"
              className="mt-3 inline-block text-xs font-medium text-mahogany hover:underline"
            >
              Criar primeira cotação
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
