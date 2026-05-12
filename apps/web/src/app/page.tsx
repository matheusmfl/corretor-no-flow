import Image from "next/image";
import { FlowDemo } from "./flow-demo";

const navItems = [
  ["Cliente", "#dor"],
  ["Como funciona", "#como-funciona"],
  ["Rastreamento", "#rastreamento"],
  ["Beneficios", "#beneficios"],
];

const marqueeItems = [
  "Pare de mandar PDF e torcer.",
  "Cliente abriu agora.",
  "Proposta clara. Follow-up no tempo certo.",
  "Menos operacional. Mais fechamento.",
  "Da cotacao ao fechamento, sem atrito.",
  "Seu cliente entende. Voce vende mais.",
];

const painItems = [
  {
    title: "O cliente nao entende o PDF",
    body: "Preco, franquia, cobertura e seguradora chegam em formatos tecnicos demais para uma decisao rapida.",
  },
  {
    title: "Voce perde o timing",
    body: "Sem saber se ele abriu, comparou ou ignorou, o follow-up vira tentativa no escuro.",
  },
  {
    title: "A venda esfria no WhatsApp",
    body: "Anexos, explicacoes e lembretes se misturam. O cliente some antes da conversa certa acontecer.",
  },
];

const steps = [
  ["1", "Envie as cotacoes", "PDFs das seguradoras entram no fluxo sem voce redesenhar tudo manualmente."],
  ["2", "O sistema organiza", "As informacoes viram uma proposta clara, comparavel e feita para celular."],
  ["3", "O cliente acessa", "Ele entende as opcoes, compara seguradoras e chama voce no WhatsApp."],
  ["4", "Voce acompanha interesse", "O painel mostra sinais para priorizar quem esta quente agora."],
];

const trackingSignals = [
  "Quem abriu a proposta",
  "Qual seguradora comparou",
  "Quanto tempo ficou",
  "Quando voltou para ver de novo",
  "Quem precisa de follow-up agora",
];

const benefits = [
  {
    label: "Clareza",
    title: "Seu cliente finalmente entende o seguro.",
    body: "A proposta troca leitura tecnica por comparacao simples, objetiva e visual.",
  },
  {
    label: "Conversao",
    title: "Voce sabe quando agir.",
    body: "Sinais de intencao ajudam a chamar no WhatsApp no momento mais forte da decisao.",
  },
  {
    label: "Velocidade",
    title: "Da cotacao ao envio em minutos.",
    body: "Menos montagem manual e mais tempo para conversar com quem pode fechar.",
  },
  {
    label: "Presenca profissional",
    title: "Sua proposta parece maior que o seu operacional.",
    body: "O cliente recebe uma experiencia moderna, clara e confiavel no celular.",
  },
];

const weeklyQuoteVolumeOptions: { value: string; label: string; disabled?: boolean }[] = [
  { value: "", label: "Selecione uma faixa", disabled: true },
  { value: "none", label: "Nenhuma / nao aplicavel" },
  { value: "1-5", label: "1 a 5" },
  { value: "6-15", label: "6 a 15" },
  { value: "16-30", label: "16 a 30" },
  { value: "30+", label: "Mais de 30" },
];

const mainInsurers = [
  { id: "bradesco", label: "Bradesco" },
  { id: "porto", label: "Porto Seguro" },
  { id: "tokio", label: "Tokio Marine" },
  { id: "azul", label: "Azul Seguros" },
  { id: "allianz", label: "Allianz" },
  { id: "sulamerica", label: "SulAmerica" },
  { id: "hdi", label: "HDI" },
  { id: "mapfre", label: "Mapfre" },
  { id: "liberty", label: "Liberty" },
  { id: "outras", label: "Outras" },
];

function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function FlowMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-sm font-black text-white shadow-lg shadow-ink/15">
      NF
    </span>
  );
}

