import type { AutoQuoteData } from '@corretor/types';

type PaymentMethod = AutoQuoteData['paymentMethods'][number];
type Installment = PaymentMethod['installments'][number];

const KNOWN_METHODS: Array<{
  pattern: RegExp;
  type: PaymentMethod['type'];
  label: string;
}> = [
  {
    pattern: /CART[ÃA]O DE CR[ÉE]DITO PORTO BANK\s*\(AQUISI[ÇC][ÃA]O\)\*?/i,
    type: 'credit_bradesco',
    label: 'Cartão Porto Bank (Aquisição)',
  },
  {
    pattern: /CART[ÃA]O DE CR[ÉE]DITO PORTO BANK SEM DESCONTO/i,
    type: 'credit_card',
    label: 'Cartão Porto Bank (Outro Titular)',
  },
  {
    pattern: /CART[ÃA]O DE CR[ÉE]DITO\s*-\s*DEMAIS BANDEIRAS/i,
    type: 'credit_card',
    label: 'Cartão de Crédito',
  },
  {
    pattern: /D[ÉE]BITO C\.\s*CORRENTE\s*\/\s*DEMAIS CARN[ÊE]/i,
    type: 'debit',
    label: 'Débito / Demais Carnê',
  },
  {
    pattern: /D[ÉE]BITO C\.\s*CORRENTE/i,
    type: 'debit',
    label: 'Débito C. Corrente',
  },
  {
    pattern: /BOLETO\s*\/\s*DEMAIS CARN[ÊE]/i,
    type: 'coupon',
    label: 'Boleto / Demais Carnê',
  },
  {
    pattern: /BOLETO\s*\/\s*DEMAIS C\.\s*CORRENTE/i,
    type: 'coupon',
    label: 'Boleto / Demais C. Corrente',
  },
];

function parseBRL(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.'));
}

function toMethodId(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Parses the qualifier text that follows an R$ amount:
//   "(s/juros Até 15% OFF)" → { hasInterest: false, discountLabel: "s/juros Até 15% OFF" }
//   "(s/juros)"             → { hasInterest: false, discountLabel: "s/juros" }
//   "juros (R$ 205,85)"     → { hasInterest: true }
//   undefined               → { hasInterest: false }
function parseQualifier(qualifier: string | undefined): { hasInterest: boolean; discountLabel?: string } {
  if (!qualifier) return { hasInterest: false };
  const trimmed = qualifier.trim();
  if (/^juros\b/i.test(trimmed)) return { hasInterest: true };
  const label = trimmed.startsWith('(') ? trimmed.slice(1, -1).trim() : trimmed;
  return { hasInterest: false, discountLabel: label || undefined };
}

// Extracts installment amounts from a text chunk.
// Locates the column header "1x 2x 3x..." to know where amounts begin and how many to expect.
// Skips unavailable slots represented by "-" or "- -".
// Captures hasInterest and discountLabel from qualifier text after each amount.
function extractInstallments(chunk: string): Installment[] {
  // Find the column header to determine start position and expected installment count
  const headerMatch = /\b1x(?:\s+\d+x)+/.exec(chunk);
  const expectedCount = headerMatch
    ? (headerMatch[0].match(/\d+x/g) ?? []).length
    : 12;
  const amountsText = headerMatch
    ? chunk.slice(headerMatch.index + headerMatch[0].length)
    : chunk;

  const installments: Installment[] = [];
  let num = 1;
  let tokensConsumed = 0;

  // Token: R$ amount (optional qualifier) | dash (unavailable slot)
  // match[1] = amount string
  // match[2] = qualifier ("(s/juros Até 15% OFF)", "juros (R$ 205,85)", etc.)
  // match[3] = single dash (unavailable)
  // match[4] = second dash (two unavailable slots)
  const tokenRe =
    /R\$\s*([\d.]+,\d{2})\s*(\([^)]*\)|\b(?:juros|sem\s+juros)\b\s*(?:\([^)]*\))?)?|(-)\s*(-)?/g;

  let match: RegExpExecArray | null;

  while (tokensConsumed < expectedCount && (match = tokenRe.exec(amountsText)) !== null) {
    if (match[3]) {
      // Single dash = one unavailable slot
      num++;
      tokensConsumed++;
      if (match[4]) {
        // "- -" = two unavailable slots
        num++;
        tokensConsumed++;
      }
      continue;
    }

    if (!match[1]) continue;

    const { hasInterest, discountLabel } = parseQualifier(match[2]);
    const installment: Installment = { number: num, amount: parseBRL(match[1]), hasInterest };
    if (discountLabel) installment.discountLabel = discountLabel;
    installments.push(installment);
    num++;
    tokensConsumed++;
  }

  return installments;
}

