'use client'

import { useEffect, useState } from 'react'
import type { HealthAgeBandPrice, HealthManualTableSource, HealthQuoteDraft, HealthMemberLife, HealthQuoteOption, DraftField } from '@corretor/types'
import { useGenerateHealthXlsx } from '@/hooks/quotes/use-generate-health-xlsx'
import { useGenerateHealthPdf } from '@/hooks/quotes/use-generate-health-pdf'
import { usePublishHealthDraft } from '@/hooks/quotes/use-publish-health-draft'
import { quoteProcessApi } from '@/lib/api/quote-process.api'

// ─── Fixture ──────────────────────────────────────────────────────────────────

function found(value: string): DraftField<string> {
  return { value, source: 'table_lookup', confidence: 1, needsReview: false }
}
function extracted(value: string): DraftField<string> {
  return { value, source: 'extracted', confidence: 0.9, needsReview: false }
}
function inferred(value: string): DraftField<string> {
  return { value, source: 'inferred', confidence: 0.72, needsReview: true }
}
function notFound(): DraftField<string> {
  return { value: null, source: 'not_found', confidence: 0, needsReview: true }
}

const FIXTURE: HealthQuoteDraft = {
  clientName: 'Maravilha Cestas Ltda',
  sourceFiles: [
    'PropostaComercialCuidado360_7673186-1.pdf',
    'UNIMED-OTORRINOS-tabela.xlsx',
  ],
  lives: [
    { age: 34, name: 'Ana Souza',  relationship: 'Titular',  source: 'extracted', needsReview: false },
    { age: 41, label: 'Vida 1 - 39 a 43', source: 'inferred', needsReview: true },
    { age: 9,  name: 'Lucas Souza', relationship: 'Filho',   source: 'extracted', needsReview: false },
  ],
  quoteOptions: [
    {
      sourceType: 'portal_pdf',
      carrierOrOperator: 'SulAmérica',
      planName: 'Direto Nacional Enfermaria',
      accommodation: extracted('Enfermaria'),
      coparticipation: extracted('Sem coparticipação'),
      reimbursementMode: inferred('Parcial'),
      validUntil: extracted('2026-06-27'),
      dental: notFound(),
      perLifePrices: [
        { lifeIndex: 0, price: 925.02, bandLabel: '34 a 38' },
        { lifeIndex: 1, price: 1050.01, bandLabel: '39 a 43' },
        { lifeIndex: 2, price: 800.02, bandLabel: '0 a 18' },
      ],
      monthlyTotal: 2775.05,
      warnings: ['IOF não incluído (R$ 66,04) — confirmar total ao cliente'],
    },
    {
      sourceType: 'manual_table',
      carrierOrOperator: 'Unimed PE',
      planName: 'Enfermaria',
      accommodation: found('Enfermaria'),
      coparticipation: found('Sem coparticipação'),
      reimbursementMode: notFound(),
      validUntil: found('2026-06-30'),
      dental: notFound(),
      perLifePrices: [
        { lifeIndex: 0, price: 355.00, bandLabel: '34 a 38' },
        { lifeIndex: 1, price: 430.00, bandLabel: '39 a 43' },
        { lifeIndex: 2, price: 210.00, bandLabel: '0 a 18' },
      ],
      monthlyTotal: 995.00,
    },
  ],
  warnings: ['Vida na faixa 39–43 foi criada a partir da contagem do PDF — confirme nome e dados'],
  reviewStatus: 'pending',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBrl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function sourceLabel(source: string) {
  switch (source) {
    case 'portal_pdf':        return 'PDF da seguradora'
    case 'manual_table':      return 'Tabela manual'
    case 'spreadsheet_import': return 'Planilha importada'
    default:                  return source
  }
}

/** Heurística dental-only: mesmo critério do classificador backend. */
function isDentalOnlyOption(opt: HealthQuoteOption): boolean {
  const hasDentalEvidence =
    (opt.dental.source !== 'not_found' && opt.dental.value !== null) ||
    /\b(dental|odonto)\b/i.test(opt.planName)
  const medicalFieldsAbsent =
    opt.accommodation.source === 'not_found' &&
    opt.coparticipation.source === 'not_found' &&
    opt.reimbursementMode.source === 'not_found'
  return hasDentalEvidence && medicalFieldsAbsent
}

const OBSERVATION_PATTERNS = [
  /\biof\b/i,
  /\bsusep\b/i,
  /\bans\b/i,
  /sujeit[ao]\s+a/i,
  /reajuste\s+atuarial/i,
  /\batuarial\b/i,
  /não\s+inclui/i,
  /não\s+incluído/i,
  /preços\s+sujeitos/i,
  /proposta\s+válida/i,
]

function isObservationWarning(text: string): boolean {
  return OBSERVATION_PATTERNS.some((p) => p.test(text))
}

/** Avisos de nível draft sobre composição de vidas (faixa/contagem) — somem após "Confirmar base de vidas". */
function isLifeBaseCompositionWarning(text: string): boolean {
  const t = text.toLowerCase()
  if (t.includes('vida') && t.includes('faixa')) return true
  if (t.includes('contagem') && (t.includes('pdf') || t.includes('planilha'))) return true
  if (/criad[ao]\s+a\s+partir/i.test(t) && (t.includes('contagem') || t.includes('faixa'))) return true
  if (t.includes('beneficiário') && (t.includes('contagem') || t.includes('faixa'))) return true
  return false
}

// ─── LifeBadge ────────────────────────────────────────────────────────────────

function LifeBadge({ life }: { life: HealthMemberLife }) {
  if (!life.needsReview) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Aguardando confirmação
    </span>
  )
}