function MiniDashboard() {
  return (
    <div className="hero-console" aria-label="Painel de sinais comerciais">
      <div className="hero-console-top">
        <span>Pipeline de propostas</span>
        <strong>Ao vivo</strong>
      </div>
      <div className="hero-console-grid">
        {[
          ["42", "propostas enviadas"],
          ["17", "clientes abriram"],
          ["8", "quentes agora"],
        ].map(([value, label]) => (
          <div key={label} className="hero-metric">
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="hero-events">
        {[
          ["Agora", "Mariana abriu a proposta do Compass"],
          ["2 min", "Comparou Porto x Tokio Marine"],
          ["5 min", "Voltou para franquia reduzida"],
        ].map(([time, event]) => (
          <div key={event}>
            <span>{time}</span>
            <p>{event}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-canvas text-ink">
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-canvas/88 backdrop-blur-xl">
        <Container className="flex h-[76px] items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3 no-underline" aria-label="Corretor No Flow">
            <FlowMark />
            <span className="leading-none">
              <span className="block font-display text-lg font-extrabold tracking-tight text-ink">
                Corretor No Flow
              </span>
              <span className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint sm:block">
                Sistema de conversao comercial
              </span>
            </span>
          </a>

          <nav
            className="hidden items-center gap-1 rounded-full bg-white/80 p-1 ring-1 ring-ink/10 lg:flex"
            aria-label="Navegacao principal"
          >
            {navItems.map(([item, href]) => (
              <a
                key={item}
                href={href}
                className="rounded-full px-4 py-2 text-sm font-bold text-ink-muted no-underline transition-colors hover:bg-surface hover:text-ink"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="#como-funciona"
              className="rounded-full px-4 py-2 text-sm font-bold text-ink-muted no-underline transition hover:text-ink"
            >
              Ver sistema
            </a>
            <a
              href="#captura"
              className="inline-flex items-center gap-2 rounded-full bg-action px-5 py-2.5 text-sm font-bold text-white no-underline shadow-lg shadow-action/20 transition hover:-translate-y-0.5 hover:bg-action-strong"
            >
              Entrar na lista antecipada
              <ArrowIcon />
            </a>
          </div>

          <details className="group relative md:hidden">
            <summary className="list-none rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-ink/10 marker:hidden">
              Menu
            </summary>
            <div className="absolute right-0 top-12 w-[min(82vw,320px)] rounded-3xl bg-white p-3 shadow-2xl shadow-ink/15 ring-1 ring-ink/10">
              {navItems.map(([item, href]) => (
                <a
                  key={item}
                  href={href}
                  className="block rounded-2xl px-4 py-3 text-sm font-bold text-ink-muted no-underline hover:bg-surface hover:text-ink"
                >
                  {item}
                </a>
              ))}
              <a
                href="#captura"
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-action px-4 py-3 text-sm font-bold text-white no-underline"
              >
                Entrar na lista antecipada
                <ArrowIcon />
              </a>
            </div>
          </details>
        </Container>
      </header>

      <section className="relative pt-10 sm:pt-14 lg:pt-16">
        <Container>
          <div className="grid gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-6 flex flex-wrap gap-2">
                {[
                  "AUMENTE SEU FATURAMENTO",
                  "GANHE TEMPO",
                  "TRANSMITA MAIS AUTORIDADE",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-accent ring-1 ring-ink/10"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <h1 className="font-display text-[clamp(2.55rem,5.3vw,5.05rem)] font-bold leading-[0.98] tracking-tight text-ink">
                Transforme cotacoes tecnicas em vendas mais rapidas.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-ink-muted sm:text-lg">
                Seu cliente entende melhor a cotacao. Voce entende melhor o
                comportamento dele.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#captura"
                  className="inline-flex justify-center rounded-full bg-action px-6 py-3.5 text-sm font-bold text-white no-underline shadow-xl shadow-action/20 transition hover:-translate-y-0.5 hover:bg-action-strong"
                >
                  Quero vender com mais clareza
                </a>
                <a
                  href="#como-funciona"
                  className="inline-flex justify-center rounded-full border border-ink/15 bg-white/75 px-6 py-3.5 text-sm font-bold text-ink no-underline transition hover:border-ink/35 hover:bg-white"
                >
                  Ver a proposta em acao
                </a>
              </div>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                {["Cliente entende", "Corretor ganha tempo", "Proposta profissional"].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-ink/10">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[510px] overflow-hidden rounded-[30px] bg-ink ring-1 ring-ink/10">
              <Image
                src="/hero-flow-workspace.png"
                alt="Workspace com proposta interativa de seguro e alerta de cliente quente"
                fill
                priority
                className="object-cover opacity-42"
                sizes="(min-width: 1024px) 56vw, 100vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(43,10,10,0.92),rgba(43,10,10,0.38)_48%,rgba(192,80,32,0.72))]" />
              <MiniDashboard />
              <div className="absolute left-5 right-5 bottom-5 rounded-3xl bg-white/94 p-5 shadow-2xl shadow-ink/25 backdrop-blur-md ring-1 ring-white/70 sm:left-7 sm:right-7 sm:bottom-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-action">
                  Cliente abriu agora
                </p>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <p className="font-display text-xl font-extrabold leading-tight text-ink sm:text-3xl">
                    Comparando franquia e cobertura
                  </p>
                  <span className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white">
                    chamar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>

        <div className="mt-12 overflow-hidden bg-ink py-4">
          <div className="animate-marquee flex whitespace-nowrap">
            {[...Array(2)].map((_, group) => (
              <div key={group} className="flex">
                {marqueeItems.map((item) => (
                  <span key={`${group}-${item}`} className="px-7 text-sm font-bold text-white">
                    {item} <span className="pl-7 text-action-light">/</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="dor" className="py-18 sm:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="section-kicker">Entenda a dor do seu cliente</p>
            <h2 className="section-title">No celular, cotacao tecnica parece risco — nao oportunidade.</h2>
            <p className="mt-5 text-lg leading-8 text-ink-muted">
              Do lado do cliente, preco so fecha quando a cobertura faz sentido. PDF longo,
              tabelas e siglas geram duvida: sera que estou comparando a mesma coisa? sera
              que falta alguma protecao importante?
            </p>
            <p className="mt-4 text-lg leading-8 text-ink-muted">
              A apresentacao fica mais clara, mais bonita e muito mais facil de
              entender. Seu cliente entende melhor o que esta contratando, voce transmite
              mais autoridade e aumenta suas chances de fechar a venda.
            </p>
            <p className="mt-4 text-lg leading-8 text-ink-muted">
              De maneira simples, transformamos o PDF da cotacao em uma pagina
              personalizada com o nome e a logo da sua corretora.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {painItems.map((item) => (
              <article key={item.title} className="rounded-3xl bg-white p-6 ring-1 ring-ink/10">
                <h3 className="font-display text-xl font-bold text-ink">{item.title}</h3>
                <p className="mt-4 text-[15px] leading-7 text-ink-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="como-funciona" className="bg-white py-18 sm:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="section-kicker">Como funciona</p>
              <h2 className="section-title">Uma camada comercial entre a seguradora e o fechamento.</h2>
              <p className="mt-5 text-lg leading-8 text-ink-muted">
                O produto traduz a parte tecnica, organiza a proposta e mostra sinais
                de interesse para o corretor agir com mais precisao.
              </p>
              <div className="mt-8 grid gap-3">
                {steps.map(([number, title, body]) => (
                  <div key={title} className="step-row">
                    <span>{number}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FlowDemo />
          </div>
        </Container>
      </section>

      <section id="rastreamento" className="py-18 sm:py-24">
        <Container>
          <div className="grid min-w-0 gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="tracking-panel min-w-0">
              <div className="tracking-panel-top">
                <span>Intencao do cliente</span>
                <strong>Lead quente</strong>
              </div>
              <div className="tracking-score">
                <span>Score</span>
                <strong>87</strong>
                <p>Abriu 3 vezes, comparou 2 seguradoras e voltou para a cobertura.</p>
              </div>
              <div className="tracking-feed">
                {trackingSignals.map((signal, index) => (
                  <div key={signal}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{signal}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <p className="section-kicker">Diferencial</p>
              <h2 className="section-title">Sua venda comeca quando o cliente abre a proposta.</h2>
              <p className="mt-5 text-lg leading-8 text-ink-muted">
                Saber que alguem visualizou a cotacao e util. Saber o que comparou,
                quando voltou e quem esta quente muda completamente o follow-up.
              </p>
              <a
                href="#captura"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white no-underline transition hover:-translate-y-0.5 hover:bg-ink-soft"
              >
                Quero testar esse fluxo
                <ArrowIcon />
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section id="beneficios" className="bg-ink py-18 text-white sm:py-24">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-action-light">
                Beneficios
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.25rem,5vw,4.7rem)] font-extrabold leading-[0.98] tracking-tight">
                Menos operacional. Mais fechamento.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/68">
              A proposta deixa de ser um anexo e vira um ponto de decisao com dados,
              contexto e proximo passo claro.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {benefits.map((item) => (
              <article key={item.title} className="rounded-3xl bg-white/7 p-6 ring-1 ring-white/10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-action-light">
                  {item.label}
                </p>
                <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-4 leading-7 text-white/68">{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="captura" className="py-18 sm:py-24">
        <Container>
          <div className="capture-section-shell grid min-w-0 gap-8 bg-white ring-1 ring-ink/10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div className="min-w-0">
              <p className="section-kicker">Acesso antecipado</p>
              <h2 className="mt-4 font-display text-[clamp(1.85rem,6.5vw,4.4rem)] font-extrabold leading-[0.98] tracking-tight">
                Entre na lista de corretores que querem vender com mais timing.
              </h2>
              <p className="mt-5 text-base leading-7 text-ink-muted sm:text-lg sm:leading-8">
                A primeira versao sera ajustada com corretores reais. A ideia e validar
                proposta, rastreamento e follow-up antes de escalar.
              </p>
            </div>

            <form className="capture-form min-w-0" action="#" method="post">
              <label htmlFor="early-name">
                Nome
                <input id="early-name" type="text" name="name" autoComplete="name" placeholder="Seu nome" />
              </label>
              <label htmlFor="early-email">
                E-mail
                <input
                  id="early-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="voce@corretora.com.br"
                />
              </label>
              <label htmlFor="early-whatsapp">
                WhatsApp
                <input
                  id="early-whatsapp"
                  type="tel"
                  name="whatsapp"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                />
              </label>

              <div className="capture-form-split">
                <label htmlFor="early-volume-auto">
                  Cotacoes de <strong className="text-white">Auto</strong> por semana
                  <select id="early-volume-auto" name="volume_auto" defaultValue="">
                    {weeklyQuoteVolumeOptions.map((opt) => (
                      <option key={`auto-${opt.value || "placeholder"}`} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label htmlFor="early-volume-saude">
                  Cotacoes de <strong className="text-white">Saude</strong> por semana
                  <select id="early-volume-saude" name="volume_saude" defaultValue="">
                    {weeklyQuoteVolumeOptions.map((opt) => (
                      <option key={`saude-${opt.value || "placeholder"}`} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <fieldset className="capture-form-fieldset">
                <legend>Principais seguradoras com que voce trabalha</legend>
                <div className="capture-form-check-grid">
                  {mainInsurers.map((ins) => (
                    <label key={ins.id} className="capture-form-check">
                      <input type="checkbox" name="insurers" value={ins.id} />
                      <span>{ins.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button type="button">Entrar na lista antecipada</button>
              <p>Sem promessa magica: queremos construir com quem vive o fluxo de cotacao todos os dias.</p>
            </form>
          </div>
        </Container>
      </section>

      <footer className="border-t border-ink/10 py-8">
        <Container className="flex flex-col justify-between gap-3 text-sm text-ink-muted sm:flex-row">
          <span className="font-display font-bold text-ink">Corretor No Flow</span>
          <span>Pre-venda e conversao para corretores de seguros.</span>
        </Container>
      </footer>
    </main>
  );
}
