import type { AutoQuoteData } from '@corretor/types';

// Ordem das colunas na tabela de pagamento do Bradesco (sempre a mesma)
const METHOD_DEFS: Array<{ type: AutoQuoteData['paymentMethods'][0]['type']; label: string }> = [
  { type: 'debit',           label: 'Débito em Conta' },
  { type: 'credit_bradesco', label: 'Cartão Bradesco' },
  { type: 'credit_card',     label: 'Cartão de Crédito' },
  { type: 'coupon',          label: 'Carnê' },
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

/**
 * Parseia a tabela de formas de pagamento do Demonstrativo de Cálculo Bradesco AUTO.
 *
 * O pdfjs-dist lineariza a tabela de 4 colunas em 4 blocos "Total Parcelas",
 * cada bloco contendo pares (total, amount) em ordem crescente de parcelas.
 *
 * Retorna null se o texto não contiver os 4 blocos esperados.
 */
export function parseBradescoPaymentTable(
  rawText: string,
): AutoQuoteData['paymentMethods'] | null {
  // Cada bloco: "Total Parcelas" seguido de N pares de valores BRL
  const blockRe = /Total\s+Parcelas((?:\s+R\$\s*[\d.]+,\d{2})+)/gi;
  const blocks = [...rawText.matchAll(blockRe)];

  if (blocks.length < 4) return null;

  return blocks.slice(0, 4).map((block, i) => {
    const values = [...block[1].matchAll(/[\d.]+,\d{2}/g)].map((m) => parseBRL(m[0]));

    // Valores vêm em pares: (total, amount) para 1×, 2×, 3×, …
    const installments: AutoQuoteData['paymentMethods'][0]['installments'] = [];
    for (let j = 0; j + 1 < values.length; j += 2) {
      installments.push({
        number: j / 2 + 1,
        total:  values[j],
        amount: values[j + 1],
      });
    }

    return {
      id:           toMethodId(METHOD_DEFS[i].label),
      type:         METHOD_DEFS[i].type,
      label:        METHOD_DEFS[i].label,
      installments,
    };
  });
}
