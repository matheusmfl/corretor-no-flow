import { Injectable } from '@nestjs/common';
import { Insurer } from '@prisma/client';
import type { AutoQuoteData } from '@corretor/types';

// ── Brand colors por seguradora ──────────────────────────────────────────────
const INSURER_CONFIG: Record<Insurer, { label: string; brand: string }> = {
  BRADESCO:     { label: 'Bradesco Seguros',  brand: '#cc0000' },
  PORTO_SEGURO: { label: 'Porto Seguro',      brand: '#003087' },
  TOKIO_MARINE: { label: 'Tokio Marine',      brand: '#d4001a' },
  SULAMERICA:   { label: 'SulAmérica',        brand: '#e30613' },
  SUHAI:        { label: 'Suhai',             brand: '#0066cc' },
  ALIRO:        { label: 'Aliro',             brand: '#1f2d3d' },
  ALLIANZ:      { label: 'Allianz',           brand: '#003781' },
  YELLOW:       { label: 'Yellow Seguros',    brand: '#f5b500' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number | undefined | null): string {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function esc(v: string | null | undefined): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function partialChassis(chassis: string | undefined): string {
  if (!chassis || chassis.length < 8) return chassis ?? '';
  return `${chassis.slice(0, 3)}···${chassis.slice(-4)}`;
}

// Pega a melhor opção de parcelamento para exibir no hero.
// Prioridade: credit_bradesco > credit_card. Dentro de cada método, busca o maior
// número de parcelas SEM JUROS (total ≈ premiumTotal, tolerância 2%).
function bestInstallment(
  methods: AutoQuoteData['paymentMethods'],
  premiumTotal: number,
): { count: number; amount: number; label: string } | null {
  const ordered = [
    methods.find((m) => m.type === 'credit_bradesco'),
    methods.find((m) => m.type === 'credit_card'),
  ].filter((m): m is AutoQuoteData['paymentMethods'][0] => m !== undefined);

  const tolerance = premiumTotal * 0.02;

  for (const method of ordered) {
    const semJuros = method.installments.filter((inst) => {
      const total = inst.total ?? inst.amount * inst.number;
      return Math.abs(total - premiumTotal) <= tolerance;
    });
    if (semJuros.length > 0) {
      const best = semJuros[semJuros.length - 1];
      const label = method.type === 'credit_bradesco' ? 'Cartão Bradesco' : 'Cartão de Crédito';
      return { count: best.number, amount: best.amount, label };
    }
  }

  // Fallback: maior parcelamento disponível em qualquer cartão
  for (const method of ordered) {
    if (method.installments.length > 0) {
      const last = method.installments[method.installments.length - 1];
      const label = method.type === 'credit_bradesco' ? 'Cartão Bradesco' : 'Cartão de Crédito';
      return { count: last.number, amount: last.amount, label };
    }
  }

  return null;
}

// Gera cores derivadas (brand-light e brand-mid) a partir da cor brand em hex
function deriveColors(brand: string): { light: string; mid: string } {
  // Converte hex → rgb para interpolação manual
  const r = parseInt(brand.slice(1, 3), 16);
  const g = parseInt(brand.slice(3, 5), 16);
  const b = parseInt(brand.slice(5, 7), 16);
  const mix = (ratio: number, bg = 255) =>
    Math.round(r * ratio + bg * (1 - ratio)).toString(16).padStart(2, '0') +
    Math.round(g * ratio + bg * (1 - ratio)).toString(16).padStart(2, '0') +
    Math.round(b * ratio + bg * (1 - ratio)).toString(16).padStart(2, '0');
  return { light: `#${mix(0.15)}`, mid: `#${mix(0.6)}` };
}

// Retorna a melhor parcela de um único método (sem juros se possível, senão max)
function bestInstallmentForMethod(
  method: AutoQuoteData['paymentMethods'][0],
  premiumTotal: number,
): { count: number; amount: number; semJuros: boolean } | null {
  if (method.installments.length === 0) return null;
  const tolerance = premiumTotal * 0.02;
  const semJuros = method.installments.filter((inst) => {
    const total = inst.total ?? inst.amount * inst.number;
    return Math.abs(total - premiumTotal) <= tolerance;
  });
  if (semJuros.length > 0) {
    const last = semJuros[semJuros.length - 1];
    return { count: last.number, amount: last.amount, semJuros: true };
  }
  const last = method.installments[method.installments.length - 1];
  return { count: last.number, amount: last.amount, semJuros: false };
}

function renderPaymentTable(method: AutoQuoteData['paymentMethods'][0]): string {
  const rows = method.installments.map((inst, i) => `
    <tr${i === 0 ? ' class="highlighted"' : ''}>
      <td>${inst.number}×</td>
      <td>${fmt(inst.amount)}</td>
      <td>${inst.total != null ? fmt(inst.total) : '—'}</td>
    </tr>`).join('');
  return `
    <table class="pgto-table">
      <thead><tr><th>Nº</th><th>Parcelas</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── Tipos internos ────────────────────────────────────────────────────────────

interface QuoteData {
  insurer: Insurer;
  name: string | null;
  extractedData: Record<string, unknown> | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class QuotePdfTemplateService {
  render(quote: QuoteData): string {
    const config = INSURER_CONFIG[quote.insurer] ?? { label: String(quote.insurer), brand: '#1f2d3d' };
    const { light: brandLight, mid: brandMid } = deriveColors(config.brand);
    const d = (quote.extractedData ?? {}) as Partial<AutoQuoteData>;

    const vehicle   = d.vehicle   ?? { model: '' };
    const driver    = d.driver    ?? {};
    const coverage  = d.coverage  ?? {};
    const deductibles = (d.deductibles ?? []).filter((x) => x.value > 0);
    const premium   = d.premium   ?? { total: 0 };
    const methods   = d.paymentMethods ?? [];

    const best = bestInstallment(methods, premium.total);
    const mainDeductible = coverage.vehicle?.deductible;
    const mainDeductibleType = coverage.vehicle?.deductibleType;

    // ── Seção: coberturas ──────────────────────────────────────────────────

    const vehicleGroup = `
      <div class="cob-group">
        <div class="cob-group-header">
          <span class="cob-group-icon">🚗</span>
          <span class="cob-group-title">Cobertura do Veículo</span>
          ${coverage.vehicle?.fipePercentage != null ? `<span class="cob-group-badge highlight">${coverage.vehicle.fipePercentage}% FIPE</span>` : ''}
        </div>
        <div class="fipe-hero">
          <div class="fipe-pct">${coverage.vehicle?.fipePercentage ?? '—'}%</div>
          <div class="fipe-desc">do valor da tabela FIPE está coberto em caso de perda total, roubo ou furto.</div>
        </div>
      </div>`;

    const rcf = coverage.rcf;
    const rcfGroup = `
      <div class="cob-group">
        <div class="cob-group-header">
          <span class="cob-group-icon">⚖️</span>
          <span class="cob-group-title">RCF — Responsabilidade Civil Facultativa</span>
          <span class="cob-group-badge">Contratado</span>
        </div>
        <div class="cob-row">
          <span class="cr-label">Danos Materiais (D.M.)</span>
          ${rcf?.propertyDamage ? `<span class="cr-val">${fmt(rcf.propertyDamage)}</span>` : '<span class="cr-zero">Não contratado</span>'}
        </div>
        <div class="cob-row">
          <span class="cr-label">Danos Corporais (D.C.)</span>
          ${rcf?.bodilyInjury ? `<span class="cr-val">${fmt(rcf.bodilyInjury)}</span>` : '<span class="cr-zero">Não contratado</span>'}
        </div>
        <div class="cob-row">
          <span class="cr-label">Danos Morais</span>
          ${rcf?.moralDamages ? `<span class="cr-val">${fmt(rcf.moralDamages)}</span>` : '<span class="cr-zero">Não contratado</span>'}
        </div>
        <div class="cob-row">
          <span class="cr-label">Guarda e Uso (G.U.)</span>
          ${rcf?.combinedSingle ? `<span class="cr-val">${fmt(rcf.combinedSingle)}</span>` : '<span class="cr-zero">Não contratado</span>'}
        </div>
      </div>`;

    const app = coverage.app;
    const appGroup = `
      <div class="cob-group">
        <div class="cob-group-header">
          <span class="cob-group-icon">🏥</span>
          <span class="cob-group-title">APP — Acidentes Pessoais de Passageiros</span>
          <span class="cob-group-badge">Contratado</span>
        </div>
        <div class="cob-row">
          <span class="cr-label">Morte por Passageiro</span>
          ${app?.death ? `<span class="cr-val">${fmt(app.death)}</span>` : '<span class="cr-zero">Não contratado</span>'}
        </div>
        <div class="cob-row">
          <span class="cr-label">Invalidez por Passageiro</span>
          ${app?.disability ? `<span class="cr-val">${fmt(app.disability)}</span>` : '<span class="cr-zero">Não contratado</span>'}
        </div>
        <div class="cob-row">
          <span class="cr-label">Despesas Médicas</span>
          ${app?.medical ? `<span class="cr-val">${fmt(app.medical)}</span>` : '<span class="cr-zero">Não contratado</span>'}
        </div>
        <div class="cob-row">
          <span class="cr-label">Lotação Oficial</span>
          ${app?.passengerCount ? `<span class="cr-val">${app.passengerCount} passageiros</span>` : '<span class="cr-zero">—</span>'}
        </div>
      </div>`;

    const assist = coverage.assistance;
    const assistGroup = `
      <div class="cob-group">
        <div class="cob-group-header">
          <span class="cob-group-icon">🛠️</span>
          <span class="cob-group-title">Assistências</span>
          <span class="cob-group-badge">Contratado</span>
        </div>
        <div class="cob-row">
          <span class="cr-label">Guincho</span>
          ${assist?.towing ? '<span class="cr-val">Incluso</span>' : '<span class="cr-zero">Não contratado</span>'}
        </div>
        <div class="cob-row">
          <span class="cr-label">Proteção de Vidros</span>
          ${assist?.glassProtection ? '<span class="cr-val">Incluso</span>' : '<span class="cr-zero">Não contratado</span>'}
        </div>
        ${assist?.replacementVehicle ? `
        <div class="cob-row">
          <span class="cr-label">Veículo Reserva</span>
          <span class="cr-val">${assist.replacementDays ? `${assist.replacementDays} dias` : 'Incluso'}</span>
        </div>` : ''}
      </div>`;

    // ── Seção: franquias ───────────────────────────────────────────────────

    const deductibleRows = deductibles.map((d) => `
      <div class="franquia-row">
        <span class="fr-label">${esc(d.item)}${d.type ? ` <span style="font-size:11px;color:var(--text-3);font-family:var(--mono);">(${esc(d.type)})</span>` : ''}</span>
        <span class="fr-val">${fmt(d.value)}</span>
      </div>`).join('');

    // ── Seção: pagamento ───────────────────────────────────────────────────

    const TAB_IDS: Record<string, string> = {
      debit:           'deb',
      credit_bradesco: 'ccb',
      credit_card:     'cc',
      coupon:          'carne',
    };

    const tabButtons = methods.map((m, i) => `
      <button class="tab-btn${i === 0 ? ' active' : ''}" onclick="switchTab(this,'${TAB_IDS[m.type] ?? m.type}')" role="tab">
        ${esc(m.label)}
      </button>`).join('');

    const tabPanels = methods.map((m, i) => `
      <div class="tab-panel${i === 0 ? ' active' : ''}" id="tab-${TAB_IDS[m.type] ?? m.type}">
        ${renderPaymentTable(m)}
      </div>`).join('');

    // Versão impressão: tabela compacta — uma linha por método com a melhor parcela
    const printPaymentRows = methods.map((m) => {
      const b = bestInstallmentForMethod(m, premium.total);
      if (!b) return '';
      return `
        <tr>
          <td class="pps-label">${esc(m.label)}</td>
          <td class="pps-val">${b.count}× ${fmt(b.amount)}</td>
          <td class="pps-tag">${b.semJuros ? '<span class="sem-juros">sem juros</span>' : '<span class="com-juros">com juros</span>'}</td>
        </tr>`;
    }).join('');
    const printPayment = printPaymentRows ? `
      <div class="print-payment-block">
        <table class="pps-table">
          <thead><tr><th>Forma de pagamento</th><th>Melhor opção</th><th></th></tr></thead>
          <tbody>${printPaymentRows}</tbody>
        </table>
      </div>` : '';

    // ── HTML ───────────────────────────────────────────────────────────────

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cotação Auto — ${esc(config.label)}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
/* ── VARIÁVEIS DE MARCA ─────────────────────────────── */
:root {
  --brand:       ${config.brand};
  --brand-light: ${brandLight};
  --brand-mid:   ${brandMid};
  --accent:      #f0a500;

  --bg:          #f4f2ee;
  --surface:     #ffffff;
  --surface-2:   #f9f8f6;
  --border:      #e2dfd8;
  --text-1:      #1a1814;
  --text-2:      #5a5750;
  --text-3:      #9a9590;

  --radius:      6px;
  --font:        'Plus Jakarta Sans', system-ui, sans-serif;
  --mono:        'Space Mono', 'Courier New', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  font-family: var(--font);
  color: var(--text-1);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 32px 16px 64px;
}

/* ── CARD ────────────────────────────────────────────── */
.card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--border);
}

/* ── STRIPE BAR ──────────────────────────────────────── */
.stripe-bar {
  height: 10px;
  background: repeating-linear-gradient(
    90deg,
    var(--brand) 0 20px,
    var(--accent) 20px 26px,
    var(--brand) 26px 46px,
    var(--surface) 46px 52px
  );
}

/* ── HEADER ──────────────────────────────────────────── */
.header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.logo-placeholder {
  background: var(--brand-light);
  border: 1.5px dashed var(--brand-mid);
  border-radius: 4px;
  width: 80px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-family: var(--mono);
  color: var(--brand-mid);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}
.header-meta { text-align: right; }
.seguradora-name {
  font-size: 17px;
  font-weight: 800;
  color: var(--brand);
  letter-spacing: -0.02em;
}
.cotacao-num {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
}

/* ── SAUDAÇÃO ────────────────────────────────────────── */
.greeting {
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
  color: var(--text-2);
  line-height: 1.5;
}
.greeting strong { color: var(--text-1); font-weight: 700; }
.vehicle-tags {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.vtag {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-2);
  padding: 3px 8px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

/* ── VALOR HERO ──────────────────────────────────────── */
.valor-section {
  background: var(--brand);
  padding: 22px 20px 20px;
  position: relative;
}
.valor-section::before {
  content: '';
  position: absolute;
  top: -1px; left: 0; right: 0;
  height: 14px;
  background: repeating-radial-gradient(
    circle at 14px -2px,
    var(--surface) 10px,
    transparent 10px
  ) var(--brand);
  background-size: 28px 14px;
}
.valor-section::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 0; right: 0;
  height: 14px;
  background: repeating-radial-gradient(
    circle at 14px 16px,
    var(--surface) 10px,
    transparent 10px
  ) var(--brand);
  background-size: 28px 14px;
}
.valor-label {
  font-family: var(--mono);
  font-size: 10px;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}
.valor-main {
  font-size: 42px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.03em;
  line-height: 1;
}
.valor-main span { font-size: 24px; opacity: 0.7; }
.valor-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
}
.valor-parcelado { text-align: right; }
.valor-parcelado .vp-label {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 2px;
}
.valor-parcelado .vp-val {
  font-size: 19px;
  font-weight: 700;
  color: var(--accent);
}
.franquia-badge {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.franquia-badge .fb-label { font-size: 12px; color: rgba(255,255,255,0.55); }
.franquia-badge .fb-val { font-size: 17px; font-weight: 700; color: #fff; }

/* ── SEÇÃO GENÉRICA ──────────────────────────────────── */
.section {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}
.section:last-child { border-bottom: none; }
.section-title {
  font-family: var(--mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-3);
  margin-bottom: 12px;
}

/* ── COBERTURAS ──────────────────────────────────────── */
.cob-group {
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 10px;
}
.cob-group:last-child { margin-bottom: 0; }
.cob-group-header {
  background: var(--brand-light);
  padding: 7px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border);
}
.cob-group-icon { font-size: 16px; }
.cob-group-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--mono);
  flex: 1;
}
.cob-group-badge {
  display: inline-block;
  background: #d4f0d4;
  color: #1a6e1a;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 20px;
}
.cob-group-badge.highlight {
  background: rgba(240,165,0,0.2);
  color: #7a5200;
  font-size: 13px;
  padding: 2px 10px;
}
.cob-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.cob-row:last-child { border-bottom: none; }
.cob-row .cr-label { color: var(--text-2); }
.cob-row .cr-val { font-weight: 700; font-family: var(--mono); font-size: 12px; color: var(--text-1); }
.cob-row .cr-zero { font-weight: 400; color: var(--text-3); font-family: var(--mono); font-size: 12px; }
.fipe-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface);
}
.fipe-pct { font-size: 32px; font-weight: 800; color: var(--brand); letter-spacing: -0.03em; line-height: 1; }
.fipe-desc { font-size: 12px; color: var(--text-2); line-height: 1.4; }

/* ── FRANQUIAS ───────────────────────────────────────── */
.franquia-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
  font-size: 14px;
  border-bottom: 1px solid var(--border);
}
.franquia-row:last-child { border-bottom: none; }
.franquia-row .fr-label { color: var(--text-2); }
.franquia-row .fr-val { font-weight: 700; font-family: var(--mono); font-size: 13px; color: var(--text-1); }

/* ── PAGAMENTO ABAS ──────────────────────────────────── */
.tab-list {
  display: flex;
  border-bottom: 2px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}
.tab-list::-webkit-scrollbar { display: none; }
.tab-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 8px 12px;
  font-family: var(--font);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-3);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
}
.tab-btn.active { color: var(--brand); border-bottom-color: var(--brand); }
.tab-panel { display: none; }
.tab-panel.active { display: block; }

.pgto-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pgto-table th {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3);
  padding: 8px 6px 6px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.pgto-table td {
  padding: 7px 6px;
  border-bottom: 1px solid var(--border);
  color: var(--text-2);
}
.pgto-table tbody tr:last-child td { border-bottom: none; }
.pgto-table td:last-child { font-weight: 700; color: var(--text-1); font-family: var(--mono); font-size: 12px; }
.pgto-table td:first-child { font-family: var(--mono); font-weight: 700; font-size: 11px; color: var(--text-3); width: 28px; }
.pgto-table tbody tr:nth-child(even) td { background: var(--surface-2); }
.pgto-table .highlighted td { background: rgba(240,165,0,0.12); color: var(--text-1); }
.pgto-table .highlighted td:last-child { color: var(--brand); }

/* Impressão: tabela compacta de pagamento */
.print-payment { display: none; }
.pps-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pps-table th {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3);
  padding: 6px 8px 4px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.pps-table td { padding: 7px 8px; border-bottom: 1px solid var(--border); }
.pps-table tbody tr:last-child td { border-bottom: none; }
.pps-label { color: var(--text-2); font-size: 13px; }
.pps-val { font-family: var(--mono); font-weight: 700; font-size: 13px; color: var(--text-1); white-space: nowrap; }
.sem-juros { background: #d4f0d4; color: #1a6e1a; font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 20px; font-family: var(--mono); }
.com-juros { background: #fde8d8; color: #9a3a00; font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 20px; font-family: var(--mono); }

/* ── QUESTIONÁRIO ────────────────────────────────────── */
.quest-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.quest-label {
  font-size: 10px;
  font-family: var(--mono);
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}
.quest-val { font-size: 14px; font-weight: 600; color: var(--text-1); }
.quest-item.full { grid-column: 1 / -1; }

/* ── AVISO LEGAL ─────────────────────────────────────── */
.legal {
  background: var(--surface-2);
  border-top: 2px dashed var(--border);
  padding: 16px 20px;
}
.legal-icon { font-size: 20px; margin-bottom: 6px; }
.legal-text { font-size: 11px; color: var(--text-3); line-height: 1.6; }
.legal-text strong { color: var(--text-2); }

/* ── FOOTER ──────────────────────────────────────────── */
.footer {
  background: var(--brand);
  padding: 12px 20px;
  font-family: var(--mono);
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  text-align: center;
  letter-spacing: 0.05em;
}

/* ── PRINT / PDF ─────────────────────────────────────── */
@media print {
  body { background: none; padding: 0; }
  .card { box-shadow: none; max-width: 100%; border-radius: 0; }
  .tab-list { display: none; }
  .tab-panel, .tab-panel.active { display: none !important; }
  .print-payment { display: block; }
  .pgto-table .highlighted td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .stripe-bar, .valor-section, .footer { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cob-group-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
</head>
<body>
<div class="card">

  <!-- STRIPE BAR -->
  <div class="stripe-bar"></div>

  <!-- HEADER -->
  <div class="header">
    <div class="logo-placeholder">logo<br>corretora</div>
    <div class="header-meta">
      <div class="seguradora-name">${esc(config.label)}</div>
      ${d.quoteNumber ? `<div class="cotacao-num">Cotação nº ${esc(d.quoteNumber)}</div>` : ''}
    </div>
  </div>

  <!-- SAUDAÇÃO + VEÍCULO -->
  <div class="greeting">
    ${driver.name ? `Olá <strong>${esc(driver.name)}</strong>, aqui está` : 'Aqui está'} a cotação do seu
    <strong>${esc(vehicle.model)}</strong> na <strong>${esc(config.label)}</strong>.
    <div class="vehicle-tags">
      ${vehicle.plate ? `<span class="vtag">${esc(vehicle.plate)}</span>` : ''}
      ${vehicle.yearModel ? `<span class="vtag">ANO ${vehicle.yearModel}</span>` : vehicle.yearManufacture ? `<span class="vtag">ANO ${vehicle.yearManufacture}</span>` : ''}
      ${vehicle.chassis ? `<span class="vtag">CHASSI ${esc(partialChassis(vehicle.chassis))}</span>` : ''}
    </div>
  </div>

  <!-- VALOR HERO -->
  <div style="padding: 14px 0;">
    <div class="valor-section">
      <div class="valor-row">
        <div>
          <div class="valor-label">Valor anual do seguro</div>
          <div class="valor-main">R$ ${Math.floor(premium.total).toLocaleString('pt-BR')}<span>,${String(Math.round((premium.total % 1) * 100)).padStart(2, '0')}</span></div>
        </div>
        ${best ? `
        <div class="valor-parcelado">
          <div class="vp-label">ou parcelado em até</div>
          <div class="vp-val">${best.count}× ${fmt(best.amount)}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px;">sem juros no ${esc(best.label)}</div>
        </div>` : ''}
      </div>
      ${mainDeductible ? `
      <div class="franquia-badge">
        <span class="fb-label">Franquia principal${mainDeductibleType ? ` <span style="opacity:0.6;font-size:10px;">(${esc(mainDeductibleType)})</span>` : ''}</span>
        <span class="fb-val">${fmt(mainDeductible)}</span>
      </div>` : ''}
    </div>
  </div>

  <!-- COBERTURAS -->
  <div class="section">
    <div class="section-title">Coberturas contratadas</div>
    ${vehicleGroup}
    ${rcfGroup}
    ${appGroup}
    ${assistGroup}
  </div>

  <!-- FRANQUIAS POR ITEM -->
  ${deductibles.length > 0 ? `
  <div class="section">
    <div class="section-title">Franquias por item (apenas itens cobertos)</div>
    <p style="font-size:12px;color:var(--text-3);line-height:1.5;margin-bottom:12px;padding:8px 10px;background:var(--surface-2);border-radius:4px;border-left:3px solid var(--accent);">
      💡 <strong style="color:var(--text-2);">O que é franquia?</strong> É o valor que <em>você</em> paga ao acionar o seguro para cada item — vidro quebrado, amassado, roubo etc.
    </p>
    ${deductibleRows}
  </div>` : ''}

  <!-- PAGAMENTO — ABAS (browser) -->
  ${methods.length > 0 ? `
  <div class="section">
    <div class="section-title">Formas de pagamento (R$)</div>
    <div class="tab-list" role="tablist">${tabButtons}</div>
    ${tabPanels}
    <!-- versão impressão: painéis empilhados -->
    <div class="print-payment">${printPayment}</div>
  </div>` : ''}

  <!-- QUESTIONÁRIO DO CONDUTOR -->
  ${driver.name || driver.cpf || driver.birthDate ? `
  <div class="section">
    <div class="section-title">Questionário — Condutor Principal</div>
    <div class="quest-grid">
      ${driver.name ? `<div class="quest-item full"><div class="quest-label">Nome</div><div class="quest-val">${esc(driver.name)}</div></div>` : ''}
      ${driver.cpf ? `<div class="quest-item"><div class="quest-label">CPF / CNPJ</div><div class="quest-val">${esc(driver.cpf)}</div></div>` : ''}
      ${driver.birthDate ? `<div class="quest-item"><div class="quest-label">Data de Nascimento</div><div class="quest-val">${esc(driver.birthDate)}</div></div>` : ''}
      ${driver.gender ? `<div class="quest-item"><div class="quest-label">Sexo</div><div class="quest-val">${esc(driver.gender)}</div></div>` : ''}
      ${driver.maritalStatus ? `<div class="quest-item"><div class="quest-label">Estado Civil</div><div class="quest-val">${esc(driver.maritalStatus)}</div></div>` : ''}
    </div>
  </div>` : ''}

  <!-- AVISO LEGAL -->
  <div class="legal">
    <div class="legal-icon">⚠️</div>
    <p class="legal-text">
      <strong>Este documento não tem valor legal</strong> e não substitui o PDF oficial gerado pela <strong>${esc(config.label)}</strong>.
      As informações aqui apresentadas são um resumo da cotação para facilitar a visualização pelo cliente.
      Por favor, consulte seu corretor de seguros e confirme se os dados exibidos estão de acordo com o documento oficial emitido pela seguradora.
    </p>
  </div>

  <!-- FOOTER -->
  <div class="footer">COTAÇÃO GERADA PELO SISTEMA${d.validUntil ? ` · VÁLIDA ATÉ ${esc(d.validUntil)}` : ' · VÁLIDA POR 30 DIAS'}</div>

</div>

<script>
function switchTab(btn, id) {
  const card = btn.closest('.card');
  card.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  card.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  card.querySelector('#tab-' + id).classList.add('active');
}
</script>
</body>
</html>`;
  }
}
