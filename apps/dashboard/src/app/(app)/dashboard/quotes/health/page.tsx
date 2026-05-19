'use client'

import Link from 'next/link'

// ─── StartCard ────────────────────────────────────────────────────────────────

type StartCardProps =
  | {
      icon: React.ReactNode
      title: string
      description: string
      recommended?: boolean
      href: string
      disabled?: false
    }
  | {
      icon: React.ReactNode
      title: string
      description: string
      recommended?: false
      href?: string
      disabled: true
    }

function StartCard(props: StartCardProps) {
  const inner = (
    <div
      className={`group relative flex flex-col gap-4 rounded-xl border p-5 transition-all ${
        props.disabled
          ? 'cursor-not-allowed border-surface-strong bg-surface/40 opacity-60'
          : props.recommended
          ? 'border-mahogany/30 bg-white shadow-sm hover:border-mahogany/60 hover:shadow-md cursor-pointer'
          : 'border-surface-strong bg-white hover:border-mahogany/30 hover:shadow-sm cursor-pointer'
      }`}
    >
      {/* Recommended badge */}
      {props.recommended && (
        <span className="absolute right-4 top-4 rounded-full bg-mahogany px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
          Recomendado
        </span>
      )}

      {/* Icon */}
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          props.disabled
            ? 'bg-surface-strong text-ink-faint'
            : props.recommended
            ? 'bg-mahogany/10 text-mahogany group-hover:bg-mahogany/15'
            : 'bg-surface text-ink-muted group-hover:bg-surface-strong'
        } transition-colors`}
      >
        {props.icon}
      </div>

      {/* Text */}
      <div className="space-y-1 pr-16">
        <p
          className={`text-sm font-semibold ${
            props.disabled ? 'text-ink-faint' : 'text-ink'
          }`}
        >
          {props.title}
        </p>
        <p className="text-xs leading-relaxed text-ink-faint">{props.description}</p>
      </div>

      {/* Arrow */}
      {!props.disabled && (
        <div
          className={`mt-auto self-end rounded-full p-1.5 transition-all ${
            props.recommended
              ? 'bg-mahogany/8 text-mahogany group-hover:bg-mahogany group-hover:text-gold'
              : 'bg-surface text-ink-muted group-hover:bg-mahogany/10 group-hover:text-mahogany'
          }`}
        >
          <IconArrow />
        </div>
      )}

      {/* Coming soon */}
      {props.disabled && (
        <p className="mt-auto text-[10px] font-medium text-ink-faint">Em breve</p>
      )}
    </div>
  )

  if (props.disabled || !props.href) return inner
  return <Link href={props.href}>{inner}</Link>
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function IconPdf() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconLives() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconManual() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconSpreadsheet() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthStartPage() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold font-display text-ink">
          Nova cotação Saúde
        </h2>
        <p className="text-sm text-ink-muted mt-1">
          Como você quer começar?
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StartCard
          recommended
          href="/dashboard/quotes/health/upload"
          icon={<IconPdf />}
          title="Importar PDF da seguradora"
          description="Faça upload de uma proposta ou cotação em PDF. Extraímos os dados e montamos a planilha para você."
        />

        <StartCard
          disabled
          icon={<IconLives />}
          title="Usar vidas de outro documento"
          description="Já tem uma lista de beneficiários? Importe e aplique tabelas cadastradas por cima."
        />

        <StartCard
          disabled
          icon={<IconManual />}
          title="Criar cotação manual"
          description="Informe as idades e o sistema calcula os valores a partir das tabelas cadastradas."
        />

        <StartCard
          disabled
          icon={<IconSpreadsheet />}
          title="Importar planilha"
          description="Suba uma planilha de vidas já formatada para gerar a comparação diretamente."
        />
      </div>

      {/* Footer hint */}
      <p className="text-xs text-ink-faint text-center pt-2">
        Outros modos de entrada chegam em breve
      </p>
    </div>
  )
}
