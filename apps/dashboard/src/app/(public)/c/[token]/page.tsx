import type { Metadata } from 'next'
import type { PublicProcessResponse, AutoQuoteData } from '@corretor/types'

// ─── Data fetching ────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type FetchResult =
  | { ok: true;  data: PublicProcessResponse }
  | { ok: false; status: 404 | 410 | 500 }

async function fetchProcess(token: string): Promise<FetchResult> {
  try {
    const res = await fetch(`${API_URL}/api/public/c/${token}`, {
      cache: 'no-store',
    })
    if (res.status === 404) return { ok: false, status: 404 }
    if (res.status === 410) return { ok: false, status: 410 }
    if (!res.ok)            return { ok: false, status: 500 }
    return { ok: true, data: await res.json() }
  } catch {
    return { ok: false, status: 500 }
  }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> },
): Promise<Metadata> {
  const { token } = await params
  const result = await fetchProcess(token)
  if (!result.ok) return { title: 'Cotação não encontrada' }
  return {
    title: `Cotação — ${result.data.company.displayName}`,
    description: 'Confira sua cotação de seguro personalizada.',
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRODUCT_LABELS: Record<string, string> = {
  AUTO:     'Automóvel',
  HEALTH:   'Saúde',
  LIFE:     'Vida',
  TRAVEL:   'Viagem',
  HOME:     'Residencial',
  BUSINESS: 'Empresarial',
  RURAL:    'Rural',
}

const INSURER_LABELS: Record<string, string> = {
  BRADESCO:     'Bradesco Seguros',
  PORTO_SEGURO: 'Porto Seguro',
  TOKIO_MARINE: 'Tokio Marine',
  SULAMERICA:   'SulAmérica',
  SUHAI:        'Suhai',
  ALIRO:        'Aliro',
  ALLIANZ:      'Allianz',
  YELLOW:       'Yellow Seguros',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

// ─── Error states ─────────────────────────────────────────────────────────────

function ErrorPage({ status }: { status: 404 | 410 | 500 }) {
  const messages = {
    404: { title: 'Link não encontrado',  body: 'Este link de cotação não existe ou foi removido.' },
    410: { title: 'Link expirado',        body: 'Este link de cotação já expirou. Entre em contato com seu corretor para obter um novo link.' },
    500: { title: 'Erro inesperado',      body: 'Não foi possível carregar a cotação. Tente novamente em instantes.' },
  }
  const { title, body } = messages[status]

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-3">
        <p className="text-4xl">{status === 410 ? '⏰' : '🔍'}</p>
        <h1 className="text-xl font-bold text-[#1a1814]">{title}</h1>
        <p className="text-sm text-[#5a5750] leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

// ─── Quote card ───────────────────────────────────────────────────────────────

function QuoteCard({
  quote,
  token,
  brand,
}: {
  quote: PublicProcessResponse['quotes'][0]
  token: string
  brand: string
}) {
  const d = (quote.extractedData ?? {}) as Partial<AutoQuoteData>
  const total = d.premium?.total
  const vehicleLabel = [d.vehicle?.model, d.vehicle?.yearModel ?? d.vehicle?.yearManufacture]
    .filter(Boolean).join(' — ')
  const best = (() => {
    if (!d.paymentMethods) return null
    const premiumTotal = d.premium?.total ?? 0
    const tolerance = premiumTotal * 0.02
    const ordered = [
      d.paymentMethods.find((m) => m.type === 'credit_bradesco'),
      d.paymentMethods.find((m) => m.type === 'credit_card'),
    ].filter(Boolean) as NonNullable<AutoQuoteData['paymentMethods'][0]>[]
    for (const m of ordered) {
      const sj = m.installments.filter((i) => Math.abs((i.total ?? i.amount * i.number) - premiumTotal) <= tolerance)
      if (sj.length > 0) {
        const last = sj[sj.length - 1]
        return { count: last.number, amount: last.amount }
      }
    }
    return null
  })()

  return (
    <div className="bg-white rounded-xl border border-[#e2dfd8] overflow-hidden shadow-sm">
      {/* Header colorido */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: brand }}>
        <span className="text-sm font-bold text-white">
          {INSURER_LABELS[quote.insurer] ?? quote.insurer}
        </span>
        {vehicleLabel && (
          <span className="text-xs text-white/70 truncate max-w-[140px]">{vehicleLabel}</span>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Nome da cotação */}
        {quote.name && (
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9a9590]">
            {quote.name}
          </p>
        )}

        {/* Prêmio */}
        {total != null && (
          <div>
            <p className="text-xs text-[#9a9590] mb-0.5">Valor anual</p>
            <p className="text-2xl font-extrabold text-[#1a1814] tracking-tight">
              {fmt(total)}
            </p>
            {best && (
              <p className="text-xs text-[#5a5750] mt-0.5">
                ou {best.count}× {fmt(best.amount)} sem juros
              </p>
            )}
          </div>
        )}

        {/* Coberturas rápidas */}
        {d.coverage && (
          <div className="flex flex-wrap gap-1.5">
            {d.coverage.vehicle?.fipePercentage != null && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]">
                {d.coverage.vehicle.fipePercentage}% FIPE
              </span>
            )}
            {d.coverage.rcf?.propertyDamage != null && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]">
                RCF {fmt(d.coverage.rcf.propertyDamage)}
              </span>
            )}
            {d.coverage.assistance?.towing && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]">
                Guincho
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <a
          href={`/c/${token}/quote/${quote.id}`}
          className="mt-1 flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: brand }}
        >
          Ver cotação completa →
        </a>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicPage(
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const result = await fetchProcess(token)

  if (!result.ok) return <ErrorPage status={result.status} />

  const { process, quotes, company } = result.data
  const brand = company.primaryColor

  const whatsappUrl = `https://wa.me/55${company.whatsapp.replace(/\D/g, '')}` +
    `?text=${encodeURIComponent(`Olá! Estou analisando a cotação de ${PRODUCT_LABELS[process.product] ?? process.product} que você enviou.`)}`

  return (
    <div className="min-h-screen bg-[#f4f2ee]">

      {/* Header da corretora */}
      <header className="px-5 py-5" style={{ background: brand }}>
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt={company.displayName} className="h-9 object-contain" />
          ) : (
            <span className="text-lg font-extrabold text-white tracking-tight">
              {company.displayName}
            </span>
          )}
          <span className="text-xs text-white/60 shrink-0">
            Válido até {fmtDate(process.expiresAt)}
          </span>
        </div>
      </header>

      {/* Saudação */}
      <div className="max-w-lg mx-auto px-5 pt-6 pb-2">
        <h1 className="text-xl font-bold text-[#1a1814]">
          {process.clientName
            ? <>Olá, <span style={{ color: brand }}>{process.clientName.split(' ')[0]}</span>!</>
            : 'Sua cotação está pronta!'}
        </h1>
        <p className="text-sm text-[#5a5750] mt-1">
          Preparamos {quotes.length} cotaç{quotes.length !== 1 ? 'ões' : 'ão'} de{' '}
          <strong>{PRODUCT_LABELS[process.product] ?? process.product}</strong> para você.
          Compare e escolha a melhor opção.
        </p>
      </div>

      {/* Cards de cotação */}
      <div className="max-w-lg mx-auto px-5 py-4 space-y-4">
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} token={token} brand={brand} />
        ))}
      </div>

      {/* Rodapé — contato do corretor */}
      <div className="max-w-lg mx-auto px-5 pb-10 pt-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full rounded-xl py-3.5 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20bc5a] transition-colors"
        >
          <IconWhatsApp />
          Falar com {company.displayName}
        </a>
        <p className="text-center text-xs text-[#9a9590] mt-4">
          Cotação gerada por <strong>{company.displayName}</strong> via Corretor no Flow
        </p>
      </div>

    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
