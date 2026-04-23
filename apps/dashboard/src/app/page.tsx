'use client'

export default function Home() {
  return (
    <main style={{ backgroundColor: "var(--color-canvas)", color: "var(--color-ink)" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "var(--color-canvas)",
        borderBottom: "1px solid var(--color-surface-strong)",
        padding: "0 5%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "64px",
      }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800, fontSize: "20px",
          color: "var(--color-mahogany)",
          letterSpacing: "-0.5px",
        }}>
          corretor<span style={{ color: "var(--color-ember)" }}>.</span>flow
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {["Funcionalidades", "Preços", "Blog"].map((item) => (
            <a key={item} href="#" style={{
              fontSize: "14px", fontWeight: 500,
              color: "var(--color-ink-muted)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-ink)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-ink-muted)")}
            >{item}</a>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <a href="#" style={{
            padding: "9px 20px", borderRadius: "999px",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-ink)", fontSize: "14px", fontWeight: 500,
            textDecoration: "none",
            transition: "background-color 0.2s",
            border: "1px solid var(--color-surface-strong)",
          }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-surface-strong)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-surface)")}
          >Entrar ↗</a>

          <a href="#" style={{
            padding: "9px 20px", borderRadius: "999px",
            backgroundColor: "var(--color-mahogany)",
            color: "var(--color-gold-light)", fontSize: "14px", fontWeight: 500,
            textDecoration: "none",
            transition: "background-color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-mahogany-light)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--color-mahogany)")}
          >Começar grátis ↗</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        padding: "96px 5% 80px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        <div className="animate-fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 14px", borderRadius: "999px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-surface-strong)",
          fontSize: "13px", fontWeight: 500,
          color: "var(--color-ember)",
          marginBottom: "32px",
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            backgroundColor: "var(--color-ember)",
            display: "inline-block",
          }} />
          Novo: geração de PDF com QR Code →
        </div>

        <h1 className="animate-fade-up delay-100" style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(48px, 7vw, 88px)",
          lineHeight: 1.05,
          letterSpacing: "-2px",
          color: "var(--color-ink)",
          maxWidth: "820px",
          marginBottom: "28px",
        }}>
          Suas cotações,<br />
          com a cara da<br />
          <span style={{ color: "var(--color-ember)" }}>sua corretora.</span>
        </h1>

        <p className="animate-fade-up delay-200" style={{
          fontSize: "clamp(17px, 2vw, 20px)",
          lineHeight: 1.6,
          color: "var(--color-ink-muted)",
          maxWidth: "520px",
          marginBottom: "40px",
          fontWeight: 300,
        }}>
          Transforme PDFs técnicos da seguradora em propostas que o segurado
          entende — com link dinâmico, QR code e sua identidade visual.
        </p>

        <div className="animate-fade-up delay-300" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href="#" style={{
            padding: "14px 28px", borderRadius: "999px",
            backgroundColor: "var(--color-mahogany)",
            color: "var(--color-gold-light)",
            fontSize: "15px", fontWeight: 600,
            textDecoration: "none",
            transition: "background-color 0.2s, transform 0.15s",
            display: "inline-flex", alignItems: "center", gap: "8px",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "var(--color-mahogany-light)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "var(--color-mahogany)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Criar conta grátis ↗
          </a>

          <a href="#" style={{
            padding: "14px 28px", borderRadius: "999px",
            backgroundColor: "transparent",
            color: "var(--color-ink-muted)",
            fontSize: "15px", fontWeight: 500,
            textDecoration: "none",
            border: "1px solid var(--color-surface-strong)",
            transition: "border-color 0.2s, color 0.2s",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--color-ink-muted)";
              e.currentTarget.style.color = "var(--color-ink)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--color-surface-strong)";
              e.currentTarget.style.color = "var(--color-ink-muted)";
            }}
          >
            Ver demonstração
          </a>
        </div>
      </section>

      {/* ── Marquee ── */}
      <div style={{
        backgroundColor: "var(--color-mahogany)",
        padding: "18px 0",
        overflow: "hidden",
        borderTop: "1px solid var(--color-mahogany-light)",
        borderBottom: "1px solid var(--color-mahogany-light)",
      }}>
        <div className="animate-marquee" style={{ display: "flex", whiteSpace: "nowrap" }}>
          {[...Array(2)].map((_, i) => (
            <span key={i} style={{
              display: "flex", gap: "0",
              fontFamily: "var(--font-display)",
              fontSize: "14px", fontWeight: 600,
              color: "var(--color-gold)",
              letterSpacing: "0.3px",
            }}>
              {[
                "Bradesco AUTO",
                "Upload de PDF",
                "IA extrai tudo",
                "Proposta personalizada",
                "Link dinâmico",
                "QR Code",
                "Notificação em tempo real",
                "LGPD compliant",
                "Identidade visual do corretor",
                "Histórico de cotações",
              ].map((item) => (
                <span key={item} style={{ padding: "0 32px" }}>
                  {item}
                  <span style={{ marginLeft: "32px", opacity: 0.4 }}>·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Como funciona ── */}
      <section style={{ padding: "96px 5%", maxWidth: "1200px", margin: "0 auto" }}>
        <p style={{
          fontSize: "12px", fontWeight: 600, letterSpacing: "2px",
          textTransform: "uppercase", color: "var(--color-ember)",
          marginBottom: "16px",
        }}>Como funciona</p>

        <h2 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800, fontSize: "clamp(32px, 4vw, 48px)",
          letterSpacing: "-1px", color: "var(--color-ink)",
          marginBottom: "64px", maxWidth: "480px", lineHeight: 1.1,
        }}>
          Do PDF técnico à proposta elegante em minutos.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {[
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
          ].map(({ step, title, body, accent }) => (
            <div key={step} style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "16px",
              padding: "36px 32px",
              border: "1px solid var(--color-surface-strong)",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(43,10,10,0.08)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                backgroundColor: accent,
              }} />
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "48px", fontWeight: 800,
                color: "var(--color-surface-strong)",
                lineHeight: 1, display: "block", marginBottom: "20px",
                letterSpacing: "-2px",
              }}>{step}</span>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px", fontWeight: 700,
                color: "var(--color-ink)", marginBottom: "12px",
              }}>{title}</h3>
              <p style={{
                fontSize: "15px", lineHeight: 1.65,
                color: "var(--color-ink-muted)", fontWeight: 300,
              }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-surface-strong)",
        borderBottom: "1px solid var(--color-surface-strong)",
        padding: "64px 5%",
      }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1px", backgroundColor: "var(--color-surface-strong)",
          borderRadius: "16px", overflow: "hidden",
        }}>
          {[
            { value: "2 min", label: "para gerar uma proposta completa" },
            { value: "100%", label: "LGPD — PDF apagado após extração" },
            { value: "30 dias", label: "prazo padrão do link dinâmico" },
          ].map(({ value, label }) => (
            <div key={value} style={{
              backgroundColor: "var(--color-canvas)",
              padding: "48px 40px",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 5vw, 56px)",
                fontWeight: 800, letterSpacing: "-2px",
                color: "var(--color-mahogany)",
                lineHeight: 1,
                marginBottom: "12px",
              }}>{value}</div>
              <div style={{
                fontSize: "13px", fontWeight: 500,
                textTransform: "uppercase", letterSpacing: "1px",
                color: "var(--color-ink-faint)",
              }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{
        backgroundColor: "var(--color-mahogany)",
        padding: "96px 5%",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: "12px", fontWeight: 600, letterSpacing: "2px",
          textTransform: "uppercase", color: "var(--color-gold)",
          marginBottom: "20px", opacity: 0.7,
        }}>Comece hoje</p>

        <h2 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800, fontSize: "clamp(32px, 5vw, 56px)",
          letterSpacing: "-1.5px", color: "var(--color-canvas)",
          marginBottom: "20px", lineHeight: 1.1,
        }}>
          Pronto para modernizar<br />sua corretora?
        </h2>

        <p style={{
          fontSize: "17px", color: "var(--color-gold)",
          opacity: 0.7, marginBottom: "40px",
          fontWeight: 300, lineHeight: 1.6,
        }}>
          Sem cartão de crédito. Configure em menos de 5 minutos.
        </p>

        <a href="#" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "16px 36px", borderRadius: "999px",
          backgroundColor: "var(--color-canvas)",
          color: "var(--color-mahogany)",
          fontSize: "15px", fontWeight: 700,
          textDecoration: "none",
          transition: "background-color 0.2s, transform 0.15s",
          fontFamily: "var(--font-display)",
        }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "var(--color-gold-light)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "var(--color-canvas)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Criar conta grátis ↗
        </a>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        backgroundColor: "var(--color-mahogany)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 5%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: "16px", color: "var(--color-gold)", opacity: 0.6,
        }}>
          corretor<span style={{ color: "var(--color-ember-light)" }}>.</span>flow
        </span>
        <span style={{ fontSize: "13px", color: "var(--color-gold)", opacity: 0.4 }}>
          © 2026 · Todos os direitos reservados
        </span>
      </footer>

    </main>
  );
}
