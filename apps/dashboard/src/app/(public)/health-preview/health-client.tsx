'use client'

import React, { useState, useRef } from 'react'

// ─── Company data (from DB: dev.matheusfonteles@gmail.com) ───────────────────

const COMPANY = {
  displayName:  'Matheus Corretor',
  logoUrl:      'http://localhost:3001/api/companies/cmokw27st0005wd200c6v9l9p/logo',
  primaryColor: '#1B3A6B',
  whatsapp:     '5581989796516',
  contactEmail: 'dev.matheusfonteles@gmail.com',
  city:         'Recife',
  state:        'PE',
  bio:          null as string | null,
  instagram:    null as string | null,
  website:      null as string | null,
}

const WHATSAPP_URL = `https://wa.me/${COMPANY.whatsapp}`

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = 'resumo' | 'vidas' | 'rede' | 'reembolso' | 'faq' | 'obs'
type City = 'Recife' | 'Olinda' | 'Jaboatão'
type BadgeKey = 'H' | 'P.S' | 'M' | 'A' | 'HDIA'
type SimType = 'consulta' | 'honorarios' | 'exame'

// ─── Static data ─────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'resumo',    label: 'Resumo' },
  { id: 'vidas',     label: 'Vidas' },
  { id: 'rede',      label: 'Rede' },
  { id: 'reembolso', label: 'Reembolso' },
  { id: 'faq',       label: 'FAQ' },
  { id: 'obs',       label: 'Obs.' },
]

const LIVES = [
  { name: 'Ana Souza',  age: 42, role: 'Sócia' },
  { name: 'Bruno Lima', age: 38, role: 'Sócio' },
  { name: 'Clara Lima', age: 12, role: 'Dependente' },
]

interface Hospital {
  name: string
  city: City
  badges: BadgeKey[]
}

const HOSPITALS: Hospital[] = [
  { name: 'Hospital Português',           city: 'Recife',   badges: ['H', 'P.S', 'M', 'A'] },
  { name: 'Hospital Santa Joana',         city: 'Recife',   badges: ['H', 'P.S', 'M', 'A', 'HDIA'] },
  { name: 'Hospital Esperança',           city: 'Recife',   badges: ['H', 'P.S', 'M', 'A'] },
  { name: 'Hospital Jayme da Fonte',      city: 'Recife',   badges: ['H', 'A'] },
  { name: 'HOPE',                         city: 'Recife',   badges: ['H', 'P.S', 'A'] },
  { name: 'Hospital Esperança Olinda',    city: 'Olinda',   badges: ['H', 'P.S', 'A'] },
  { name: 'CLINOPE',                      city: 'Olinda',   badges: ['A'] },
  { name: 'Hospital Memorial Guararapes', city: 'Jaboatão', badges: ['H', 'P.S', 'M', 'A'] },
  { name: 'Clínica N. Sra. da Piedade',  city: 'Jaboatão', badges: ['H', 'A'] },
]

const BADGE_LABELS: Record<BadgeKey, string> = {
  'H':    'Hospital',
  'P.S':  'Pronto Socorro',
  'M':    'Maternidade',
  'A':    'Ambulatório',
  'HDIA': 'Hospital Dia',
}

const SIM_LIMITS: Record<SimType, number> = {
  consulta:   120,
  honorarios: 200,
  exame:       80,
}

const FAQ_ITEMS = [
  {
    q: 'Esse valor é mensal?',
    a: 'Sim. O total mensal estimado do exemplo é R$ 4.048,15, com primeira parcela de R$ 4.142,92 por causa do IOF.',
  },
  {
    q: 'O que significa reembolso específico?',
    a: 'Significa que o reembolso não é amplo para todos os procedimentos. Ele segue regras específicas do produto, especialmente para consultas médicas presenciais e honorários médicos em situações previstas.',
  },
  {
    q: 'A rede credenciada é garantida?',
    a: 'A rede exibida deve ser tratada como referência de abril/2026. Ela pode mudar e precisa ser confirmada na base oficial da Bradesco Saúde ou pela corretora.',
  },
  {
    q: 'Posso pesquisar hospitais por cidade?',
    a: 'Sim. Você pode buscar e filtrar por Recife, Olinda e Jaboatão dos Guararapes na aba Rede.',
  },
  {
    q: 'Esse plano cobre maternidade ou pronto socorro?',
    a: 'A tabela de rede usa siglas: M para maternidade e P.S para pronto socorro. Toque nos badges dos hospitais para ver o significado de cada sigla.',
  },
  {
    q: 'Por que o PDF original é diferente dessa tela?',
    a: 'O PDF é um documento formal da cotação. O link público reorganiza as informações para facilitar o entendimento e a conversa com a corretora.',
  },
  {
    q: 'O que eu devo confirmar antes de contratar?',
    a: 'Rede atualizada, acomodação, regras de reembolso, carências, coparticipação (quando existir) e condições oficiais do plano.',
  },
  {
    q: 'Esse simulador de reembolso é oficial?',
    a: 'Não neste mock. Ele serve para mostrar como a informação poderia ficar mais clara. Para uso real, a corretora precisa validar a tabela de reembolso do plano.',
  },
]

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconSearch({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
    </svg>
  )
}

