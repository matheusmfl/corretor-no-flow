import { Injectable } from '@nestjs/common';
import type { DraftField, HealthMemberLife, HealthQuoteDraft, HealthQuoteOption } from '@corretor/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(v: string | null | undefined): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtBrl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function sourceLabel(source: HealthQuoteOption['sourceType']): string {
  switch (source) {
    case 'portal_pdf':         return 'PDF da seguradora';
    case 'manual_table':       return 'Tabela manual';
    case 'spreadsheet_import': return 'Planilha';
  }
}

/** Renderiza um DraftField<string>. Campos needsReview aparecem como "valor (a confirmar)". */
function fieldHtml(label: string, field: DraftField<string>): string {
  if (!field.value && !field.needsReview) return '';
  const valueText = field.value ?? 'Não identificado';
  const badge = field.needsReview
    ? `<span class="badge-pending">a confirmar</span>`
    : '';
  return `
    <div class="field-row">
      <span class="field-label">${esc(label)}</span>
      <span class="field-value">${esc(valueText)} ${badge}</span>
    </div>`;
}

function lifeLabel(life: HealthMemberLife, index: number): string {
  return life.name ?? life.label ?? life.relationship ?? `Beneficiário ${index + 1}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class HealthPdfTemplateService {
  render(draft: HealthQuoteDraft): string {
    const { clientName, lives, quoteOptions, warnings = [] } = draft;

    // ── Seção: cabeçalho ──────────────────────────────────────────────────────
    const headerTitle = clientName
      ? `Proposta Saúde — ${esc(clientName)}`
      : 'Proposta Saúde';

    // ── Seção: beneficiários ──────────────────────────────────────────────────
    const livesRows = lives.map((life, i) => `
      <tr>
        <td>${esc(lifeLabel(life, i))}</td>
        <td class="tc">${life.age}</td>
        <td>${esc(life.relationship ?? '—')}</td>
      </tr>`).join('');

    // ── Seção: opções de plano ────────────────────────────────────────────────
    const optionCards = quoteOptions.map((opt) => {
      const perLifeRows = (opt.perLifePrices ?? []).map((p) => {
        const life = lives[p.lifeIndex];
        const label = life ? lifeLabel(life, p.lifeIndex) : `Vida ${p.lifeIndex + 1}`;
        return `
          <tr>
            <td>${esc(label)}</td>
            <td class="tc text-muted">${esc(p.bandLabel ?? '—')}</td>
            <td class="tr mono">${fmtBrl(p.price)}</td>
          </tr>`;
      }).join('');

      const optionWarnings = (opt.warnings ?? []).map((w) => `
        <div class="alert-row">⚠ ${esc(w)}</div>`).join('');

      const hasPerLife = (opt.perLifePrices?.length ?? 0) > 0;

      return `
      <div class="option-card">
        <div class="option-header">
          <div>
            <span class="option-carrier">${esc(opt.carrierOrOperator)}</span>
            <span class="option-plan">${esc(opt.planName)}</span>
          </div>
          <div class="option-right">
            <div class="option-source">${esc(sourceLabel(opt.sourceType))}</div>
            ${opt.monthlyTotal != null
              ? `<div class="option-total">${fmtBrl(opt.monthlyTotal)}<span class="option-total-per">/mês</span></div>`
              : ''}
          </div>
        </div>

        <div class="option-fields">
          ${fieldHtml('Acomodação', opt.accommodation)}
          ${fieldHtml('Coparticipação', opt.coparticipation)}
          ${fieldHtml('Reembolso', opt.reimbursementMode)}
          ${fieldHtml('Odonto', opt.dental)}
          ${fieldHtml('Validade', opt.validUntil)}
        </div>

        ${hasPerLife ? `
        <div class="option-section-title">Valores por beneficiário</div>
        <table class="per-life-table">
          <thead>
            <tr>
              <th>Beneficiário</th>
              <th class="tc">Faixa</th>
              <th class="tr">Valor</th>
            </tr>
          </thead>
          <tbody>${perLifeRows}</tbody>
        </table>` : ''}

        ${optionWarnings ? `<div class="option-alerts">${optionWarnings}</div>` : ''}
      </div>`;
    }).join('');

    // ── Seção: avisos draft-level ─────────────────────────────────────────────
    const draftWarningsHtml = warnings.length > 0
      ? `<div class="section">
          <div class="section-title">Observações</div>
          ${warnings.map((w) => `<div class="alert-row">⚠ ${esc(w)}</div>`).join('')}
        </div>`
      : '';

    // ── Seção: comparativo de totais ──────────────────────────────────────────
    const totalsWithValue = quoteOptions.filter((o) => o.monthlyTotal != null);
    const totaisRows = totalsWithValue.map((opt) => `
      <tr>
        <td>${esc(opt.carrierOrOperator)} — ${esc(opt.planName)}</td>
        <td class="tr mono bold">${fmtBrl(opt.monthlyTotal!)}</td>
      </tr>`).join('');

    // ── HTML ──────────────────────────────────────────────────────────────────
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(headerTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
:root {
  --bg:         #f4f2ee;
  --surface:    #ffffff;
  --surface-2:  #f9f8f6;
  --border:     #e2dfd8;
  --text-1:     #1a1814;
  --text-2:     #5a5750;
  --text-3:     #9a9590;
  --mahogany:   #7a2b2b;
  --amber:      #92400e;
  --amber-bg:   #fffbeb;
  --amber-bdr:  #fde68a;
  --green:      #166534;
  --green-bg:   #f0fdf4;
  --radius:     6px;
  --font:       'Plus Jakarta Sans', system-ui, sans-serif;
  --mono:       'Space Mono', 'Courier New', monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg);
  font-family: var(--font);
  color: var(--text-1);
  padding: 32px 16px 64px;
  display: flex;
  justify-content: center;
}
.card {
  width: 100%;
  max-width: 640px;
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px var(--border);
}
.stripe-bar {
  height: 8px;
  background: repeating-linear-gradient(90deg, var(--mahogany) 0 20px, #c8a96e 20px 26px, var(--mahogany) 26px 46px, var(--surface) 46px 52px);
}
/* ── Header ── */
.doc-header {
  padding: 20px 24px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--mahogany);
}
.doc-title { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
.doc-subtitle { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 3px; font-family: var(--mono); }
/* ── Sections ── */
.section { padding: 18px 24px; border-bottom: 1px solid var(--border); }
.section:last-child { border-bottom: none; }
.section-title {
  font-family: var(--mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-3);
  margin-bottom: 12px;
}
/* ── Lives table ── */
.lives-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.lives-table th { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); padding: 0 8px 8px 0; text-align: left; border-bottom: 1px solid var(--border); }
.lives-table td { padding: 8px 8px 8px 0; border-bottom: 1px solid var(--border); color: var(--text-2); }
.lives-table tbody tr:last-child td { border-bottom: none; }
.lives-count { font-size: 11px; color: var(--text-3); margin-bottom: 10px; font-family: var(--mono); }
/* ── Option cards ── */
.option-card {
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 12px;
}
.option-card:last-child { margin-bottom: 0; }
.option-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.option-carrier { display: block; font-size: 14px; font-weight: 700; color: var(--text-1); }
.option-plan { display: block; font-size: 11px; color: var(--text-2); margin-top: 1px; }
.option-right { text-align: right; }
.option-source { font-family: var(--mono); font-size: 9px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
.option-total { font-size: 20px; font-weight: 800; color: var(--mahogany); letter-spacing: -0.02em; }
.option-total-per { font-size: 11px; font-weight: 400; color: var(--text-3); }
/* ── Field rows ── */
.option-fields { padding: 8px 16px; display: flex; flex-wrap: wrap; gap: 4px 0; }
.field-row { display: flex; justify-content: space-between; width: 100%; padding: 5px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
.field-row:last-child { border-bottom: none; }
.field-label { color: var(--text-3); }
.field-value { color: var(--text-2); font-weight: 500; display: flex; align-items: center; gap: 6px; }
.badge-pending {
  display: inline-block;
  background: var(--amber-bg);
  border: 1px solid var(--amber-bdr);
  color: var(--amber);
  font-size: 9px;
  font-family: var(--mono);
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 20px;
  white-space: nowrap;
}
/* ── Per-life table ── */
.option-section-title {
  font-family: var(--mono); font-size: 9px; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--text-3); padding: 6px 16px 4px;
  border-top: 1px solid var(--border); background: var(--surface-2);
}
.per-life-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.per-life-table th { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); padding: 6px 16px; text-align: left; border-bottom: 1px solid var(--border); }
.per-life-table td { padding: 7px 16px; border-bottom: 1px solid var(--border); color: var(--text-2); }
.per-life-table tbody tr:last-child td { border-bottom: none; }
/* ── Alerts ── */
.option-alerts { padding: 10px 16px; background: var(--amber-bg); border-top: 1px solid var(--amber-bdr); }
.alert-row { font-size: 11px; color: var(--amber); line-height: 1.5; margin-bottom: 3px; }
.alert-row:last-child { margin-bottom: 0; }
/* ── Totals comparison ── */
.totals-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.totals-table td { padding: 8px 0; border-bottom: 1px solid var(--border); }
.totals-table tbody tr:last-child td { border-bottom: none; }
/* ── Legal ── */
.legal { background: var(--surface-2); border-top: 2px dashed var(--border); padding: 16px 24px; }
.legal-text { font-size: 11px; color: var(--text-3); line-height: 1.6; }
.legal-text strong { color: var(--text-2); }
/* ── Utils ── */
.tc { text-align: center; }
.tr { text-align: right; }
.mono { font-family: var(--mono); font-size: 11px; }
.bold { font-weight: 700; }
.text-muted { color: var(--text-3); }
@media print {
  body { background: none; padding: 0; }
  .card { box-shadow: none; max-width: 100%; border-radius: 0; }
  .stripe-bar, .doc-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
</head>
<body>
<div class="card">

  <div class="stripe-bar"></div>

  <div class="doc-header">
    <div class="doc-title">${esc(headerTitle)}</div>
    <div class="doc-subtitle">PROPOSTA COMERCIAL · PLANO DE SAÚDE</div>
  </div>

  <!-- Beneficiários -->
  <div class="section">
    <div class="section-title">Beneficiários</div>
    <div class="lives-count">${lives.length} beneficiário${lives.length !== 1 ? 's' : ''}</div>
    <table class="lives-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th class="tc">Idade</th>
          <th>Parentesco</th>
        </tr>
      </thead>
      <tbody>${livesRows}</tbody>
    </table>
  </div>

  <!-- Opções de plano -->
  <div class="section">
    <div class="section-title">${quoteOptions.length} opções de plano</div>
    ${optionCards}
  </div>

  <!-- Comparativo de totais -->
  ${totalsWithValue.length > 1 ? `
  <div class="section">
    <div class="section-title">Comparativo — total mensal</div>
    <table class="totals-table">
      <tbody>${totaisRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Avisos draft-level -->
  ${draftWarningsHtml}

  <!-- Aviso legal -->
  <div class="legal">
    <p class="legal-text">
      <strong>Este documento não tem valor contratual.</strong>
      Os valores e condições apresentados são baseados nas informações da cotação e podem ser alterados pela operadora.
      Campos marcados como <em>"a confirmar"</em> não foram verificados nas fontes disponíveis e devem ser confirmados com a operadora antes de apresentar ao cliente.
      Rede credenciada, carências e reembolso detalhado devem ser consultados diretamente com a operadora.
    </p>
  </div>

</div>
</body>
</html>`;
  }
}
