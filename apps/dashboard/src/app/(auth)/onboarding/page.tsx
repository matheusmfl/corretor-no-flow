'use client'

import { useState } from 'react'
import type { AccountType, CreateCompanyDto } from '@corretor/types'
import { useCreateCompany } from '@/hooks/company/use-create-company'
import { handleError } from '@/lib/handle-error'

// ─── Step indicators ─────────────────────────────────────────────────────────

const STEPS = ['Tipo de conta', 'Dados legais', 'Contato'] as const

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < current
                  ? 'bg-mahogany text-gold'
                  : i === current
                    ? 'bg-mahogany text-gold ring-2 ring-mahogany/30 ring-offset-2'
                    : 'bg-surface text-ink-faint'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === current ? 'text-ink font-medium' : 'text-ink-faint'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px flex-1 ${i < current ? 'bg-mahogany' : 'bg-surface-strong'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Shared field component ───────────────────────────────────────────────────

function Field({
  label, id, required, children,
}: {
  label: string
  id?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-ember ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-surface-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-mahogany focus:ring-2 focus:ring-mahogany/20 transition'

// ─── Color presets ────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  '#3E1010', '#1B3A6B', '#0F4C35', '#4A1942', '#1A3A4A', '#4A3200',
]

// ─── Steps ───────────────────────────────────────────────────────────────────

type FormData = Omit<CreateCompanyDto, never>

function Step1({
  data, onChange, onNext,
}: {
  data: Pick<FormData, 'accountType'>
  onChange: (v: Partial<FormData>) => void
  onNext: () => void
}) {
  const options: { value: AccountType; label: string; desc: string }[] = [
    { value: 'INDIVIDUAL', label: 'Corretor autônomo', desc: 'Atua como pessoa física (CPF)' },
    { value: 'BUSINESS',   label: 'Corretora',         desc: 'Empresa ou MEI (CNPJ)' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold font-display text-ink">Como você atua?</h2>
        <p className="text-sm text-ink-muted mt-1">Isso define como seus dados aparecem na plataforma.</p>
      </div>

      <div className="grid gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ accountType: opt.value })}
            className={`w-full text-left rounded-xl border-2 px-4 py-4 transition ${
              data.accountType === opt.value
                ? 'border-mahogany bg-mahogany/5'
                : 'border-surface-strong bg-white hover:border-mahogany/40'
            }`}
          >
            <p className="font-semibold text-ink text-sm">{opt.label}</p>
            <p className="text-xs text-ink-muted mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!data.accountType}
        className="w-full rounded-lg bg-mahogany px-4 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Continuar
      </button>
    </div>
  )
}

function Step2({
  data, accountType, onChange, onNext, onBack,
}: {
  data: Pick<FormData, 'legalName' | 'tradeName' | 'document' | 'susepNumber'>
  accountType: AccountType
  onChange: (v: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const isIndividual = accountType === 'INDIVIDUAL'

  function valid() {
    return data.legalName.trim() && data.document.trim() && data.susepNumber.trim()
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold font-display text-ink">Dados legais</h2>
        <p className="text-sm text-ink-muted mt-1">Informações do seu registro como corretor.</p>
      </div>

      <div className="space-y-3">
        <Field label={isIndividual ? 'Nome completo' : 'Razão social'} id="legalName" required>
          <input
            id="legalName"
            type="text"
            value={data.legalName}
            onChange={(e) => onChange({ legalName: e.target.value })}
            className={inputClass}
            placeholder={isIndividual ? 'João da Silva' : 'Corretora Silva Ltda'}
          />
        </Field>

        {!isIndividual && (
          <Field label="Nome fantasia" id="tradeName">
            <input
              id="tradeName"
              type="text"
              value={data.tradeName ?? ''}
              onChange={(e) => onChange({ tradeName: e.target.value })}
              className={inputClass}
              placeholder="Silva Seguros"
            />
          </Field>
        )}

        <Field label={isIndividual ? 'CPF' : 'CNPJ'} id="document" required>
          <input
            id="document"
            type="text"
            value={data.document}
            onChange={(e) => onChange({ document: e.target.value })}
            className={inputClass}
            placeholder={isIndividual ? '000.000.000-00' : '00.000.000/0000-00'}
          />
        </Field>

        <Field label="Número SUSEP" id="susepNumber" required>
          <input
            id="susepNumber"
            type="text"
            value={data.susepNumber}
            onChange={(e) => onChange({ susepNumber: e.target.value })}
            className={inputClass}
            placeholder="100000000"
          />
        </Field>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-surface-strong px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface transition"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!valid()}
          className="flex-1 rounded-lg bg-mahogany px-4 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

function Step3({
  data, onChange, onSubmit, onBack, isPending,
}: {
  data: Pick<FormData, 'displayName' | 'whatsapp' | 'contactEmail' | 'primaryColor' | 'state' | 'city'>
  onChange: (v: Partial<FormData>) => void
  onSubmit: () => void
  onBack: () => void
  isPending: boolean
}) {
  function valid() {
    return data.displayName.trim() && data.whatsapp.trim()
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold font-display text-ink">Identidade e contato</h2>
        <p className="text-sm text-ink-muted mt-1">Como seus clientes vão te ver.</p>
      </div>

      <div className="space-y-3">
        <Field label="Nome de exibição" id="displayName" required>
          <input
            id="displayName"
            type="text"
            value={data.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
            className={inputClass}
            placeholder="Silva Seguros"
          />
          <p className="text-xs text-ink-faint mt-1">Aparece nas cotações e no link do segurado.</p>
        </Field>

        <Field label="WhatsApp" id="whatsapp" required>
          <input
            id="whatsapp"
            type="tel"
            value={data.whatsapp}
            onChange={(e) => onChange({ whatsapp: e.target.value })}
            className={inputClass}
            placeholder="(11) 99999-9999"
          />
        </Field>

        <Field label="E-mail de contato" id="contactEmail">
          <input
            id="contactEmail"
            type="email"
            value={data.contactEmail ?? ''}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
            className={inputClass}
            placeholder="contato@silvaseguros.com.br"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Estado" id="state">
            <input
              id="state"
              type="text"
              maxLength={2}
              value={data.state ?? ''}
              onChange={(e) => onChange({ state: e.target.value.toUpperCase() })}
              className={inputClass}
              placeholder="SP"
            />
          </Field>
          <Field label="Cidade" id="city">
            <input
              id="city"
              type="text"
              value={data.city ?? ''}
              onChange={(e) => onChange({ city: e.target.value })}
              className={inputClass}
              placeholder="São Paulo"
            />
          </Field>
        </div>

        <Field label="Cor principal">
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange({ primaryColor: color })}
                style={{ backgroundColor: color }}
                className={`w-8 h-8 rounded-full transition ring-offset-2 ${
                  data.primaryColor === color ? 'ring-2 ring-mahogany' : 'hover:ring-2 hover:ring-ink-faint'
                }`}
              />
            ))}
            <input
              type="color"
              value={data.primaryColor ?? '#3E1010'}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent p-0"
              title="Cor personalizada"
            />
          </div>
        </Field>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="flex-1 rounded-lg border border-surface-strong px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface disabled:opacity-50 transition"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!valid() || isPending}
          className="flex-1 rounded-lg bg-mahogany px-4 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isPending ? 'Criando…' : 'Criar conta'}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const INITIAL: FormData = {
  accountType: 'INDIVIDUAL',
  legalName: '',
  tradeName: '',
  displayName: '',
  document: '',
  susepNumber: '',
  whatsapp: '',
  contactEmail: '',
  primaryColor: '#3E1010',
  state: '',
  city: '',
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)

  const createCompany = useCreateCompany()

  function patch(v: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...v }))
  }

  function handleSubmit() {
    const dto: CreateCompanyDto = {
      accountType:  form.accountType,
      legalName:    form.legalName.trim(),
      displayName:  form.displayName.trim(),
      document:     form.document.trim(),
      susepNumber:  form.susepNumber.trim(),
      whatsapp:     form.whatsapp.trim(),
      ...(form.tradeName?.trim()    && { tradeName:    form.tradeName.trim() }),
      ...(form.contactEmail?.trim() && { contactEmail: form.contactEmail.trim() }),
      ...(form.primaryColor         && { primaryColor:  form.primaryColor }),
      ...(form.state?.trim()        && { state:         form.state.trim() }),
      ...(form.city?.trim()         && { city:          form.city.trim() }),
    }
    createCompany.mutate(dto, { onError: (err) => handleError(err) })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="font-display text-2xl font-bold text-mahogany">Corretor no Flow</span>
          <p className="mt-1 text-sm text-ink-muted">Configure sua conta em 3 passos</p>
        </div>

        <div className="rounded-2xl bg-white border border-surface-strong p-6 shadow-sm">
          <StepBar current={step} />

          {step === 0 && (
            <Step1
              data={form}
              onChange={patch}
              onNext={() => setStep(1)}
            />
          )}

          {step === 1 && (
            <Step2
              data={form}
              accountType={form.accountType}
              onChange={patch}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}

          {step === 2 && (
            <Step3
              data={form}
              onChange={patch}
              onSubmit={handleSubmit}
              onBack={() => setStep(1)}
              isPending={createCompany.isPending}
            />
          )}
        </div>
      </div>
    </div>
  )
}
