import Image from "next/image";

const marqueeItems = [
  "Ta na mao, corretor.",
  "Da cotacao a conversa.",
  "Menos PDF. Mais venda.",
  "Proposta pronta. Cliente respondendo.",
  "Envie menos arquivos. Feche mais negocios.",
  "A proposta virou conversa.",
  "O cliente entendeu. Agora ele responde.",
  "Velocidade fecha negocio.",
];

const heroCards = [
  {
    eyebrow: "Lead quente",
    title: "Quem responde primeiro, ganha.",
    body: "Sinais de abertura ajudam o corretor a agir enquanto o cliente ainda esta decidindo.",
  },
  {
    eyebrow: "Proposta viva",
    title: "Menos PDF. Mais venda.",
    body: "A cotacao vira uma pagina clara, comparavel e feita para abrir conversa.",
  },
  {
    eyebrow: "Cliente respondendo",
    title: "Da cotacao a conversa.",
    body: "O segurado entende a proposta e chama o corretor no momento certo.",
  },
];

const problemItems = [
  {
    title: "Resposta lenta custa venda",
    body: "Quando o segurado pede cotacao para mais de um corretor, a janela de decisao e curta. Quem chega depois entra so para brigar por preco.",
  },
  {
    title: "PDF nao cria urgencia",
    body: "Arquivo tecnico parece completo, mas deixa o cliente sozinho para entender franquia, cobertura, parcelas e diferencas entre seguradoras.",
  },
  {
    title: "WhatsApp vira bagunca",
    body: "Perguntas, anexos e follow-ups se misturam. O corretor perde o momento em que o cliente estava pronto para conversar.",
  },
];

const solutionItems = [
  "Transforma PDFs tecnicos em uma proposta mobile-first.",
  "Mostra comparacoes claras para o segurado decidir com menos atrito.",
  "Abre conversa instantanea com o corretor no momento de interesse.",
  "Ajuda a priorizar quem abriu, comparou e esta quente agora.",
];

const featureItems = [
  {
    label: "Propostas vivas",
    title: "Nao envie apenas anexos",
    body: "Cada cotacao vira uma experiencia consultiva com contexto, comparacao e proximo passo claro.",
  },
  {
    label: "Contato imediato",
    title: "Falar com o corretor agora",
    body: "O CTA certo aparece no celular do segurado quando ele esta avaliando a proposta.",
  },
  {
    label: "Lead em tempo real",
    title: "Atenda antes da concorrencia",
    body: "Sinais de abertura e interesse ajudam o corretor a agir enquanto a intencao ainda esta quente.",
  },
  {
    label: "Experiencia do cliente",
    title: "Clareza para escolher",
    body: "Preco, franquia e coberturas ficam comparaveis em uma leitura simples, sem depender de planilha ou PDF.",
  },
];