// Finds the payment section boundaries and returns it, or null if not found.
function extractPaymentSection(rawText: string): string | null {
  // Match the section header only — not "Demais formas de Pagamento" in discount tables
  const start = rawText.search(/(?:FORMAS DE PAGAMENTO|Formas de pagamento)\s+(?:1x|TODAS)/i);
  if (start === -1) return null;

  // End at clauses section, summary footer, or end of string
  const endPatterns = [/CL[ÁA]USULAS/i, /Esta folha [eé] uma vers/i, /Visite o nosso site/i];
  let end = rawText.length;
  for (const p of endPatterns) {
    const idx = rawText.search(p);
    if (idx > start && idx < end) end = idx;
  }

  return rawText.slice(start, end);
}

// Splits the payment section into (label, amountsChunk) pairs.
// Handles two PDF layouts:
//   incomplete: LABEL → "Parcela 1x..." → amounts
//   complete:   amounts → LABEL → amounts → LABEL
function splitByMethods(
  section: string,
): Array<{ label: string; type: PaymentMethod['type']; chunk: string }> {
  const positions: Array<{
    index: number;
    end: number;
    label: string;
    type: PaymentMethod['type'];
  }> = [];

  for (const m of KNOWN_METHODS) {
    const match = m.pattern.exec(section);
    if (match) {
      positions.push({ index: match.index, end: match.index + match[0].length, label: m.label, type: m.type });
    }
  }

  if (positions.length === 0) return [];

  positions.sort((a, b) => a.index - b.index);

  const isIncomplete = /Parcela\s+1x/i.test(section);
  const results: Array<{ label: string; type: PaymentMethod['type']; chunk: string }> = [];

  if (isIncomplete) {
    // Amounts come AFTER the label, before the next label
    for (let i = 0; i < positions.length; i++) {
      const from = positions[i].end;
      const to = i + 1 < positions.length ? positions[i + 1].index : section.length;
      results.push({ label: positions[i].label, type: positions[i].type, chunk: section.slice(from, to) });
    }
  } else {
    // Amounts come BEFORE the label (complete PDF layout)
    for (let i = 0; i < positions.length; i++) {
      const from = i === 0 ? 0 : positions[i - 1].end;
      const to = positions[i].index;
      results.push({ label: positions[i].label, type: positions[i].type, chunk: section.slice(from, to) });
    }
  }

  return results;
}

// Extracts the "Boleto À Vista" single-payment option from the section.
// This method is not in a column table — it appears as a standalone line.
// Two layouts:
//   complete:   "Boleto À vista 5% de Desconto R$ 4.015,08 (s/juros)"
//   incomplete: "Boleto 5% de Desconto R$ 4.015,08 sem juros À vista"
function extractBoletaAvista(section: string): PaymentMethod | null {
  // Complete: label ("À vista") comes before amount
  let m = /BOLETO\s+[ÀA]\s*VISTA\s+[\s\S]{0,80}?R\$\s*([\d.]+,\d{2})/i.exec(section);
  // Incomplete: label comes after amount
  if (!m) m = /BOLETO\s+[\s\S]{0,40}?R\$\s*([\d.]+,\d{2})[\s\S]{0,40}?[ÀA]\s*VISTA/i.exec(section);
  if (!m) return null;

  return {
    id: 'boleto-a-vista',
    type: 'coupon',
    label: 'Boleto À Vista',
    installments: [{ number: 1, amount: parseBRL(m[1]), hasInterest: false }],
  };
}

export function parsePortoPaymentTable(
  rawText: string,
): AutoQuoteData['paymentMethods'] | null {
  const section = extractPaymentSection(rawText);
  if (!section) return null;

  const methodChunks = splitByMethods(section);
  if (methodChunks.length === 0) return null;

  const methods: AutoQuoteData['paymentMethods'] = [];

  for (const { label, type, chunk } of methodChunks) {
    const installments = extractInstallments(chunk);
    if (installments.length > 0) {
      methods.push({ id: toMethodId(label), type, label, installments });
    }
  }

  const boletaAvista = extractBoletaAvista(section);
  if (boletaAvista) methods.push(boletaAvista);

  return methods.length > 0 ? methods : null;
}
