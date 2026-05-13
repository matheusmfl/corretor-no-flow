"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const FLOW_DURATION_MS = 24000;
const PUBLIC_STAGE_MS = 10800;
const HAND_STAGE_MS = 12500;
const AUTO_SCROLL_MS = 15600;
const RESET_SCROLL_MS = 23200;

const INSURER_LOGO_SRC = {
  porto: "/logos/porto-seguro.svg",
  tokio: "/logos/tokio-marine.svg",
  azul: "/logos/azul-seguros.svg",
  bradesco: "/logos/bradesco-seguros.svg",
} as const;

type InsurerSlug = keyof typeof INSURER_LOGO_SRC;

const INSURER_LOGO_LABEL: Record<InsurerSlug, string> = {
  porto: "Porto Seguro",
  tokio: "Tokio Marine",
  azul: "Azul Seguros",
  bradesco: "Bradesco Seguros",
};

function FlowInsurerLogo({
  slug,
  width,
  height,
  className = "",
  variant = "light",
}: {
  slug: InsurerSlug;
  width: number;
  height: number;
  className?: string;
  variant?: "light" | "onBrand";
}) {
  return (
    <span
      className={`flow-insurer-logo flow-insurer-logo--${variant} ${className}`.trim()}
      role="img"
      aria-label={INSURER_LOGO_LABEL[slug]}
    >
      <Image
        src={INSURER_LOGO_SRC[slug]}
        alt=""
        width={width}
        height={height}
        className="flow-insurer-logo-img"
        unoptimized
      />
    </span>
  );
}

export function FlowDemo() {
  const [cycleKey, setCycleKey] = useState(0);
  const [showHand, setShowHand] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => {
        scrollRef.current?.scrollTo({ top: 0 });
      }, PUBLIC_STAGE_MS),
      window.setTimeout(() => {
        setShowHand(true);
      }, HAND_STAGE_MS),
      window.setTimeout(() => {
        setShowHand(false);
        scrollRef.current?.scrollTo({ top: 230, behavior: "smooth" });
      }, AUTO_SCROLL_MS),
      window.setTimeout(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, RESET_SCROLL_MS),
    ];

    const interval = window.setInterval(() => {
      setShowHand(false);
      scrollRef.current?.scrollTo({ top: 0 });
      setCycleKey((key) => key + 1);
    }, FLOW_DURATION_MS);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearInterval(interval);
    };
  }, [cycleKey]);

  return (
    <div
      key={cycleKey}
      className="flow-demo"
      style={{ "--flowDuration": `${FLOW_DURATION_MS}ms` } as React.CSSProperties}
      aria-label="Animacao: PDF virando proposta interativa"
    >
      <div className="flow-demo-grid" />
      <div className="flow-dropzone">
        <span className="flow-dropzone-kicker">Solte o PDF aqui</span>
        <span className="flow-dropzone-title">Cotacao Auto</span>
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
          <strong>Corretor No Flow</strong>
          <span>Sua seguradora</span>
        </div>
        <div className="flow-link-body">
          <p>Ola, cliente!</p>
          <span>Preparamos 2 cotacoes de automovel para voce comparar com clareza.</span>
          <div className="flow-link-quote">
            <div className="flow-link-quote-head">
              <div className="flow-quote-head-main">
                <FlowInsurerLogo slug="porto" width={72} height={22} />
                <strong>Porto Seguro</strong>
              </div>
              <span>COMPASS SPORT 1.3</span>
            </div>
            <small>Compreensiva</small>
            <strong className="flow-link-price">R$ 4.226,40</strong>
            <div className="flow-link-tags">
              <span>100% FIPE</span>
              <span>Guincho</span>
            </div>
            <div className="flow-link-quote-teaser">
              <FlowInsurerLogo slug="tokio" width={56} height={18} />
              <span>Tokio Marine · comparar no link completo</span>
            </div>
            <button type="button">Ver cotacao completa -&gt;</button>
          </div>
        </div>
      </div>

      <div className="flow-click-burst">abrir</div>

      <div className="flow-full-quote-card">
        <div className="flow-full-topbar">
          <FlowInsurerLogo slug="porto" width={72} height={22} variant="onBrand" />
          <strong>Corretor No Flow</strong>
          <small>Valido ate 12/05</small>
        </div>

        <div
          ref={scrollRef}
          className="flow-public-scroll-shell"
          onScroll={() => setShowHand(false)}
        >
          <div className="flow-public-scroll">
            <div className="flow-full-intro">
              <h3>
                Ola, <strong>Fabiana!</strong>
              </h3>
              <p>Cotacao Porto Seguro para seu COMPASS SPORT 1.3.</p>
            </div>

            <div className="flow-public-card flow-porto-detail-card">
              <div className="flow-public-card-head">
                <div className="flow-public-card-head-main">
                  <FlowInsurerLogo slug="porto" width={72} height={22} variant="onBrand" />
                  <strong>Porto Seguro</strong>
                </div>
                <span>COMPASS SPORT 1.3</span>
              </div>

              <div className="flow-public-card-body">
                <div className="flow-vehicle-summary">
                  <span>ABC1D23</span>
                  <span>2026</span>
                  <span>Compreensiva</span>
                </div>

                <div className="flow-full-price">
                  <small>Valor anual</small>
                  <strong>R$ 4.226,40</strong>
                  <span className="flow-selected-installment">ou 12x R$ 316,98 sem juros</span>
                </div>

                <div className="flow-porto-highlight">
                  <span>Franquia reduzida</span>
                  <strong>R$ 4.850,00</strong>
                </div>

                <div className="flow-quote-section">
                  <p>Coberturas Porto</p>
                  {[
                    ["Cobertura do veiculo", "100% FIPE"],
                    ["Danos materiais", "R$ 100.000"],
                    ["Danos corporais", "R$ 100.000"],
                    ["Danos morais", "R$ 10.000"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="flow-quote-section">
                  <p>Assistencias contratadas</p>
                  {[
                    ["Guincho", "500 km"],
                    ["Vidros", "Completo"],
                    ["Carro reserva", "7 dias"],
                    ["Assistencia 24h", "Incluso"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="flow-payment-box flow-detail-payment">
                  <p>Formas de pagamento</p>
                  <div className="flow-payment-tabs" aria-hidden="true">
                    <span>Pix com desconto</span>
                    <span>Cartao em 12x</span>
                    <span>Boleto</span>
                  </div>
                  <div className="flow-payment-summary">
                    <strong>Cartao selecionado</strong>
                    <span>12x R$ 316,98</span>
                  </div>
                </div>

                <button type="button" className="flow-public-button">
                  Chamar corretor no WhatsApp -&gt;
                </button>
              </div>
            </div>

            <div className="flow-public-footer">
              <FlowInsurerLogo slug="porto" width={56} height={18} />
              <p>Fale com sua corretora no WhatsApp para tirar duvidas.</p>
            </div>
          </div>

          <div className={`flow-scroll-hand ${showHand ? "is-visible" : ""}`} aria-hidden="true">
            <span className="flow-hand-emoji">👇</span>
            <small>role</small>
          </div>
        </div>
      </div>
    </div>
  );
}
