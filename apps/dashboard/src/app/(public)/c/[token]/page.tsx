import type { Metadata } from 'next'
import type { PublicProcessResponse, AutoQuoteData, HealthQuoteDraft, HealthQuoteOption } from '@corretor/types'
import { getDashboardEnvironmentHeaders, getServerApiBaseUrl } from '@/lib/api/base-url'
import { QuoteTracker } from './quote-tracker'

// ─── Data fetching ────────────────────────────────────────────────────────────

const API_URL = getServerApiBaseUrl()

type FetchResult =
  | { ok: true;  data: PublicProcessResponse }
  | { ok: false; status: 404 | 410 | 500 }

async function fetchProcess(token: string): Promise<FetchResult> {
  try {
    const res = await fetch(`${API_URL}/api/public/c/${token}`, {
      cache: 'no-store',
      headers: { ...getDashboardEnvironmentHeaders() },
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
  AZUL:         'Azul Seguro Auto',
  MITSUI_SUMITOMO: 'Mitsui Sumitomo Seguros',
  ITAU:         'Itaú Seguro Auto',
  TOKIO_MARINE: 'Tokio Marine',
  SULAMERICA:   'SulAmérica',
  SUHAI:        'Suhai',
  ALIRO:        'Aliro',
  ALLIANZ:      'Allianz',
  YELLOW:       'Yellow Seguros',
}

function isDentalOnlyHealthOption(opt: HealthQuoteOption): boolean {
  const hasDentalEvidence =
    (opt.dental.source !== 'not_found' && opt.dental.value !== null) ||
    /\b(dental|odonto)\b/i.test(opt.planName)
  const medicalFieldsAbsent =
    opt.accommodation.source === 'not_found' &&
    opt.coparticipation.source === 'not_found' &&
    opt.reimbursementMode.source === 'not_found'
  return hasDentalEvidence && medicalFieldsAbsent
}

function isHealthQuoteDraftLike(value: unknown): value is HealthQuoteDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const draft = value as Partial<HealthQuoteDraft>
  return Array.isArray(draft.lives)
    && Array.isArray(draft.quoteOptions)
    && (draft.reviewStatus === 'pending'
      || draft.reviewStatus === 'in_review'
      || draft.reviewStatus === 'confirmed')
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

// ─── Catalog tooltips (static, from insurer portal knowledge — not from PDF) ──

const TOKIO_ASSIST_TOOLTIP: Record<string, string> = {
  Completa: '200 km de reboque com possibilidade de ampliação, mecânico, transporte para retorno ao domicílio, hospedagem, chaveiro, entre outros.',
  VIP: 'Cobertura Completa + 2 utilizações para pane, 2 dias de carro reserva para pane, higienização do veículo, serviço de leva e traz do carro reserva, reparos residenciais, entre outros.',
}

const TOKIO_GLASS_TOOLTIP: Record<string, string> = {
  Básico: 'Reparo do para-brisa quando possível ou reposição dos vidros laterais, para-brisa e traseiro.',
  Completo: 'Garantias do plano Básico + faróis, lanternas, retrovisores, máquina dos vidros, teto solar e panorâmico.',
}

const BRADESCO_GLASS_TOOLTIP: Record<string, string> = {
  'Reparo de Para-Brisa': 'Reparo do para-brisa quando possível.',
  'Vidro Protegido': 'Para-brisa e vidros laterais.',
  'Vidro Protegido Plus': 'Todos os vidros (para-brisa, laterais, traseiro) + faróis, lanternas e teto solar.',
  'Vidro Protegido Plus Logomarca': 'Todos os vidros (para-brisa, laterais, traseiro) + faróis, lanternas e teto solar, com aplicação de logomarca nos vidros.',
  'Vidro Protegido Premium': 'Proteção premium de vidros.',
  'Vidro Protegido Premium Logomarca': 'Proteção premium de vidros com aplicação de logomarca.',
}

const BRADESCO_ASSIST_TOOLTIP: Record<string, string> = {
  '043': 'Assist Dia/Noite 200 km — guincho, pane seca, chaveiro, troca de pneu.',
  '063': 'Assist Dia/Noite 100 km — guincho, pane seca, chaveiro, troca de pneu.',
  '108': 'Assist Dia/Noite ilimitado — guincho, pane seca, chaveiro, troca de pneu.',
  '113': 'Assist Auto Dia/Noite Passeio 400 km — guincho, pane seca, chaveiro, troca de pneu.',
}

function extractBradescoClauseCode(planName: string | undefined): string | undefined {
  if (!planName) return undefined
  const match = planName.match(/\((\d+)\)/)
  return match ? match[1] : undefined
}

function assistTooltip(insurer: string, planName: string | undefined): string | undefined {
  if (insurer === 'TOKIO_MARINE' && planName) return TOKIO_ASSIST_TOOLTIP[planName]
  if (insurer === 'BRADESCO') {
    const code = extractBradescoClauseCode(planName)
    return code ? BRADESCO_ASSIST_TOOLTIP[code] : undefined
  }
  return undefined
}

function glassTooltip(insurer: string, tier: string | undefined): string | undefined {
  if (insurer === 'TOKIO_MARINE' && tier) return TOKIO_GLASS_TOOLTIP[tier]
  if (insurer === 'BRADESCO' && tier) return BRADESCO_GLASS_TOOLTIP[tier]
  return undefined
}

// Strips leading "Vidro " from Bradesco tier labels to avoid "Vidros Vidro Protegido Plus" repetition.
function formatGlassTierLabel(tier: string): string {
  return tier.startsWith('Vidro ') ? tier.slice(6) : tier
}

// Complement text (non-km services) for Tokio plans — used to build rich titles with km breakdown.
const TOKIO_ASSIST_SERVICES: Record<string, string> = {
  Completa: 'mecânico, transporte para retorno ao domicílio, hospedagem, chaveiro, entre outros',
  VIP: '2 utilizações para pane, 2 dias de carro reserva para pane, higienização do veículo, serviço de leva e traz do carro reserva, reparos residenciais, entre outros',
}

type AssistDetails = NonNullable<NonNullable<AutoQuoteData['coverageDetails']>['assistance']>

function buildAssistTitle(
  insurer: string,
  assist: AssistDetails | undefined,
): string | undefined {
  if (!assist?.planName) return undefined
  const catalogText = assistTooltip(insurer, assist.planName)
  if (!catalogText) return undefined

  const { towingKmBase: base, towingKmAdditional: add, towingKmTotal: total } = assist
  if (base != null && add != null && total != null) {
    const services = TOKIO_ASSIST_SERVICES[assist.planName]
    const servicesText = services ? ` Inclui também: ${services}.` : ''
    return `Plano ${assist.planName}: ${base} km padrão + ${add} km adicional = ${total} km.${servicesText}`
  }

  return catalogText
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
      const sj = m.installments.filter((i) => {
        if (i.hasInterest != null) return !i.hasInterest
        return Math.abs((i.total ?? i.amount * i.number) - premiumTotal) <= tolerance
      })
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
          {quote.name
            ? quote.name.replace(/\s*—\s*\(R\$[^)]*\)\s*$/, '').trim()
            : (INSURER_LABELS[quote.insurer] ?? quote.insurer)}
        </span>
        {vehicleLabel && (
          <span className="text-xs text-white/70 truncate max-w-[140px]">{vehicleLabel}</span>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">

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
        {(d.coverage || d.coverageDetails) && (
          <div className="flex flex-wrap gap-1.5">
            {d.coverage?.vehicle?.fipePercentage != null && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]">
                {d.coverage.vehicle.fipePercentage}% FIPE
              </span>
            )}
            {quote.insurer === 'BRADESCO' && d.coverage?.vehicle?.deductibleType && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]">
                Franquia {d.coverage.vehicle.deductibleType}
              </span>
            )}
            {d.coverage?.rcf?.propertyDamage != null && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]">
                RCF {fmt(d.coverage.rcf.propertyDamage)}
              </span>
            )}
            {d.coverage?.assistance?.towing && (() => {
              const assistTitle = buildAssistTitle(quote.insurer, d.coverageDetails?.assistance)
              const label = [
                'Assistência 24h',
                d.coverageDetails?.assistance?.planName,
                d.coverageDetails?.assistance?.towingKmTotal
                  ? `${d.coverageDetails.assistance.towingKmTotal} km`
                  : undefined,
              ].filter(Boolean).join(' · ')
              return (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]"
                  title={assistTitle ?? undefined}
                >
                  {label}{assistTitle ? ' ⓘ' : ''}
                </span>
              )
            })()}
            {d.coverage?.assistance?.glassProtection === true && d.coverageDetails?.glass?.tier && (() => {
              const tier = d.coverageDetails!.glass!.tier!
              const glassTitle = glassTooltip(quote.insurer, tier)
              const glassLabel = formatGlassTierLabel(tier)
              return (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]"
                  title={glassTitle ?? undefined}
                >
                  Vidros: {glassLabel}{glassTitle ? ' ⓘ' : ''}
                </span>
              )
            })()}
            {d.coverage?.assistance?.glassProtection === false && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#9a9590] line-through">
                Vidros não contratado
              </span>
            )}
            {d.coverage?.assistance?.replacementVehicle === true && d.coverage.assistance.replacementDays != null && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]">
                Reserva {d.coverage.assistance.replacementDays}d
              </span>
            )}
            {d.coverage?.assistance?.replacementVehicle === false && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#9a9590] line-through">
                Sem veículo reserva
              </span>
            )}
            {d.coverageDetails?.services?.martelinho != null && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] ${d.coverageDetails.services.martelinho ? 'text-[#5a5750]' : 'text-[#9a9590] line-through'}`}>
                Martelinho
              </span>
            )}
            {d.coverageDetails?.services?.repareFacil != null && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] ${d.coverageDetails.services.repareFacil ? 'text-[#5a5750]' : 'text-[#9a9590] line-through'}`}>
                Reparo rápido
              </span>
            )}
            {d.coverageDetails?.services?.trocaParaChoque != null && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] ${d.coverageDetails.services.trocaParaChoque ? 'text-[#5a5750]' : 'text-[#9a9590] line-through'}`}>
                Troca de para-choque
              </span>
            )}
            {d.coverageDetails?.services?.latariaEPintura != null && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] ${d.coverageDetails.services.latariaEPintura ? 'text-[#5a5750]' : 'text-[#9a9590] line-through'}`}>
                Lataria e pintura
              </span>
            )}
            {d.coverageDetails?.services?.rodaPneuSuspensao != null && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] ${d.coverageDetails.services.rodaPneuSuspensao ? 'text-[#5a5750]' : 'text-[#9a9590] line-through'}`}>
                Roda/pneu
              </span>
            )}
            {d.coverageDetails?.services?.logoMarcaVidros != null && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] ${d.coverageDetails.services.logoMarcaVidros ? 'text-[#5a5750]' : 'text-[#9a9590] line-through'}`}>
                Logomarca
              </span>
            )}
            {d.coverageDetails?.repair?.shopType && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]">
                {d.coverageDetails.repair.shopType}
              </span>
            )}
            {d.coverageDetails?.repair?.partsType && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]">
                {d.coverageDetails.repair.partsType}
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

  if (process.product === 'HEALTH') {
    const draft = quotes[0]?.extractedData
    if (!isHealthQuoteDraftLike(draft)) return <ErrorPage status={500} />
    return (
      <div className="min-h-screen bg-[#f4f2ee]">
        <QuoteTracker processId={process.id} />
        <header className="px-5 py-4" style={{ background: brand }}>
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoUrl} alt={company.displayName} className="h-8 max-w-[80px] object-contain shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-xs font-extrabold text-white" style={{ background: 'rgba(255,255,255,0.18)' }}>
                  {company.displayName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold text-white truncate">{company.displayName}</span>
            </div>
            <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Válido até {fmtDate(process.expiresAt)}
            </span>
          </div>
        </header>
        <HealthPublicView draft={draft} process={process} company={company} brand={brand} whatsappUrl={whatsappUrl} />
        <footer className="mt-4" style={{ background: brand }}>
          <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
            <div className="flex items-center gap-3">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoUrl} alt={company.displayName} className="h-10 max-w-[90px] object-contain shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-extrabold" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                  {company.displayName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-white text-sm leading-tight">{company.displayName}</p>
                {company.bio && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{company.bio}</p>}
              </div>
            </div>
            {(company.contactEmail || company.instagram || company.website) && (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {company.contactEmail && (
                  <a href={`mailto:${company.contactEmail}`} className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    <IconEmail />{company.contactEmail}
                  </a>
                )}
                {company.instagram && (
                  <a href={`https://instagram.com/${company.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    <IconInstagram />{company.instagram}
                  </a>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    <IconGlobe />{company.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            )}
            {(company.street || company.city) && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {[company.street, company.neighborhood, company.city && company.state ? `${company.city} — ${company.state}` : company.city || company.state, company.zipCode].filter(Boolean).join(' · ')}
              </p>
            )}
            <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Cotação gerada via <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Corretor no Flow</strong>
            </p>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      <QuoteTracker processId={process.id} />

      {/* Header da corretora */}
      <header className="px-5 py-4" style={{ background: brand }}>
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt={company.displayName}
                className="h-8 max-w-[80px] object-contain shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-xs font-extrabold text-white"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                {company.displayName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold text-white truncate">{company.displayName}</span>
          </div>
          <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }}>
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

      {/* Cards de cotação — agrupados por seguradora */}
      <div className="max-w-lg mx-auto px-5 py-4 space-y-6">
        {Object.entries(
          quotes.reduce<Record<string, typeof quotes>>((acc, q) => {
            if (!acc[q.insurer]) acc[q.insurer] = []
            acc[q.insurer].push(q)
            return acc
          }, {}),
        ).map(([insurer, group]) => (
          <div key={insurer} className="space-y-3">
            {group.length > 1 && (
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9a9590] px-1">
                {INSURER_LABELS[insurer] ?? insurer}
              </p>
            )}
            {group.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} token={token} brand={brand} />
            ))}
          </div>
        ))}
      </div>

      {/* Rodapé — identidade e contato do corretor */}
      <footer className="mt-4" style={{ background: brand }}>
        <div className="max-w-lg mx-auto px-5 py-6 space-y-5">

          {/* Logo + nome + bio */}
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt={company.displayName}
                className="h-10 max-w-[90px] object-contain shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-extrabold"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                {company.displayName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-white text-sm leading-tight">{company.displayName}</p>
              {company.bio && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {company.bio}
                </p>
              )}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full rounded-xl py-3 text-sm font-semibold transition-colors"
            style={{ background: '#25D366', color: '#fff' }}
          >
            <IconWhatsApp />
            Falar pelo WhatsApp
          </a>

          {/* Contatos secundários */}
          {(company.contactEmail || company.instagram || company.website) && (
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {company.contactEmail && (
                <a
                  href={`mailto:${company.contactEmail}`}
                  className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  <IconEmail />
                  {company.contactEmail}
                </a>
              )}
              {company.instagram && (
                <a
                  href={`https://instagram.com/${company.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  <IconInstagram />
                  {company.instagram}
                </a>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  <IconGlobe />
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}

          {/* Endereço */}
          {(company.street || company.city) && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {[
                company.street,
                company.neighborhood,
                company.city && company.state
                  ? `${company.city} — ${company.state}`
                  : company.city || company.state,
                company.zipCode,
              ].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Powered by */}
          <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Cotação gerada via <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Corretor no Flow</strong>
          </p>
        </div>
      </footer>

    </div>
  )
}

// ─── HealthPublicView ─────────────────────────────────────────────────────────

function healthSourceLabel(type: HealthQuoteOption['sourceType']): string {
  if (type === 'portal_pdf')  return 'PDF'
  if (type === 'manual_table') return 'Tabela manual'
  return 'Planilha'
}

function HealthOptionCard({ opt, brand }: { opt: HealthQuoteOption; brand: string }) {
  const tags: string[] = []
  const publicFields = [
    { label: 'acomodação', field: opt.accommodation },
    { label: 'coparticipação', field: opt.coparticipation },
    { label: 'reembolso', field: opt.reimbursementMode },
    { label: 'odonto', field: opt.dental },
    { label: 'validade', field: opt.validUntil },
  ] as const

  if (opt.accommodation.value && !opt.accommodation.needsReview) {
    tags.push(opt.accommodation.value)
  }
  if (opt.coparticipation.value && !opt.coparticipation.needsReview) {
    tags.push(opt.coparticipation.value)
  }
  if (opt.validUntil.value && !opt.validUntil.needsReview) {
    tags.push(`válido até ${opt.validUntil.value}`)
  }

  const unconfirmedFields = publicFields
    .filter(({ field }) => field.needsReview)
    .map(({ label, field }) => field.value ? `${label} (${field.value})` : label)

  return (
    <div className="bg-white rounded-xl border border-[#e2dfd8] overflow-hidden shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: brand }}>
        <div>
          <p className="text-sm font-bold text-white leading-tight">{opt.carrierOrOperator}</p>
          <p className="text-xs text-white/70 mt-0.5">{opt.planName}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/50 mb-0.5">{healthSourceLabel(opt.sourceType)}</p>
          {opt.monthlyTotal != null && (
            <p className="text-lg font-extrabold text-white">{fmt(opt.monthlyTotal)}<span className="text-xs font-normal opacity-60">/mês</span></p>
          )}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="px-4 py-2.5 flex flex-wrap gap-1.5 border-b border-[#e2dfd8]">
          {tags.map((t) => (
            <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f4f2ee] text-[#5a5750]">{t}</span>
          ))}
        </div>
      )}

      {(opt.warnings?.length ?? 0) > 0 && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
          {opt.warnings!.map((w, i) => (
            <p key={i} className="text-[10px] text-amber-700">⚠ {w}</p>
          ))}
        </div>
      )}

      {unconfirmedFields.length > 0 && (
        <div className="px-4 py-2 bg-[#f9f8f6]">
          <p className="text-[10px] text-[#9a9590]">
            {unconfirmedFields.join(', ')} {unconfirmedFields.length > 1 ? 'não confirmados' : 'não confirmado'} — consulte o corretor
          </p>
        </div>
      )}
    </div>
  )
}

function HealthPublicView({
  draft,
  process,
  company,
  brand,
  whatsappUrl,
}: {
  draft: HealthQuoteDraft
  process: PublicProcessResponse['process']
  company: PublicProcessResponse['company']
  brand: string
  whatsappUrl: string
}) {
  const { lives, warnings = [] } = draft
  const medicalOptions = draft.quoteOptions.filter((o) => !isDentalOnlyHealthOption(o))
  const dentalAddons = draft.quoteOptions.filter(isDentalOnlyHealthOption)
  const withTotals = medicalOptions.filter((o) => o.monthlyTotal != null)

  return (
    <>
      {/* Saudação */}
      <div className="max-w-lg mx-auto px-5 pt-6 pb-2">
        <h1 className="text-xl font-bold text-[#1a1814]">
          {process.clientName
            ? <>Olá, <span style={{ color: brand }}>{process.clientName.split(' ')[0]}</span>!</>
            : 'Sua cotação de saúde está pronta!'}
        </h1>
        <p className="text-sm text-[#5a5750] mt-1">
          Preparamos {medicalOptions.length} opç{medicalOptions.length !== 1 ? 'ões' : 'ão'} de plano
          {dentalAddons.length > 0 && ` + ${dentalAddons.length} adicional${dentalAddons.length !== 1 ? 'is' : ''} odonto`}
          {lives.length > 0 && <> para <strong>{lives.length} beneficiário{lives.length !== 1 ? 's' : ''}</strong></>}.
          Compare e fale com {company.displayName.split(' ')[0]} para contratar.
        </p>
      </div>

      {/* Resumo de vidas */}
      {lives.length > 0 && (
        <div className="max-w-lg mx-auto px-5 py-3">
          <div className="bg-white rounded-xl border border-[#e2dfd8] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#e2dfd8] bg-[#f9f8f6]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9590]">
                Beneficiários — {lives.length} pessoa{lives.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="divide-y divide-[#f4f2ee]">
              {lives.map((life, i) => {
                const label = life.name ?? life.label ?? life.relationship ?? `Beneficiário ${i + 1}`
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-[#1a1814]">{label}</span>
                    <span className="text-xs text-[#9a9590]">{life.age} anos{life.relationship ? ` · ${life.relationship}` : ''}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Opções médicas */}
      <div className="max-w-lg mx-auto px-5 py-3 space-y-3">
        {medicalOptions.map((opt, i) => (
          <HealthOptionCard key={`${opt.carrierOrOperator}-${opt.planName}-${i}`} opt={opt} brand={brand} />
        ))}
      </div>

      {/* Adicionais odonto */}
      {dentalAddons.length > 0 && (
        <div className="max-w-lg mx-auto px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9a9590] mb-2">
            Adicionais Odonto
          </p>
          <div className="space-y-2">
            {dentalAddons.map((opt, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e2dfd8] overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1a1814]">{opt.planName}</p>
                    <p className="text-xs text-[#9a9590]">{opt.carrierOrOperator}</p>
                  </div>
                  {opt.monthlyTotal != null && opt.monthlyTotal > 0 && (
                    <p className="text-sm font-bold tabular-nums" style={{ color: brand }}>
                      {fmt(opt.monthlyTotal)}<span className="text-xs font-normal text-[#9a9590]">/mês</span>
                    </p>
                  )}
                </div>
                {(opt.dental.value || opt.validUntil.value) && (
                  <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#f4f2ee] pt-2">
                    {opt.dental.value && (
                      <span className="text-xs text-[#5a5750]">Cobertura: {opt.dental.value}</span>
                    )}
                    {opt.validUntil.value && (
                      <span className="text-xs text-[#5a5750]">Válido até {fmtDate(opt.validUntil.value)}</span>
                    )}
                  </div>
                )}
                {(opt.warnings?.length ?? 0) > 0 && (
                  <div className="px-4 pb-3 space-y-1 border-t border-[#f4f2ee] pt-2">
                    {opt.warnings!.map((w, wi) => (
                      <p key={wi} className="text-xs text-[#92400e] leading-relaxed">⚠ {w}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparativo de totais */}
      {withTotals.length > 1 && (
        <div className="max-w-lg mx-auto px-5 py-3">
          <div className="bg-white rounded-xl border border-[#e2dfd8] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#e2dfd8] bg-[#f9f8f6]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a9590]">Comparativo — total mensal</p>
            </div>
            <div className="divide-y divide-[#f4f2ee]">
              {withTotals.map((opt, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-[#5a5750]">{opt.carrierOrOperator} — {opt.planName}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: brand }}>{fmt(opt.monthlyTotal!)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Avisos draft-level */}
      {warnings.length > 0 && (
        <div className="max-w-lg mx-auto px-5 pb-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-700">⚠ {w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Aviso legal */}
      <div className="max-w-lg mx-auto px-5 pb-4">
        <p className="text-[10px] text-[#9a9590] leading-relaxed text-center">
          Valores baseados na cotação revisada pelo corretor. Rede credenciada, carências e condições de reembolso devem ser confirmadas com a operadora antes da contratação.
        </p>
      </div>

      {/* WhatsApp CTA + footer */}
      <div className="max-w-lg mx-auto px-5 pb-6">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full rounded-xl py-3.5 text-sm font-bold transition-colors"
          style={{ background: '#25D366', color: '#fff' }}
        >
          <IconWhatsApp />
          Falar com {company.displayName.split(' ')[0]} pelo WhatsApp
        </a>
      </div>
    </>
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

function IconEmail() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </svg>
  )
}
