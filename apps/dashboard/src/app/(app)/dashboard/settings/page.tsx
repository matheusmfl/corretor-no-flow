'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateCompanyDto } from '@corretor/types'
import { useMyCompany } from '@/hooks/company/use-my-company'
import { useUpdateCompany } from '@/hooks/company/use-update-company'
import { useCep } from '@/hooks/use-cep'
import { maskPhone, maskCep, stripMask } from '@/lib/masks'
import { uploadLogoFn } from '@/lib/api/company.api'

// ─── Shared ───────────────────────────────────────────────────────────────────

const inputClass =
  'w-full rounded-lg border border-surface-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-mahogany focus:ring-2 focus:ring-mahogany/20 transition'

function Field({ label, id, hint, children }: {
  label: string; id?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
      {children}
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-ink border-b border-surface-strong pb-2">{children}</h3>
}

const COLOR_PRESETS = ['#3E1010', '#1B3A6B', '#0F4C35', '#4A1942', '#1A3A4A', '#4A3200']

// ─── Logo uploader ────────────────────────────────────────────────────────────

function LogoUploader({
  companyId,
  currentLogoUrl,
  primaryColor,
  displayName,
}: {
  companyId: string
  currentLogoUrl: string | null
  primaryColor: string
  displayName: string
}) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentLogoUrl)

  useEffect(() => { setPreview(currentLogoUrl) }, [currentLogoUrl])

  const upload = useMutation({
    mutationFn: (file: File) => uploadLogoFn(companyId, file),
    onSuccess: ({ logoUrl }) => {
      // força re-fetch da imagem adicionando timestamp
      setPreview(`${logoUrl}?t=${Date.now()}`)
      queryClient.setQueryData(['companies', 'me'], (prev: any) =>
        prev ? { ...prev, logoUrl } : prev,
      )
      toast.success('Logo atualizada.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function handleFile(file: File) {
    if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
      toast.error('Use PNG, JPG ou SVG.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 2 MB.')
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    upload.mutate(file)
  }

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div
        className="w-full h-28 rounded-xl flex items-center justify-center overflow-hidden"
        style={{ background: primaryColor }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Logo"
            className="max-h-20 max-w-[70%] object-contain"
          />
        ) : (
          <span className="text-3xl font-extrabold text-white/80 tracking-tight">
            {initials}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="rounded-lg border border-surface-strong px-4 py-2 text-sm font-medium text-ink hover:bg-surface disabled:opacity-50 transition"
        >
          {upload.isPending ? 'Enviando…' : preview ? 'Trocar logo' : 'Fazer upload'}
        </button>
        <p className="text-xs text-ink-faint">PNG com fundo transparente recomendado · máx 2 MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.svg"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FormState = UpdateCompanyDto & { cep: string }

export default function SettingsPage() {
  const { data: company, isLoading } = useMyCompany()
  const update = useUpdateCompany(company?.id ?? '')
  const { fetchCep, isLoading: cepLoading } = useCep()

  const [form, setForm] = useState<FormState>({
    displayName: '', tradeName: '', bio: '', primaryColor: '#3E1010',
    whatsapp: '', contactEmail: '', instagram: '', website: '',
    zipCode: '', street: '', neighborhood: '', city: '', state: '',
    cep: '',
  })

  useEffect(() => {
    if (!company) return
    setForm({
      displayName:  company.displayName,
      tradeName:    company.tradeName      ?? '',
      bio:          company.bio            ?? '',
      primaryColor: company.primaryColor,
      whatsapp:     maskPhone(company.whatsapp),
      contactEmail: company.contactEmail   ?? '',
      instagram:    company.instagram      ?? '',
      website:      company.website        ?? '',
      zipCode:      company.zipCode        ?? '',
      street:       company.street         ?? '',
      neighborhood: company.neighborhood   ?? '',
      city:         company.city           ?? '',
      state:        company.state          ?? '',
      cep:          company.zipCode        ?? '',
    })
  }, [company])

  function patch(v: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...v }))
  }

  async function handleCepChange(value: string) {
    const masked = maskCep(value)
    patch({ cep: masked, zipCode: stripMask(masked) })
    if (stripMask(masked).length === 8) {
      const result = await fetchCep(masked)
      if (result) patch({ city: result.city, state: result.state })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company) return

    const dto: UpdateCompanyDto = {
      displayName:  form.displayName?.trim()  || undefined,
      tradeName:    form.tradeName?.trim()     || undefined,
      bio:          form.bio?.trim()           || undefined,
      primaryColor: form.primaryColor          || undefined,
      whatsapp:     form.whatsapp ? stripMask(form.whatsapp) : undefined,
      contactEmail: form.contactEmail?.trim()  || undefined,
      instagram:    form.instagram?.trim()     || undefined,
      website:      form.website?.trim()       || undefined,
      zipCode:      form.zipCode?.trim()       || undefined,
      street:       form.street?.trim()        || undefined,
      neighborhood: form.neighborhood?.trim()  || undefined,
      city:         form.city?.trim()          || undefined,
      state:        form.state?.trim()         || undefined,
    }

    update.mutate(dto, { onSuccess: () => toast.success('Dados atualizados.') })
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-surface-strong bg-white p-5 space-y-4">
            <div className="h-4 w-32 rounded bg-surface animate-pulse" />
            <div className="h-10 rounded-lg bg-surface animate-pulse" />
            <div className="h-10 rounded-lg bg-surface animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold font-display text-ink">Dados da empresa</h2>
        <p className="text-sm text-ink-muted mt-0.5">
          Essas informações aparecem nas cotações e no link enviado ao segurado.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Logo */}
        <div className="rounded-xl border border-surface-strong bg-white p-5 space-y-4">
          <SectionTitle>Logo</SectionTitle>
          {company && (
            <LogoUploader
              companyId={company.id}
              currentLogoUrl={company.logoUrl}
              primaryColor={form.primaryColor ?? company.primaryColor}
              displayName={form.displayName ?? company.displayName}
            />
          )}
        </div>

        {/* Identidade */}
        <div className="rounded-xl border border-surface-strong bg-white p-5 space-y-4">
          <SectionTitle>Identidade</SectionTitle>

          <Field label="Nome de exibição" id="displayName" hint="Aparece no cabeçalho do link público.">
            <input id="displayName" type="text" value={form.displayName ?? ''} onChange={(e) => patch({ displayName: e.target.value })} className={inputClass} placeholder="Silva Seguros" />
          </Field>

          {company?.accountType === 'BUSINESS' && (
            <Field label="Nome fantasia" id="tradeName">
              <input id="tradeName" type="text" value={form.tradeName ?? ''} onChange={(e) => patch({ tradeName: e.target.value })} className={inputClass} placeholder="Silva Seguros" />
            </Field>
          )}

          <Field label="Bio" id="bio" hint="Frase curta que aparece no seu perfil.">
            <textarea id="bio" rows={3} value={form.bio ?? ''} onChange={(e) => patch({ bio: e.target.value })} className={inputClass + ' resize-none'} placeholder="Especialistas em AUTO há 10 anos." />
          </Field>

          <Field label="Cor principal">
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((color) => (
                <button key={color} type="button" onClick={() => patch({ primaryColor: color })}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-full transition ring-offset-2 ${form.primaryColor === color ? 'ring-2 ring-mahogany' : 'hover:ring-2 hover:ring-ink-faint'}`}
                />
              ))}
              <input type="color" value={form.primaryColor ?? '#3E1010'} onChange={(e) => patch({ primaryColor: e.target.value })} className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent p-0" title="Cor personalizada" />
            </div>
          </Field>
        </div>

        {/* Contato */}
        <div className="rounded-xl border border-surface-strong bg-white p-5 space-y-4">
          <SectionTitle>Contato</SectionTitle>

          <Field label="WhatsApp" id="whatsapp">
            <input id="whatsapp" type="tel" inputMode="numeric" value={form.whatsapp ?? ''} onChange={(e) => patch({ whatsapp: maskPhone(e.target.value) })} className={inputClass} placeholder="(11) 99999-9999" />
          </Field>

          <Field label="E-mail de contato" id="contactEmail">
            <input id="contactEmail" type="email" value={form.contactEmail ?? ''} onChange={(e) => patch({ contactEmail: e.target.value })} className={inputClass} placeholder="contato@silvaseguros.com.br" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Instagram" id="instagram">
              <input id="instagram" type="text" value={form.instagram ?? ''} onChange={(e) => patch({ instagram: e.target.value })} className={inputClass} placeholder="@silvaseguros" />
            </Field>
            <Field label="Site" id="website">
              <input id="website" type="url" value={form.website ?? ''} onChange={(e) => patch({ website: e.target.value })} className={inputClass} placeholder="https://silvaseguros.com.br" />
            </Field>
          </div>
        </div>

        {/* Endereço */}
        <div className="rounded-xl border border-surface-strong bg-white p-5 space-y-4">
          <div>
            <SectionTitle>Endereço comercial</SectionTitle>
            <p className="text-xs text-ink-faint mt-1">Opcional — aparece no rodapé das cotações geradas.</p>
          </div>

          <Field label="CEP" id="cep" hint="Preenche cidade e estado automaticamente.">
            <div className="relative">
              <input id="cep" type="text" inputMode="numeric" value={form.cep} onChange={(e) => handleCepChange(e.target.value)} className={inputClass} placeholder="00000-000" />
              {cepLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">Buscando…</span>}
            </div>
          </Field>

          <Field label="Logradouro e número" id="street">
            <input id="street" type="text" value={form.street ?? ''} onChange={(e) => patch({ street: e.target.value })} className={inputClass} placeholder="Av. Paulista, 1000 — sala 12" />
          </Field>

          <Field label="Bairro" id="neighborhood">
            <input id="neighborhood" type="text" value={form.neighborhood ?? ''} onChange={(e) => patch({ neighborhood: e.target.value })} className={inputClass} placeholder="Bela Vista" />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Estado" id="state">
              <input id="state" type="text" maxLength={2} value={form.state ?? ''} onChange={(e) => patch({ state: e.target.value.toUpperCase() })} className={inputClass} placeholder="SP" />
            </Field>
            <div className="col-span-2">
              <Field label="Cidade" id="city">
                <input id="city" type="text" value={form.city ?? ''} onChange={(e) => patch({ city: e.target.value })} className={inputClass} placeholder="São Paulo" />
              </Field>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pb-6">
          <button type="submit" disabled={update.isPending}
            className="rounded-lg bg-mahogany px-6 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {update.isPending ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
