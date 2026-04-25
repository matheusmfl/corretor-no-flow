const steps = [
  {
    step: "01",
    title: "Envie o PDF",
    body: "Faça upload da cotação da seguradora. Nossa IA lê e extrai todas as coberturas, parcelas e dados do veículo automaticamente.",
    accent: "var(--color-ember-light)",
  },
  {
    step: "02",
    title: "Revise e personalize",
    body: "Confirme os dados extraídos, ajuste o que precisar e aplique a logo e a cor primária da sua corretora.",
    accent: "var(--color-ember)",
  },
  {
    step: "03",
    title: "Compartilhe o link",
    body: "Gere um link mobile-first para o segurado. Com botão de WhatsApp, QR Code no PDF e notificação quando ele abrir.",
    accent: "var(--color-mahogany)",
  },
];

const stats = [
  { value: "2 min",   label: "para gerar uma proposta completa" },
  { value: "100%",    label: "LGPD — PDF apagado após extração" },
  { value: "30 dias", label: "prazo padrão do link dinâmico" },
];

const marqueeItems = [
  "Bradesco AUTO", "Upload de PDF", "IA extrai tudo", "Proposta personalizada",
  "Link dinâmico", "QR Code", "Notificação em tempo real", "LGPD compliant",
  "Identidade visual do corretor", "Histórico de cotações",
];

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`max-w-6xl mx-auto px-6 md:px-10 lg:px-16 ${className}`}>
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-canvas text-ink">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-canvas border-b border-surface-strong">
        <Container className="flex items-center justify-between h-16">
          <span className="font-display font-extrabold text-xl text-mahogany tracking-tight">
            corretor<span className="text-ember">.</span>flow
          </span>

          <div className="hidden md:flex items-center gap-8">
            {["Funcionalidades", "Preços", "Blog"].map((item) => (
              <a key={item} href="#" className="text-sm font-medium text-ink-muted hover:text-ink transition-colors no-underline">
                {item}
              </a>
            ))}
          </div>

          <div className="flex gap-2.5">
            <a href="#" className="px-5 py-2 rounded-full bg-surface text-ink text-sm font-medium no-underline border border-surface-strong hover:bg-surface-strong transition-colors">
              Entrar ↗
            </a>
            <a href="#" className="px-5 py-2 rounded-full bg-mahogany text-gold-light text-sm font-medium no-underline hover:bg-mahogany-light transition-colors">
              Começar grátis ↗
            </a>
          </div>
        </Container>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-24 pb-20">
        <Container>
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-surface-strong text-[13px] font-medium text-ember mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-ember" />
            Novo: geração de PDF com QR Code →
          </div>

          <h1 className="animate-fade-up delay-100 font-display font-extrabold text-[clamp(40px,6vw,80px)] leading-[1.05] tracking-tight text-ink max-w-3xl mb-7">
            Suas cotações,<br />
            com a cara da<br />
            <span className="text-ember">sua corretora.</span>
          </h1>

          <p className="animate-fade-up delay-200 text-lg md:text-xl leading-relaxed text-ink-muted max-w-lg mb-10 font-light">
            Transforme PDFs técnicos da seguradora em propostas que o segurado
            entende — com link dinâmico, QR code e sua identidade visual.
          </p>

          <div className="animate-fade-up delay-300 flex gap-3 flex-wrap">
            <a href="#" className="px-7 py-3.5 rounded-full bg-mahogany text-gold-light text-[15px] font-semibold no-underline inline-flex items-center gap-2 hover:bg-mahogany-light hover:-translate-y-px transition-all duration-200">
              Criar conta grátis ↗
            </a>
            <a href="#" className="px-7 py-3.5 rounded-full border border-surface-strong text-ink-muted text-[15px] font-medium no-underline hover:border-ink-muted hover:text-ink transition-all duration-200">
              Ver demonstração
            </a>
          </div>
        </Container>
      </section>

      {/* ── Marquee ── */}
      <div className="bg-mahogany py-4 overflow-hidden border-t border-b border-mahogany-light">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="flex font-display text-sm font-semibold text-gold tracking-wide">
              {marqueeItems.map((item) => (
                <span key={item} className="px-8">
                  {item}
                  <span className="ml-8 opacity-40">·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Como funciona ── */}
      <section className="py-24">
        <Container>
          <p className="text-xs font-semibold tracking-[2px] uppercase text-ember mb-4">
            Como funciona
          </p>
          <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] tracking-tight text-ink mb-16 max-w-sm leading-tight">
            Do PDF técnico à proposta elegante em minutos.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ step, title, body, accent }) => (
              <div key={step} className="bg-surface rounded-2xl p-8 border border-surface-strong relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(43,10,10,0.08)] transition-all duration-200">
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: accent }} />
                <span className="font-display font-extrabold text-5xl text-surface-strong leading-none block mb-5 tracking-tight">
                  {step}
                </span>
                <h3 className="font-display font-bold text-xl text-ink mb-3">{title}</h3>
                <p className="text-[15px] leading-relaxed text-ink-muted font-light">{body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Stats ── */}
      <section className="bg-surface border-t border-b border-surface-strong py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-surface-strong rounded-2xl overflow-hidden">
            {stats.map(({ value, label }) => (
              <div key={value} className="bg-canvas px-10 py-12 text-center">
                <div className="font-display font-extrabold text-[clamp(36px,5vw,52px)] tracking-tight text-mahogany leading-none mb-3">
                  {value}
                </div>
                <div className="text-xs font-medium uppercase tracking-widest text-ink-faint">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA final ── */}
      <section className="bg-mahogany py-24 text-center">
        <Container>
          <p className="text-xs font-semibold tracking-[2px] uppercase text-gold opacity-70 mb-5">
            Comece hoje
          </p>
          <h2 className="font-display font-extrabold text-[clamp(28px,5vw,52px)] tracking-tight text-canvas mb-5 leading-tight">
            Pronto para modernizar<br />sua corretora?
          </h2>
          <p className="text-lg text-gold opacity-70 mb-10 font-light leading-relaxed">
            Sem cartão de crédito. Configure em menos de 5 minutos.
          </p>
          <a href="#" className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-canvas text-mahogany text-[15px] font-bold no-underline font-display hover:bg-gold-light hover:-translate-y-0.5 transition-all duration-200">
            Criar conta grátis ↗
          </a>
        </Container>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-mahogany border-t border-white/[0.06] py-8">
        <Container className="flex items-center justify-between">
          <span className="font-display font-extrabold text-base text-gold opacity-60">
            corretor<span className="text-ember-light">.</span>flow
          </span>
          <span className="text-sm text-gold opacity-40">
            © 2026 · Todos os direitos reservados
          </span>
        </Container>
      </footer>

    </main>
  );
}