function IconChevron({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function IconInfo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}

function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

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

// ─── Teal accent for health product ─────────────────────────────────────────

const TEAL = '#0F9F92'

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(v => !v)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs font-semibold text-white bg-slate-800 rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none">
          {label}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HealthPreviewClient() {
  const [activeTab, setActiveTab] = useState<TabId>('resumo')
  const [search,    setSearch]    = useState('')
  const [city,      setCity]      = useState<City | 'all'>('all')
  const [simType,   setSimType]   = useState<SimType>('consulta')
  const [simValue,  setSimValue]  = useState('')
  const [openFaq,   setOpenFaq]   = useState<number | null>(null)

  const networkRef = useRef<HTMLDivElement>(null)

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const filtered = HOSPITALS.filter(h => {
    const matchCity   = city === 'all' || h.city === city
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
                        h.city.toLowerCase().includes(search.toLowerCase())
    return matchCity && matchSearch
  })

  const limit    = SIM_LIMITS[simType]
  const paid     = parseFloat(simValue.replace(',', '.')) || 0
  const reimb    = Math.min(paid, limit)
  const finalCost = paid - reimb
  const hasSim   = paid > 0

  function goToNetwork() {
    setActiveTab('rede')
    setTimeout(() => networkRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }

  const initials = COMPANY.displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    /* Desktop shell: centres the mobile frame */
    <div className="min-h-screen bg-slate-300 flex items-start justify-center sm:py-10 sm:px-4">
      <div
        className="w-full max-w-[390px] bg-white flex flex-col relative sm:rounded-[2.5rem] sm:shadow-2xl sm:overflow-hidden"
        style={{ minHeight: '100dvh' }}
      >

        {/* ── Broker header ─────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5"
          style={{ background: COMPANY.primaryColor }}
        >
          {COMPANY.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={COMPANY.logoUrl}
              alt={COMPANY.displayName}
              className="h-8 max-w-[80px] object-contain shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-extrabold text-white"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">
              {COMPANY.displayName}
            </p>
            {COMPANY.city && (
              <p className="text-white/50 text-[10px] leading-none mt-0.5">
                {COMPANY.city} · {COMPANY.state}
              </p>
            )}
          </div>
          <span className="text-white/40 text-[10px] font-medium flex-shrink-0">
            Bradesco Saúde
          </span>
        </div>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div
          className="relative h-48 overflow-hidden flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${COMPANY.primaryColor} 0%, ${TEAL} 100%)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/health-preview/doctor-hero-header.png"
            alt=""
            className="absolute right-0 bottom-0 h-full w-auto object-cover object-right-bottom"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
          <div className="relative z-10 px-5 pt-5 pb-4 flex flex-col gap-1 max-w-[65%]">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest leading-none">
              Cotação empresarial · PE
            </p>
            <h1 className="text-white text-[17px] font-extrabold leading-snug mt-1">
              Plano Bradesco Saúde<br />Nacional II
            </h1>
            <div className="mt-2.5">
              <p className="text-white/60 text-[10px] uppercase tracking-wider">Total mensal estimado</p>
              <p className="text-white text-2xl font-black tracking-tight leading-none">
                R$ 4.048,15
                <span className="text-sm font-normal opacity-60"> /mês</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Context chips ─────────────────────────────────────────── */}
        <div className="px-4 pt-3 pb-3 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white">
          {['3 vidas', 'Pernambuco', 'Reembolso específico', 'Sócios'].map(chip => (
            <span
              key={chip}
              className="px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{ color: TEAL, borderColor: TEAL + '44', background: TEAL + '11' }}
            >
              {chip}
            </span>
          ))}
          <button
            onClick={goToNetwork}
            className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold text-white flex-shrink-0 active:opacity-80"
            style={{ background: TEAL }}
          >
            Ver rede ↓
          </button>
        </div>

        {/* ── Tab bar ───────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
          <div
            className="flex overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <style>{`.tab-bar::-webkit-scrollbar { display: none; }`}</style>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ───────────────────────────────────────────── */}
        <div className="flex-1 bg-slate-50">

          {/* ─── RESUMO ─────────────────────────────────────────────── */}
          {activeTab === 'resumo' && (
            <div className="p-4 space-y-3 pb-8">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  O que você está contratando
                </p>
                {[
                  { label: 'Plano',     value: 'Nacional II' },
                  { label: 'Região',    value: 'Pernambuco' },
                  { label: 'Perfil',    value: 'Sócios' },
                  { label: 'Reembolso', value: 'Específico' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-500">{row.label}</span>
                    <span className="text-sm font-semibold text-slate-800">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Quanto fica por mês
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saúde</span>
                    <span className="font-medium text-slate-800">R$ 3.981,76</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dental</span>
                    <span className="font-medium text-slate-800">R$ 66,39</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Total mensal</span>
                    <span className="text-base font-extrabold" style={{ color: COMPANY.primaryColor }}>
                      R$ 4.048,15
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">1ª parcela (c/ IOF)</span>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      R$ 4.142,92
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  O que está incluso
                </p>
                <div className="space-y-2.5">
                  {[
                    'Cobertura ambulatorial e hospitalar',
                    'Acesso à rede credenciada em PE',
                    'Reembolso específico (consultas e honorários)',
                    'Dental incluso',
                    'Plano de abrangência Nacional II',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2.5">
                      <IconCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-teal-600" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-2">
                  Pontos para confirmar antes de decidir
                </p>
                <ul className="space-y-1.5">
                  {[
                    'Rede atualizada na sua cidade',
                    'Acomodação (quarto individual)',
                    'Regras de reembolso e carências',
                    'Coparticipação, se existir',
                  ].map(item => (
                    <li key={item} className="text-xs text-amber-700 flex items-start gap-2">
                      <span className="mt-0.5 font-bold">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full rounded-2xl py-3.5 text-sm font-semibold text-white active:opacity-80 transition-opacity"
                style={{ background: '#25D366' }}
              >
                <IconWhatsApp />
                Falar pelo WhatsApp
              </a>
            </div>
          )}

          {/* ─── VIDAS ──────────────────────────────────────────────── */}
          {activeTab === 'vidas' && (
            <div className="p-4 space-y-3 pb-8">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Quem entra no plano
                </p>
                {LIVES.map((life, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-slate-500">{life.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{life.name}</p>
                      <p className="text-xs text-slate-400">{life.age} anos · {life.role}</p>
                    </div>
                  </div>
                ))}
                <p className="mt-3 text-[11px] text-slate-400 italic">Dados fictícios para demonstração</p>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Resumo financeiro
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vidas</span>
                    <span className="font-medium text-slate-800">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saúde</span>
                    <span className="font-medium text-slate-800">R$ 3.981,76</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dental</span>
                    <span className="font-medium text-slate-800">R$ 66,39</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Total mensal</span>
                    <span className="text-base font-extrabold" style={{ color: COMPANY.primaryColor }}>
                      R$ 4.048,15
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">1ª parcela (c/ IOF)</span>
                    <span className="text-xs font-semibold text-amber-700">R$ 4.142,92</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── REDE ───────────────────────────────────────────────── */}
          {activeTab === 'rede' && (
            <div ref={networkRef} className="p-4 space-y-3 pb-8">
              <div className="relative">
                <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar hospital, laboratório ou cidade..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div
                className="flex gap-2 overflow-x-auto pb-0.5"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {(['all', 'Recife', 'Olinda', 'Jaboatão'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                    style={
                      city === c
                        ? { background: COMPANY.primaryColor, color: '#fff', borderColor: COMPANY.primaryColor }
                        : { background: '#fff', color: '#475569', borderColor: '#e2e8f0' }
                    }
                  >
                    {c === 'all' ? 'Todas' : c}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <IconSearch className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nenhum resultado para essa busca</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((h, i) => (
                    <div key={i} className="bg-white rounded-2xl p-3.5 shadow-sm flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{h.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{h.city}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[130px] flex-shrink-0">
                        {h.badges.map(badge => (
                          <Tooltip key={badge} label={BADGE_LABELS[badge]}>
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold cursor-help leading-none"
                              style={{ background: TEAL + '22', color: TEAL }}
                            >
                              {badge}
                            </span>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <IconInfo className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Rede referenciada com base em material de abril/2026. A rede pode mudar; confirme a disponibilidade com a corretora antes da contratação.
                </p>
              </div>
            </div>
          )}

          {/* ─── REEMBOLSO ──────────────────────────────────────────── */}
          {activeTab === 'reembolso' && (
            <div className="p-4 space-y-3 pb-8">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Reembolso específico
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Este plano aparece com <strong>reembolso específico</strong>. Em linguagem simples, isso indica uma cobertura de reembolso mais restrita do que o reembolso completo — pode envolver consultas médicas presenciais e honorários médicos em situações previstas, conforme regras do produto.
                </p>
                <div className="mt-3 flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                  <IconInfo className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    As regras e limites de reembolso variam por plano, região e contratação. Confirme as condições oficiais com a corretora antes de decidir.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: TEAL }}>
                  Simulador de reembolso
                </p>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Atendeu fora da rede? Simule quanto seu plano poderia reembolsar.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                      Tipo de atendimento
                    </label>
                    <select
                      value={simType}
                      onChange={e => setSimType(e.target.value as SimType)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      <option value="consulta">Consulta médica (limite R$ 120,00)</option>
                      <option value="honorarios">Honorários médicos (limite R$ 200,00)</option>
                      <option value="exame">Exame simples (limite R$ 80,00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                      Valor pago ao médico (R$)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="Ex: 300"
                      value={simValue}
                      onChange={e => setSimValue(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>

                  {hasSim && (
                    <div className="rounded-xl p-4 space-y-2" style={{ background: TEAL + '18' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Reembolso estimado</span>
                        <span className="text-lg font-extrabold" style={{ color: TEAL }}>
                          {fmt(reimb)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/60">
                        <span className="text-sm text-slate-600">Custo final para você</span>
                        <span className="text-lg font-extrabold text-slate-800">{fmt(finalCost)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Valores estimativos para demonstração.</strong> O reembolso real depende da tabela do plano, regras do produto, documentos apresentados e análise da Bradesco Saúde.
                  </p>
                </div>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2.5 w-full rounded-xl py-3 text-sm font-semibold text-white active:opacity-80 transition-opacity"
                  style={{ background: '#25D366' }}
                >
                  <IconWhatsApp />
                  Enviar dúvida para corretora
                </a>
              </div>
            </div>
          )}

          {/* ─── FAQ ────────────────────────────────────────────────── */}
          {activeTab === 'faq' && (
            <div className="p-4 space-y-2 pb-8">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-sm font-semibold text-slate-800 leading-snug">{item.q}</span>
                    <IconChevron
                      className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── OBSERVAÇÕES ────────────────────────────────────────── */}
          {activeTab === 'obs' && (
            <div className="p-4 space-y-3 pb-8">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-2">
                  Caráter demonstrativo
                </p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Esta tela é um mock de demonstração com dados fictícios. Não representa uma proposta oficial, contrato, aprovação de cobertura ou garantia de rede credenciada.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sobre os dados</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Nomes, valores e rede exibidos são fictícios ou referências de abril/2026. Confirme tudo com a corretora antes de assinar qualquer documento.
                </p>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full rounded-2xl py-3.5 text-sm font-semibold text-white active:opacity-80 transition-opacity"
                style={{ background: '#25D366' }}
              >
                <IconWhatsApp />
                Falar pelo WhatsApp
              </a>
            </div>
          )}

        </div>

        {/* ── Footer — igual ao AUTO ─────────────────────────────────── */}
        <footer style={{ background: COMPANY.primaryColor }}>
          <div className="px-5 py-6 space-y-4">

            {/* Logo + nome + bio */}
            <div className="flex items-center gap-3">
              {COMPANY.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={COMPANY.logoUrl}
                  alt={COMPANY.displayName}
                  className="h-10 max-w-[90px] object-contain shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-extrabold text-white"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  {initials}
                </div>
              )}
              <div>
                <p className="font-bold text-white text-sm leading-tight">{COMPANY.displayName}</p>
                {COMPANY.bio && (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {COMPANY.bio}
                  </p>
                )}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity active:opacity-80"
              style={{ background: '#25D366' }}
            >
              <IconWhatsApp />
              Falar pelo WhatsApp
            </a>

            {/* Contatos secundários */}
            {(COMPANY.contactEmail || COMPANY.instagram || COMPANY.website) && (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {COMPANY.contactEmail && (
                  <a
                    href={`mailto:${COMPANY.contactEmail}`}
                    className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    <IconEmail />
                    {COMPANY.contactEmail}
                  </a>
                )}
              </div>
            )}

            {/* Cidade */}
            {COMPANY.city && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {COMPANY.city} — {COMPANY.state}
              </p>
            )}

            {/* Powered by */}
            <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Cotação gerada via{' '}
              <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Corretor no Flow</strong>
            </p>
          </div>
        </footer>

      </div>
    </div>
  )
}