const boldStatements = [
  "Isto nao e um gerador de PDF.",
  "Velocidade fecha negocio.",
  "Quem responde primeiro, ganha.",
  "PDF nao conversa. O Flow conversa.",
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

function FlowDemo() {
  return (
    <div className="flow-demo" aria-label="Animacao: PDF virando proposta interativa">
      <div className="flow-demo-grid" />
      <div className="flow-dropzone">
        <span className="flow-dropzone-kicker">Solte o PDF aqui</span>
        <span className="flow-dropzone-title">Cotacao Bradesco Auto</span>
        <span className="flow-dropzone-status">Lendo cobertura, franquia e parcelas...</span>
      </div>

      <div className="flow-pdf-card">
        <span className="flow-pdf-corner" />
        <span className="flow-pdf-label">PDF</span>
        <strong>Cotacao_AUTO.pdf</strong>
        <span>12 paginas</span>
      </div>

      <div className="flow-cursor" />

      <div className="flow-processing">
        <span />
        <span />
        <span />
      </div>

      <div className="flow-link-card">
        <div className="flow-link-topbar">
          <strong>Panágua</strong>
          <span>Matheus Corretor</span>
        </div>
        <div className="flow-link-body">
          <p>Olá, FABIANA!</p>
          <span>Preparamos 2 cotações de Automóvel para você.</span>
          <div className="flow-link-quote">
            <div className="flow-link-quote-head">
              <strong>Porto Seguro</strong>
              <span>COMPASS SPORT 1.3</span>
            </div>
            <small>PORTO SEGURO - COMPREENSIVA</small>
            <strong className="flow-link-price">R$ 4.226,40</strong>
            <div className="flow-link-tags">
              <span>100% FIPE</span>
              <span>Guincho</span>
            </div>
            <button type="button">Ver cotação completa →</button>
          </div>
        </div>
      </div>

      <div className="flow-click-burst">click</div>

      <div className="flow-full-quote-card">
        <div className="flow-full-topbar">
          <span>C</span>
          <strong>Porto Seguro</strong>
        </div>
        <div className="flow-full-intro">
          <p>Olá <strong>MARGARETE OLIVEIRA PEREIRA</strong>, aqui está a cotação do seu COMPASS SPORT.</p>
          <div>
            <span>PCI4A59</span>
            <span>ANO 2026</span>
            <span>CHASSI 988...9231</span>
          </div>
        </div>
        <div className="flow-full-price">
          <small>VALOR ANUAL DO SEGURO</small>
          <strong>R$ 4.226,40</strong>
          <span>12x R$ 316,98</span>
        </div>
        <div className="flow-full-coverages">
          <p>COBERTURAS CONTRATADAS</p>
          <div>
            <strong>🚙 Cobertura do veículo</strong>
            <span>100% FIPE</span>
          </div>
          <div>
            <strong>⚖ RCF responsabilidade civil</strong>
            <span>Contratado</span>
          </div>
          <div>
            <strong>🛠 Assistências</strong>
            <span>Incluso</span>
          </div>
          {[
            ["Danos materiais", "R$ 100.000"],
            ["Danos corporais", "R$ 100.000"],
            ["Guincho", "500 km"],
            ["Protecao de vidros", "Incluso"],
            ["Carro reserva", "7 dias"],
          ].map(([label, value]) => (
            <div key={label}>
              <strong>{label}</strong>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-canvas text-ink">
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-canvas/90 backdrop-blur-xl">
        <Container className="flex h-[72px] items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3 no-underline" aria-label="Corretor no Flow">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mahogany font-display text-sm font-extrabold text-gold-light shadow-lg shadow-mahogany/15">
              CF
            </span>
            <span className="leading-none">
              <span className="block font-display text-lg font-extrabold tracking-tight text-mahogany">
                Corretor no Flow
              </span>
              <span className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint sm:block">
                Pre-venda de seguros
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-ink/10 lg:flex" aria-label="Navegacao principal">
            {[
              ["Produto", "#solucao"],
              ["Como funciona", "#problema"],
              ["Diferenciais", "#cta"],
              ["Segurado", "#solucao"],
            ].map(([item, href]) => (
              <a
                key={item}
                href={href}
                className="rounded-full px-4 py-2 text-sm font-bold text-ink-muted no-underline transition-colors hover:bg-canvas hover:text-ink"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="#"
              className="rounded-full px-4 py-2 text-sm font-bold text-ink-muted no-underline transition hover:text-ink"
            >
              Entrar
            </a>
            <a
              href="#"
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink no-underline ring-1 ring-ink/10 transition hover:ring-ink/25"
            >
              Ver proposta
            </a>
            <a
              href="#cta"
              className="inline-flex items-center gap-2 rounded-full bg-mahogany px-5 py-2.5 text-sm font-bold text-gold-light no-underline transition hover:bg-mahogany-light"
            >
              Agendar demo
              <ArrowIcon />
            </a>
          </div>

          <details className="group relative md:hidden">
            <summary className="list-none rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-ink/10 marker:hidden">
              Menu
            </summary>
            <div className="absolute right-0 top-12 w-[min(82vw,320px)] rounded-3xl bg-white p-3 shadow-2xl shadow-ink/15 ring-1 ring-ink/10">
              {[
                ["Produto", "#solucao"],
                ["Como funciona", "#problema"],
                ["Diferenciais", "#cta"],
                ["Ver proposta", "#"],
                ["Entrar", "#"],
              ].map(([item, href]) => (
                <a
                  key={item}
                  href={href}
                  className="block rounded-2xl px-4 py-3 text-sm font-bold text-ink-muted no-underline hover:bg-canvas hover:text-ink"
                >
                  {item}
                </a>
              ))}
              <a
                href="#cta"
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-mahogany px-4 py-3 text-sm font-bold text-gold-light no-underline"
              >
                Agendar demo
                <ArrowIcon />
              </a>
            </div>
          </details>
        </Container>
      </header>

      <section className="relative pt-8 sm:pt-10 lg:pt-12">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="mb-6 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-ember ring-1 ring-ink/10">
                Pre-venda para corretores de seguro
              </p>

              <h1 className="font-display text-[clamp(2.7rem,5.8vw,5.35rem)] font-extrabold leading-[0.95] tracking-tight text-ink">
                Transforme cotacoes em conversas que fecham.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted sm:text-xl">
                O Corretor no Flow troca PDFs frios por propostas interativas,
                comparaveis e prontas para chamar o corretor no momento exato da decisao.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#cta"
                  className="inline-flex justify-center rounded-full bg-mahogany px-6 py-3.5 text-sm font-bold text-gold-light no-underline transition hover:-translate-y-0.5 hover:bg-mahogany-light"
                >
                  Comecar a fechar mais rapido
                </a>
                <a
                  href="#problema"
                  className="inline-flex justify-center rounded-full border border-ink/15 bg-white/55 px-6 py-3.5 text-sm font-bold text-ink no-underline transition hover:border-ink/35 hover:bg-white"
                >
                  Ver o problema
                </a>
              </div>
            </div>

            <div className="relative min-h-[380px] overflow-hidden rounded-[30px] bg-surface ring-1 ring-ink/10 sm:min-h-[440px] lg:min-h-[520px]">
              <Image
                src="/hero-flow-workspace.png"
                alt="Workspace com proposta interativa de seguro e alerta de lead em tempo real"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 56vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/20 via-transparent to-transparent" />
              <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-2 sm:left-6 sm:right-6 sm:top-6">
                {["Proposta aberta", "Lead quente", "Cliente online"].map((item) => (
                  <span key={item} className="rounded-full bg-canvas/90 px-3 py-1.5 text-xs font-bold text-mahogany shadow-lg shadow-ink/10 backdrop-blur-md">
                    {item}
                  </span>
                ))}
              </div>
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-canvas/90 p-4 shadow-2xl shadow-ink/15 backdrop-blur-md ring-1 ring-white/50 sm:inset-x-6 sm:bottom-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-ember">Cliente abriu agora</p>
                    <p className="mt-1 font-display text-lg font-bold text-ink sm:text-2xl">Comparando franquia e cobertura</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-ember px-4 py-2 text-xs font-bold text-white sm:text-sm">
                    chamar
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {heroCards.map((card, index) => (
              <article
                key={card.title}
                className={`hero-card group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[26px] p-6 ring-1 ring-ink/10 ${
                  index === 0
                    ? "bg-mahogany text-gold-light"
                    : index === 1
                      ? "bg-white text-ink"
                      : "bg-gold-light text-mahogany"
                }`}
              >
                <div className="absolute inset-x-6 top-0 h-1 origin-left scale-x-0 bg-ember-light transition-transform duration-300 group-hover:scale-x-100" />
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${index === 0 ? "text-gold/70" : "text-ember"}`}>
                  {card.eyebrow}
                </span>
                <div>
                  <h2 className="max-w-sm font-display text-3xl font-extrabold leading-[1.02] tracking-tight">
                    {card.title}
                  </h2>
                  <p className={`mt-4 max-w-sm text-sm leading-6 ${index === 0 ? "text-gold/75" : "text-ink-muted"}`}>
                    {card.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Container>

        <div className="mt-2 overflow-hidden bg-mahogany py-4">
          <div className="animate-marquee flex whitespace-nowrap">
            {[...Array(2)].map((_, group) => (
              <div key={group} className="flex">
                {marqueeItems.map((item) => (
                  <span key={`${group}-${item}`} className="px-7 text-sm font-bold text-gold-light">
                    {item} <span className="pl-7 text-gold/45">/</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 rounded-[34px] bg-white p-4 ring-1 ring-ink/10 sm:p-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:p-8">
            <div className="px-2 py-4 sm:px-4">
              <p className="section-kicker">Microinteracao</p>
              <h2 className="mt-4 max-w-xl font-display text-[clamp(2rem,4vw,4rem)] font-extrabold leading-[0.98] tracking-tight text-ink">
                Arraste o PDF. O Flow transforma em conversa.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-ink-muted sm:text-lg">
                A ideia do produto fica visivel em segundos: upload, leitura da cotacao e uma proposta pronta para o segurado responder.
              </p>
            </div>

            <FlowDemo />
          </div>
        </Container>
      </section>

      <section id="problema" className="py-20 sm:py-28">
        <Container>
          <div className="max-w-3xl">
            <p className="section-kicker">O problema</p>
            <h2 className="section-title">Cotacao boa tambem perde quando chega do jeito errado.</h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {problemItems.map((item) => (
              <article key={item.title} className="rounded-3xl bg-white p-6 ring-1 ring-ink/10">
                <h3 className="font-display text-xl font-bold text-ink">{item.title}</h3>
                <p className="mt-4 text-[15px] leading-7 text-ink-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="solucao" className="bg-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="section-kicker">A solucao</p>
              <h2 className="section-title">Uma proposta que abre caminho para a conversa.</h2>
              <p className="mt-6 text-lg leading-8 text-ink-muted">
                Em vez de entregar um documento parado, o Flow cria uma pagina clara para o segurado entender,
                comparar e chamar o corretor sem sair do celular.
              </p>
            </div>

            <div className="rounded-[28px] bg-canvas p-4 ring-1 ring-ink/10">
              <div className="rounded-3xl bg-mahogany p-5 text-gold-light">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold/70">Fluxo de conversao</p>
                  <span className="rounded-full bg-ember px-3 py-1 text-xs font-bold text-white">ao vivo</span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {solutionItems.map((item) => (
                    <div key={item} className="rounded-2xl bg-white/8 p-4 text-sm leading-6 text-gold-light ring-1 ring-white/10">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="section-kicker">Features</p>
              <h2 className="section-title">Feito para o corretor vender no ritmo do cliente.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-ink-muted">
              Rascunho de posicionamento inspirado por SaaS de alta conversao: clareza, velocidade e impacto emocional.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {featureItems.map((item) => (
              <article key={item.title} className="rounded-3xl border border-ink/10 bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ember">{item.label}</p>
                <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">{item.title}</h3>
                <p className="mt-4 leading-7 text-ink-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-mahogany py-20 text-gold-light sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold/70">Diferenciacao</p>
              <h2 className="mt-4 font-display text-[clamp(2rem,5vw,4.4rem)] font-extrabold leading-none tracking-tight text-canvas">
                Isto nao e um gerador de PDF.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/7 p-6 ring-1 ring-white/10">
                <p className="font-display text-xl font-bold text-canvas">Outras ferramentas</p>
                <p className="mt-4 leading-7 text-gold/75">Geram PDFs, organizam dados e ajudam a montar documentos.</p>
              </div>
              <div className="rounded-3xl bg-gold-light p-6 text-mahogany">
                <p className="font-display text-xl font-bold">Corretor no Flow</p>
                <p className="mt-4 leading-7 text-mahogany/80">
                  Converte interesse em conversa e transforma velocidade em receita.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-4">
            {boldStatements.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 px-4 py-5 font-display text-lg font-bold text-canvas">
                {item}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="cta" className="py-20 text-center sm:py-28">
        <Container className="max-w-4xl">
          <p className="section-kicker justify-center">Comece pelo rascunho certo</p>
          <h2 className="mt-4 font-display text-[clamp(2.4rem,6vw,5rem)] font-extrabold leading-[0.96] tracking-tight">
            Coloque suas vendas em flow.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ink-muted">
            Nunca deixe um lead quente esfriar dentro de um PDF ou de uma conversa perdida.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#" className="rounded-full bg-mahogany px-7 py-4 text-sm font-bold text-gold-light no-underline transition hover:bg-mahogany-light">
              Nunca perder um lead quente
            </a>
            <a href="#" className="rounded-full bg-white px-7 py-4 text-sm font-bold text-ink no-underline ring-1 ring-ink/10 transition hover:ring-ink/25">
              Ver proposta exemplo
            </a>
          </div>
        </Container>
      </section>

      <footer className="border-t border-ink/10 py-8">
        <Container className="flex flex-col justify-between gap-3 text-sm text-ink-muted sm:flex-row">
          <span className="font-display font-bold text-mahogany">Corretor no Flow</span>
          <span>Rascunho de home para validacao visual e de copy.</span>
        </Container>
      </footer>
    </main>
  );
}