// ─── SourceSummary ────────────────────────────────────────────────────────────

function SourceSummary({ draft }: { draft: HealthQuoteDraft }) {
  const files = draft.sourceFiles ?? []
  return (
    <div className="rounded-xl bg-white border border-surface-strong p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Fontes processadas</p>
        <span className="text-xs text-ink-faint">{files.length} arquivo{files.length !== 1 ? 's' : ''}</span>
      </div>
      <ul className="space-y-1.5">
        {files.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-ink-muted">
            <IconFile />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── LifeEditForm ─────────────────────────────────────────────────────────────

function LifeEditForm({
  life,
  onSave,
  onCancel,
}: {
  life: HealthMemberLife
  onSave: (updated: HealthMemberLife) => void
  onCancel: () => void
}) {
  const [name, setName]               = useState(life.name ?? '')
  const [relationship, setRelationship] = useState(life.relationship ?? '')
  const [age, setAge]                 = useState(String(life.age))

  function handleSave() {
    const parsedAge = parseInt(age, 10)
    if (isNaN(parsedAge) || parsedAge < 0) return
    onSave({
      ...life,
      name:         name.trim() || undefined,
      relationship: relationship.trim() || undefined,
      age:          parsedAge,
      needsReview:  false,
    })
  }

  const inputClass =
    'w-full rounded-lg border border-surface-strong bg-white px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-mahogany/50 focus:outline-none focus:ring-1 focus:ring-mahogany/20'

  return (
    <div className="px-5 py-3 bg-surface/40 border-b border-surface-strong space-y-3">
      <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide">Editar beneficiário</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-ink-faint">Nome <span className="text-ink-faint">(opcional)</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Maria Silva"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-ink-faint">Parentesco <span className="text-ink-faint">(opcional)</span></label>
          <input
            type="text"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Ex: Titular, Cônjuge, Filho"
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-ink-faint">Idade</label>
          <input
            type="number"
            min={0}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-surface-strong px-3 py-1.5 text-sm text-ink-muted hover:bg-surface transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!age || isNaN(parseInt(age, 10))}
          className="rounded-lg bg-mahogany px-4 py-1.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  )
}

// ─── LivesTable ───────────────────────────────────────────────────────────────

function LivesTable({
  lives,
  confirmed,
  onConfirm,
  onUpdate,
  onUnconfirm,
}: {
  lives: HealthMemberLife[]
  confirmed: boolean
  onConfirm: () => void
  onUpdate: (index: number, updated: HealthMemberLife) => void
  onUnconfirm: () => void
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const pendingCount = lives.filter((l) => l.needsReview).length
  const unnamedCount = lives.filter((l) => !l.name).length

  function handleSave(index: number, updated: HealthMemberLife) {
    onUpdate(index, updated)
    setEditingIndex(null)
    if (confirmed) onUnconfirm()
  }

  return (
    <div className="rounded-xl bg-white border border-surface-strong overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-strong">
        <p className="text-sm font-semibold text-ink">
          Encontramos {lives.length} beneficiário{lives.length !== 1 ? 's' : ''}
        </p>
        {confirmed ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
            <IconCheck size={10} />
            Base confirmada
          </span>
        ) : pendingCount > 0 ? (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
            {pendingCount} a confirmar
          </span>
        ) : null}
      </div>

      <div className="divide-y divide-surface-strong">
        {lives.map((life, i) => {
          const label = life.name ?? life.label ?? life.relationship ?? `Beneficiário ${i + 1}`
          const visuallyPending = life.needsReview && !confirmed
          const isEditing = editingIndex === i

          return (
            <div key={i}>
              <div
                className={`flex items-center gap-4 px-5 py-3 transition-colors ${visuallyPending ? 'bg-amber-50/40' : ''}`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  confirmed && life.needsReview ? 'bg-green-50 text-green-700' : 'bg-surface text-ink-muted'
                }`}>
                  {confirmed && life.needsReview ? <IconCheck size={12} /> : i + 1}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink truncate">{label}</span>
                    {!confirmed && <LifeBadge life={life} />}
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-ink-faint">
                    <span>{life.age} anos</span>
                    {life.relationship && <span>{life.relationship}</span>}
                    {life.ageBand && <span>Faixa: {life.ageBand}</span>}
                  </div>
                </div>
                <button
                  onClick={() => setEditingIndex(isEditing ? null : i)}
                  title={isEditing ? 'Fechar edição' : 'Editar beneficiário'}
                  className="shrink-0 rounded-md p-1.5 text-ink-faint hover:bg-surface hover:text-ink transition-colors"
                  aria-label={isEditing ? 'Fechar edição' : 'Editar beneficiário'}
                >
                  {isEditing ? <IconX /> : <IconEdit />}
                </button>
              </div>

              {isEditing && (
                <LifeEditForm
                  life={life}
                  onSave={(updated) => handleSave(i, updated)}
                  onCancel={() => setEditingIndex(null)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Footer: botão de confirmação ou nota pós-confirmação */}
      <div className="px-5 py-3 border-t border-surface-strong bg-surface/30">
        {confirmed ? (
          <p className="text-xs text-ink-faint flex flex-wrap items-center gap-1.5">
            <IconCheck size={12} />
            Base confirmada
            {unnamedCount > 0 && (
              <span className="text-amber-700">
                — {unnamedCount} beneficiário{unnamedCount !== 1 ? 's' : ''} sem nome individual
              </span>
            )}
            <span className="text-ink-faint/60">· Edite uma vida para rever a confirmação</span>
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-faint leading-relaxed max-w-sm">
              Confirme a composição da cotação. Nomes individuais são opcionais — o cálculo usa idades e faixas.
            </p>
            <button
              onClick={onConfirm}
              className="shrink-0 rounded-lg bg-mahogany px-4 py-2 text-sm font-semibold text-gold hover:bg-mahogany-light transition-colors"
            >
              Confirmar base de vidas
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── OptionCard ───────────────────────────────────────────────────────────────

function FieldChip({ label, field }: { label: string; field: DraftField<string> }) {
  // Sempre renderiza quando needsReview: campos not_found precisam aparecer na tela de revisão
  if (!field.value && !field.needsReview) return null
  const displayValue = field.value ?? 'não identificado'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${
      field.needsReview
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-surface-strong bg-surface/60 text-ink-muted'
    }`}>
      {field.needsReview && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />}
      {label}: {displayValue}
    </span>
  )
}

function OptionCard({ option }: { option: HealthQuoteOption }) {
  const hasWarnings = (option.warnings?.length ?? 0) > 0
  return (
    <div className="rounded-xl border border-surface-strong bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-surface/40 border-b border-surface-strong">
        <div>
          <p className="font-semibold text-sm text-ink">{option.planName}</p>
          <p className="text-xs text-ink-faint">{option.carrierOrOperator} · {sourceLabel(option.sourceType)}</p>
        </div>
        <div className="text-right">
          {option.monthlyTotal != null && (
            <p className="text-sm font-semibold text-mahogany">{fmtBrl(option.monthlyTotal)}<span className="text-xs font-normal text-ink-faint">/mês</span></p>
          )}
          {option.validUntil.value && (
            <p className="text-[10px] text-ink-faint">válido até {option.validUntil.value}</p>
          )}
        </div>
      </div>

      <div className="px-5 py-3 flex flex-wrap gap-1.5">
        <FieldChip label="Acomodação"    field={option.accommodation} />
        <FieldChip label="Coparticipação" field={option.coparticipation} />
        <FieldChip label="Reembolso"     field={option.reimbursementMode} />
        <FieldChip label="Odonto"        field={option.dental} />
      </div>

      {hasWarnings && (
        <div className="px-5 pb-3 space-y-1">
          {option.warnings!.map((w, i) => (
            <p key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
              <IconInfo size={12} className="shrink-0 mt-0.5" />
              {w}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── DentalAddonCard ─────────────────────────────────────────────────────────

function DentalAddonCard({ option }: { option: HealthQuoteOption }) {
  return (
    <div className="rounded-xl border border-surface-strong bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-blue-50/40 border-b border-surface-strong">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            Adicional Odonto
          </span>
          <div>
            <p className="font-semibold text-sm text-ink">{option.planName}</p>
            <p className="text-xs text-ink-faint">{option.carrierOrOperator} · {sourceLabel(option.sourceType)}</p>
          </div>
        </div>
        <div className="text-right">
          {option.monthlyTotal != null && option.monthlyTotal > 0 && (
            <p className="text-sm font-semibold text-mahogany">{fmtBrl(option.monthlyTotal)}<span className="text-xs font-normal text-ink-faint">/mês</span></p>
          )}
          {option.validUntil.value && (
            <p className="text-[10px] text-ink-faint">válido até {option.validUntil.value}</p>
          )}
        </div>
      </div>
      {option.dental.value && (
        <div className="px-5 py-2.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-surface-strong bg-surface/60 px-2.5 py-0.5 text-xs text-ink-muted">
            Cobertura: {option.dental.value}
          </span>
        </div>
      )}
      {(option.warnings?.length ?? 0) > 0 && (
        <div className="px-5 pb-3 space-y-1">
          {option.warnings!.map((w, i) => (
            <p key={i} className="text-xs text-ink-muted flex items-start gap-1.5">
              <IconInfo size={12} className="shrink-0 mt-0.5 text-ink-faint" />
              {w}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ComparisonMatrix ─────────────────────────────────────────────────────────

function ComparisonMatrix({ draft, livesConfirmed }: { draft: HealthQuoteDraft; livesConfirmed: boolean }) {
  const { lives } = draft
  const quoteOptions = draft.quoteOptions.filter((o) => !isDentalOnlyOption(o))

  return (
    <div className="rounded-xl bg-white border border-surface-strong overflow-hidden">
      <div className="px-5 py-3 border-b border-surface-strong">
        <p className="text-sm font-semibold text-ink">Matriz comparativa</p>
        <p className="text-xs text-ink-faint mt-0.5">Valores individuais por beneficiário e opção</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface/50 text-xs text-ink-faint">
              <th className="text-left px-5 py-2.5 font-medium">Beneficiário</th>
              <th className="text-center px-3 py-2.5 font-medium">Idade</th>
              {quoteOptions.map((opt) => (
                <th key={opt.planName} className="text-right px-4 py-2.5 font-medium whitespace-nowrap">
                  {opt.carrierOrOperator}<br />
                  <span className="font-normal">{opt.planName}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-strong">
            {lives.map((life, lifeIndex) => {
              const label = life.name ?? life.label ?? life.relationship ?? `Beneficiário ${lifeIndex + 1}`
              const rowAwaitingBase = life.needsReview && !livesConfirmed
              return (
                <tr key={lifeIndex} className={rowAwaitingBase ? 'bg-amber-50/30' : ''}>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={rowAwaitingBase ? 'text-amber-800' : 'text-ink'}>{label}</span>
                      {life.needsReview && livesConfirmed && (
                        <span className="inline-flex text-green-600" title="Base de vidas confirmada">
                          <IconCheck size={12} />
                        </span>
                      )}
                      {life.needsReview && !livesConfirmed && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Aguardando confirmação da base" />
                      )}
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5 text-ink-faint">{life.age}</td>
                  {quoteOptions.map((opt) => {
                    const entry = opt.perLifePrices?.find((p) => p.lifeIndex === lifeIndex)
                    return (
                      <td key={opt.planName} className="text-right px-4 py-2.5 tabular-nums text-ink">
                        {entry ? fmtBrl(entry.price) : <span className="text-ink-faint">—</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-surface/60 border-t-2 border-surface-strong font-semibold">
              <td className="px-5 py-2.5 text-ink" colSpan={2}>Total mensal</td>
              {quoteOptions.map((opt) => (
                <td key={opt.planName} className="text-right px-4 py-2.5 tabular-nums text-mahogany">
                  {opt.monthlyTotal != null ? fmtBrl(opt.monthlyTotal) : '—'}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ─── AlertsPanel ──────────────────────────────────────────────────────────────

// Campos médicos que não fazem sentido em opções dental-only
const MEDICAL_ONLY_FIELDS = new Set(['accommodation', 'coparticipation', 'reimbursementMode'])

function AlertsPanel({ draft, livesConfirmed }: { draft: HealthQuoteDraft; livesConfirmed: boolean }) {
  const draftActionable = (draft.warnings ?? []).filter(
    (w) => (!livesConfirmed || !isLifeBaseCompositionWarning(w)) && !isObservationWarning(w),
  )
  const draftObservations = (draft.warnings ?? []).filter(isObservationWarning)

  const optionActionableWarnings = draft.quoteOptions.flatMap((opt) =>
    (opt.warnings ?? [])
      .filter((w) => !isObservationWarning(w))
      .map((w) => ({ prefix: opt.planName, text: w })),
  )

  const optionObservations = draft.quoteOptions.flatMap((opt) =>
    (opt.warnings ?? [])
      .filter(isObservationWarning)
      .map((w) => `${opt.planName} — ${w}`),
  )

  const SENSITIVE: Array<{ key: keyof HealthQuoteOption; label: string; dentalSkip?: boolean; medicalSkip?: boolean }> = [
    { key: 'accommodation',     label: 'Acomodação',     medicalSkip: true },
    { key: 'coparticipation',   label: 'Coparticipação', medicalSkip: true },
    { key: 'reimbursementMode', label: 'Reembolso',      medicalSkip: true },
    { key: 'validUntil',        label: 'Validade'        },
    { key: 'dental',            label: 'Odonto',         dentalSkip: true  },
  ]

  const needsReviewFields = draft.quoteOptions.flatMap((opt) => {
    const isDental = isDentalOnlyOption(opt)
    return SENSITIVE.flatMap(({ key, label, dentalSkip, medicalSkip }) => {
      const field = opt[key] as DraftField<string>
      if (!field.needsReview) return []
      // Não mostrar campos médicos para opções dental-only
      if (isDental && MEDICAL_ONLY_FIELDS.has(key as string)) return []
      // Não mostrar "Odonto não identificado" para planos médicos (dental é opcional)
      if (dentalSkip && !isDental && field.source === 'not_found') return []
      const text = field.value
        ? `${label} inferido como "${field.value}" — confirmar`
        : `${label} não identificado`
      return [{ prefix: opt.planName, text }]
    })
  })

  const allAlerts = [
    ...draftActionable.map((w) => ({ prefix: null as null | string, text: w })),
    ...optionActionableWarnings,
    ...needsReviewFields,
  ]

  const allObservations = [...draftObservations, ...optionObservations]

  if (allAlerts.length === 0 && allObservations.length === 0) return null

  return (
    <div className="space-y-3">
      {allAlerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-200">
            <IconAlert size={14} />
            <p className="text-sm font-semibold text-amber-800">
              Revise os pontos destacados antes de gerar
            </p>
            <span className="ml-auto text-xs font-medium text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
              {allAlerts.length}
            </span>
          </div>
          <ul className="divide-y divide-amber-100">
            {allAlerts.map((alert, i) => (
              <li key={i} className="flex items-start gap-2.5 px-5 py-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  {alert.prefix && <span className="font-medium">{alert.prefix} — </span>}
                  {alert.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {allObservations.length > 0 && (
        <div className="rounded-xl border border-surface-strong bg-surface/40 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-strong">
            <IconInfo size={14} className="text-ink-faint" />
            <p className="text-sm font-medium text-ink-muted">Observações do contrato</p>
          </div>
          <ul className="divide-y divide-surface-strong">
            {allObservations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2.5 px-5 py-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint/40" />
                <p className="text-xs text-ink-muted leading-relaxed">{obs}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Helpers para export ──────────────────────────────────────────────────────

const SENSITIVE_OPTION_FIELDS = [
  'accommodation',
  'coparticipation',
  'reimbursementMode',
  'validUntil',
  'dental',
] as const

/**
 * Quando livesConfirmed=true, o corretor aceitou a composição de vidas:
 * - A origem técnica das vidas é preservada para auditoria.
 * - Warnings de composição de base são removidos do draft exportado.
 * - Pendências de campos de plano (reimbursementMode etc.) permanecem intactas.
 * - quoteOptions é preservado integralmente — cada destino (PDF, XLSX, link) faz
 *   seu próprio agrupamento de dental-only via isDentalOnlyOption.
 */
function buildDraftForExport(draft: HealthQuoteDraft, livesConfirmed: boolean): HealthQuoteDraft {
  if (!livesConfirmed) return draft
  return {
    ...draft,
    warnings: (draft.warnings ?? []).filter((w) => !isLifeBaseCompositionWarning(w)),
  }
}

function countPendingItems(draft: HealthQuoteDraft, livesConfirmed: boolean): number {
  const pendingLives = livesConfirmed ? 0 : draft.lives.filter((l) => l.needsReview).length
  const pendingFields = draft.quoteOptions.reduce((acc, opt) => {
    const isDental = isDentalOnlyOption(opt)
    return acc + SENSITIVE_OPTION_FIELDS.filter((k) => {
      const field = opt[k] as DraftField<string>
      if (!field.needsReview) return false
      // Não conta campos médicos para dental-only nem dental para médico
      if (isDental && MEDICAL_ONLY_FIELDS.has(k)) return false
      if (!isDental && k === 'dental' && field.source === 'not_found') return false
      return true
    }).length
  }, 0)
  return pendingLives + pendingFields
}

// ─── ActionBar ────────────────────────────────────────────────────────────────

function ActionBar({ draft, livesConfirmed }: { draft: HealthQuoteDraft; livesConfirmed: boolean }) {
  const { status, generate, reset } = useGenerateHealthXlsx()
  const { status: pdfStatus, generate: generatePdf, reset: resetPdf } = useGenerateHealthPdf()
  const { status: linkStatus, publish: publishLink, reset: resetLink } = usePublishHealthDraft()
  const [confirmingXlsx, setConfirmingXlsx] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const totalPending = countPendingItems(draft, livesConfirmed)
  const isLoading = status.kind === 'loading'
  const isPdfLoading = pdfStatus.kind === 'loading'
  const isLinkLoading = linkStatus.kind === 'loading'

  function handleXlsxClick() {
    if (status.kind === 'error') {
      reset()
      return
    }
    if (totalPending > 0 && !confirmingXlsx) {
      setConfirmingXlsx(true)
      return
    }
    setConfirmingXlsx(false)
    const draftForExport = buildDraftForExport(draft, livesConfirmed)
    const hasAcceptedPendingLives = livesConfirmed && draft.lives.some((l) => l.needsReview)
    generate(draftForExport, totalPending > 0 || hasAcceptedPendingLives)
  }

  function handleCancelConfirm() {
    setConfirmingXlsx(false)
  }

  return (
    <div className="rounded-xl bg-white border border-surface-strong overflow-hidden">
      <div className="px-5 py-4 flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Gerar saída</p>
          <p className="text-xs text-ink-faint mt-0.5">
            {linkStatus.kind === 'success'
              ? 'Link público gerado — envie ao cliente pelo WhatsApp ou e-mail'
              : linkStatus.kind === 'error'
              ? linkStatus.message
              : status.kind === 'success'
              ? 'Planilha gerada com sucesso — verifique seus downloads'
              : status.kind === 'error'
              ? status.message
              : livesConfirmed
              ? 'Base de vidas confirmada; revise os campos dos planos antes de gerar'
              : 'Revise os pontos acima antes de gerar'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleXlsxClick}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              status.kind === 'success'
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : status.kind === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : isLoading
                ? 'border-surface-strong bg-surface/60 text-ink-faint cursor-not-allowed'
                : 'border-mahogany/30 bg-mahogany/5 text-mahogany hover:bg-mahogany/10'
            }`}
          >
            {isLoading ? <IconSpinner /> : status.kind === 'success' ? <IconCheck size={14} /> : <IconSpreadsheet />}
            {isLoading ? 'Gerando…' : status.kind === 'success' ? 'Gerada' : 'Gerar planilha'}
          </button>
          <button
            onClick={() => {
              if (pdfStatus.kind === 'error') { resetPdf(); return }
              const draftForExport = buildDraftForExport(draft, livesConfirmed)
              generatePdf(draftForExport)
            }}
            disabled={isPdfLoading}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              pdfStatus.kind === 'success'
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : pdfStatus.kind === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : isPdfLoading
                ? 'border-surface-strong bg-surface/60 text-ink-faint cursor-not-allowed'
                : 'border-surface-strong bg-surface/60 text-ink-muted hover:border-mahogany/30 hover:text-mahogany hover:bg-mahogany/5'
            }`}
          >
            {isPdfLoading ? <IconSpinner /> : pdfStatus.kind === 'success' ? <IconCheck size={14} /> : <IconPdf />}
            {isPdfLoading ? 'Gerando…' : pdfStatus.kind === 'success' ? 'PDF gerado' : 'Gerar PDF'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (linkStatus.kind === 'error') {
                resetLink()
                return
              }
              setLinkCopied(false)
              void publishLink(buildDraftForExport(draft, livesConfirmed))
            }}
            disabled={isLinkLoading}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              linkStatus.kind === 'success'
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : linkStatus.kind === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : isLinkLoading
                ? 'border-surface-strong bg-surface/60 text-ink-faint cursor-not-allowed'
                : 'border-surface-strong bg-surface/60 text-ink-muted hover:border-mahogany/30 hover:text-mahogany hover:bg-mahogany/5'
            }`}
          >
            {isLinkLoading ? <IconSpinner /> : linkStatus.kind === 'success' ? <IconCheck size={14} /> : <IconLink />}
            {isLinkLoading ? 'Gerando…' : linkStatus.kind === 'success' ? 'Link pronto' : 'Gerar link'}
          </button>
        </div>
      </div>

      {linkStatus.kind === 'success' && (
        <div className="border-t border-surface-strong bg-surface/30 px-5 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="flex-1 truncate text-xs font-mono text-ink">{linkStatus.publicUrl}</span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(linkStatus.publicUrl).then(() => {
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 2000)
                })
              }}
              className="rounded-lg border border-surface-strong px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-mahogany/40 hover:text-ink transition-colors"
            >
              {linkCopied ? '✓ Copiado' : 'Copiar'}
            </button>
            <a
              href={linkStatus.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-mahogany px-3 py-1.5 text-xs font-semibold text-gold hover:bg-mahogany-light transition-colors"
            >
              Abrir
            </a>
          </div>
        </div>
      )}

      {/* Painel de confirmação para pendências */}
      {confirmingXlsx && (
        <div className="border-t border-amber-200 bg-amber-50 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-amber-800 leading-relaxed max-w-sm">
            <span className="font-semibold">{totalPending} item{totalPending !== 1 ? 's' : ''} pendente{totalPending !== 1 ? 's' : ''} de revisão.</span>{' '}
            Gerar mesmo assim? Os valores serão incluídos com as anotações de revisão na aba Notas.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCancelConfirm}
              className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleXlsxClick}
              className="rounded-lg bg-mahogany px-3 py-1.5 text-xs font-semibold text-gold hover:bg-mahogany-light transition-colors"
            >
              Gerar mesmo assim
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AddByTablePanel ──────────────────────────────────────────────────────────

type BandRow = { bandLabel: string; minAge: string; maxAge: string; pricePerLife: string }
type TableFormPhase = 'idle' | 'loading' | 'error'

const EMPTY_BAND: BandRow = { bandLabel: '', minAge: '', maxAge: '', pricePerLife: '' }

function AddByTablePanel({
  lives,
  onAdd,
}: {
  lives: HealthMemberLife[]
  onAdd: (option: HealthQuoteOption) => void
}) {
  const [open, setOpen]           = useState(false)
  const [phase, setPhase]         = useState<TableFormPhase>('idle')
  const [errorMsg, setErrorMsg]   = useState<string | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [planName, setPlanName]   = useState('')
  const [accommodation, setAccommodation] = useState('')
  const [coparticipation, setCoparticipation] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [bands, setBands]         = useState<BandRow[]>([{ ...EMPTY_BAND }])

  function addBand() { setBands((b) => [...b, { ...EMPTY_BAND }]) }
  function removeBand(i: number) { setBands((b) => b.filter((_, idx) => idx !== i)) }
  function updateBand(i: number, field: keyof BandRow, value: string) {
    setBands((b) => b.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  function reset() {
    setSourceName(''); setPlanName(''); setAccommodation(''); setCoparticipation('')
    setValidUntil(''); setBands([{ ...EMPTY_BAND }]); setPhase('idle'); setErrorMsg(null)
  }

  const inputClass = 'w-full rounded-lg border border-surface-strong bg-white px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-mahogany/50 focus:outline-none focus:ring-1 focus:ring-mahogany/20'

  const parsedBands: HealthAgeBandPrice[] = bands
    .filter((b) => b.bandLabel && b.minAge !== '' && b.maxAge !== '' && b.pricePerLife !== '')
    .map((b) => ({
      bandLabel:    b.bandLabel,
      minAge:       parseInt(b.minAge, 10),
      maxAge:       parseInt(b.maxAge, 10),
      pricePerLife: parseFloat(b.pricePerLife),
    }))

  const canApply = sourceName.trim() && planName.trim() && parsedBands.length > 0 && phase !== 'loading'

  async function handleApply() {
    if (!canApply) return
    setPhase('loading'); setErrorMsg(null)
    const table: HealthManualTableSource = {
      sourceName: sourceName.trim(),
      planName:   planName.trim(),
      accommodation:   accommodation.trim() || undefined,
      coparticipation: coparticipation.trim() || undefined,
      validUntil:      validUntil.trim() || undefined,
      ageBandPrices:   parsedBands,
      reviewedByBroker: true,
    }
    try {
      const option = await quoteProcessApi.applyHealthTable(table, lives)
      onAdd(option)
      reset()
      setOpen(false)
    } catch (err) {
      setPhase('error')
      setErrorMsg(err instanceof Error ? err.message : 'Não foi possível aplicar a tabela')
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-surface-strong overflow-hidden">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 text-sm text-ink-muted hover:text-mahogany hover:bg-mahogany/3 transition-colors"
        >
          <IconPlus />
          Adicionar opção por tabela manual
        </button>
      ) : (
        <div className="bg-white">
          <div className="flex items-center justify-between px-5 py-3 border-b border-surface-strong">
            <p className="text-sm font-semibold text-ink">Nova opção — tabela manual</p>
            <button
              onClick={() => { setOpen(false); reset() }}
              className="text-ink-faint hover:text-ink transition-colors"
              aria-label="Fechar"
            >
              <IconX />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-ink-faint">Operadora / seguradora <span className="text-red-400">*</span></label>
                <input type="text" value={sourceName} onChange={(e) => setSourceName(e.target.value)}
                  placeholder="Ex: Unimed PE" className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-faint">Nome do plano <span className="text-red-400">*</span></label>
                <input type="text" value={planName} onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Ex: Enfermaria sem copart." className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-faint">Acomodação</label>
                <input type="text" value={accommodation} onChange={(e) => setAccommodation(e.target.value)}
                  placeholder="Ex: Enfermaria" className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-faint">Coparticipação</label>
                <input type="text" value={coparticipation} onChange={(e) => setCoparticipation(e.target.value)}
                  placeholder="Ex: Sem coparticipação" className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-ink-faint">Vigência até</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                  className={inputClass} />
              </div>
            </div>

            {/* Age band table */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide">Faixas etárias e preços</p>
              <div className="rounded-lg border border-surface-strong overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface/60 text-ink-faint">
                      <th className="text-left px-3 py-2 font-medium">Rótulo</th>
                      <th className="text-center px-3 py-2 font-medium">Idade mín.</th>
                      <th className="text-center px-3 py-2 font-medium">Idade máx.</th>
                      <th className="text-right px-3 py-2 font-medium">Preço / vida (R$)</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-strong">
                    {bands.map((band, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">
                          <input type="text" value={band.bandLabel} onChange={(e) => updateBand(i, 'bandLabel', e.target.value)}
                            placeholder="0 a 18" className="w-full rounded border border-surface-strong px-2 py-1 text-xs text-ink bg-white focus:border-mahogany/40 focus:outline-none" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={0} max={120} value={band.minAge} onChange={(e) => updateBand(i, 'minAge', e.target.value)}
                            placeholder="0" className="w-20 rounded border border-surface-strong px-2 py-1 text-xs text-ink bg-white text-center focus:border-mahogany/40 focus:outline-none" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={0} max={999} value={band.maxAge} onChange={(e) => updateBand(i, 'maxAge', e.target.value)}
                            placeholder="18" className="w-20 rounded border border-surface-strong px-2 py-1 text-xs text-ink bg-white text-center focus:border-mahogany/40 focus:outline-none" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={0} step={0.01} value={band.pricePerLife} onChange={(e) => updateBand(i, 'pricePerLife', e.target.value)}
                            placeholder="210.00" className="w-28 rounded border border-surface-strong px-2 py-1 text-xs text-ink bg-white text-right focus:border-mahogany/40 focus:outline-none" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {bands.length > 1 && (
                            <button onClick={() => removeBand(i)}
                              className="text-ink-faint hover:text-red-500 transition-colors" aria-label="Remover faixa">
                              <IconX />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-3 py-2 border-t border-surface-strong bg-surface/30">
                  <button onClick={addBand}
                    className="flex items-center gap-1 text-xs text-ink-muted hover:text-mahogany transition-colors">
                    <IconPlus size={12} />
                    Adicionar faixa
                  </button>
                </div>
              </div>
            </div>

            {/* Error */}
            {phase === 'error' && errorMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={() => { setOpen(false); reset() }}
                className="rounded-lg border border-surface-strong px-3 py-1.5 text-sm text-ink-muted hover:bg-surface transition-colors">
                Cancelar
              </button>
              <button onClick={handleApply} disabled={!canApply}
                className="inline-flex items-center gap-1.5 rounded-lg bg-mahogany px-4 py-1.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {phase === 'loading' && <IconSpinner />}
                {phase === 'loading' ? 'Aplicando…' : 'Aplicar tabela'}
              </button>
            </div>
          </div>
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

function IconFile() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function IconInfo({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function IconAlert({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconSpreadsheet() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
}

function IconPdf() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function IconLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function IconPlus({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// ─── Session storage key (shared with upload page) ───────────────────────────

const HEALTH_DRAFT_SESSION_KEY = 'health-draft-pending'

/** Lê o draft sem apagar a chave — evita Strict Mode (inicializador do useState pode rodar 2x) consumir o storage na 1ª passagem e cair na fixture na 2ª. */
function readDraftFromSessionStorage(): HealthQuoteDraft {
  if (typeof window === 'undefined') return FIXTURE
  try {
    const raw = sessionStorage.getItem(HEALTH_DRAFT_SESSION_KEY)
    if (!raw) return FIXTURE
    return JSON.parse(raw) as HealthQuoteDraft
  } catch {
    return FIXTURE
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthReviewPage() {
  const [baseDraft]                     = useState<HealthQuoteDraft>(readDraftFromSessionStorage)
  const [lives, setLives]               = useState<HealthMemberLife[]>(baseDraft.lives)
  const [livesConfirmed, setLivesConfirmed] = useState(false)
  const [extraOptions, setExtraOptions] = useState<HealthQuoteOption[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem(HEALTH_DRAFT_SESSION_KEY)) {
        sessionStorage.removeItem(HEALTH_DRAFT_SESSION_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  const draft: HealthQuoteDraft = {
    ...baseDraft,
    lives,
    quoteOptions: [...baseDraft.quoteOptions, ...extraOptions],
  }
  const medicalOptions = draft.quoteOptions.filter((o) => !isDentalOnlyOption(o))
  const dentalAddons = draft.quoteOptions.filter(isDentalOnlyOption)
  const optionsCount = medicalOptions.length
  const isFixture = baseDraft === FIXTURE

  function handleUpdateLife(index: number, updated: HealthMemberLife) {
    setLives((prev) => prev.map((l, i) => (i === index ? updated : l)))
  }

  function handleAddOption(option: HealthQuoteOption) {
    setExtraOptions((prev) => [...prev, option])
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold font-display text-ink">
            Cotação Saúde
            {draft.clientName && (
              <span className="ml-2 text-base font-normal text-ink-muted">— {draft.clientName}</span>
            )}
          </h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Montamos {optionsCount} opções de plano com {lives.length} beneficiários.{' '}
            {!livesConfirmed && lives.some((l) => l.needsReview) && 'Revise os pontos destacados antes de gerar.'}
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-surface border border-surface-strong px-3 py-1 text-xs text-ink-faint">
          Rascunho
        </div>
      </div>

      {/* Fontes */}
      <SourceSummary draft={draft} />

      {/* Alertas — antes das seções para dar contexto */}
      <AlertsPanel draft={draft} livesConfirmed={livesConfirmed} />

      {/* Vidas */}
      <LivesTable
        lives={lives}
        confirmed={livesConfirmed}
        onConfirm={() => setLivesConfirmed(true)}
        onUpdate={handleUpdateLife}
        onUnconfirm={() => setLivesConfirmed(false)}
      />

      {/* Opções médicas */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-ink">
          {optionsCount} opção{optionsCount !== 1 ? 'ões' : ''} de plano médico
        </p>
        {medicalOptions.map((opt, i) => (
          <OptionCard key={`${opt.carrierOrOperator}-${opt.planName}-${i}`} option={opt} />
        ))}
        <AddByTablePanel lives={lives} onAdd={handleAddOption} />
      </div>

      {/* Adicionais odonto */}
      {dentalAddons.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-ink">
            {dentalAddons.length} adicional{dentalAddons.length !== 1 ? 'is' : ''} odonto
          </p>
          {dentalAddons.map((opt, i) => (
            <DentalAddonCard key={`dental-${opt.carrierOrOperator}-${opt.planName}-${i}`} option={opt} />
          ))}
        </div>
      )}

      {/* Matriz */}
      <ComparisonMatrix draft={draft} livesConfirmed={livesConfirmed} />

      {/* Ações */}
      <ActionBar draft={draft} livesConfirmed={livesConfirmed} />

      {/* Nota de protótipo */}
      {isFixture && (
        <p className="text-center text-xs text-ink-faint pb-4">
          Dados de exemplo — este workspace usa uma fixture local para protótipo
        </p>
      )}
    </div>
  )
}
