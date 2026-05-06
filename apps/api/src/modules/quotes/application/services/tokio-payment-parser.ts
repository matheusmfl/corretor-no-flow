import type { AutoQuoteData } from '@corretor/types';

type PaymentMethod = AutoQuoteData['paymentMethods'][number];
type Installment = PaymentMethod['installments'][number];

function parseBRL(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.'));
}

// Matches Tokio payment table rows:
//   <num> <amount> Antecipado* <total>
//   <num> <amount> Sem Juros   <total>
// The two-column PDF layout produces pairs on the same extracted line:
//   "1 3.074,50 Antecipado* 3.074,50 7 462,23 Sem Juros 3.236,26"
const ROW_RE = /\b(\d{1,2})\s+([\d.]+,\d{2})\s+(Antecipado\*|Sem\s+Juros)\s+([\d.]+,\d{2})/g;

// Standalone header lines that signal the start of an alternative payment
// method section. When found, we stop scanning to avoid absorbing carnê/débito
// rows into cartao-credito (conservative until we have real fixtures).
const ALT_METHOD_HEADER_RE = /^(?:Carn[eê]|D[eé]bito(?:\s+em\s+conta)?|Boleto(?:\s+Banc[aá]rio)?)\s*$/im;

export function parseTokioPaymentTable(
  rawText: string,
): AutoQuoteData['paymentMethods'] | null {
  const start = rawText.search(/Primeira\s+parcela\s+[àa]\s+vista\s*\|?\s*IOF/i);
  if (start === -1) return null;

  let section = rawText.slice(start);

  // Truncate at the first alternative payment method section header so that
  // carnê/débito/boleto rows in the same format are never merged into cartao-credito.
  const altMethodMatch = ALT_METHOD_HEADER_RE.exec(section);
  if (altMethodMatch !== null) {
    section = section.slice(0, altMethodMatch.index);
  }

  const antecipados: Installment[] = [];
  const semJuros: Installment[] = [];

  ROW_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ROW_RE.exec(section)) !== null) {
    const num = parseInt(match[1]!, 10);
    const amount = parseBRL(match[2]!);
    const label = match[3]!;
    const total = parseBRL(match[4]!);

    if (/Antecipado/i.test(label)) {
      antecipados.push({ number: num, amount, total, hasInterest: false, discountLabel: 'Antecipado' });
    } else {
      semJuros.push({ number: num, amount, total, hasInterest: false });
    }
  }

  if (antecipados.length === 0 && semJuros.length === 0) return null;

  const methods: AutoQuoteData['paymentMethods'] = [];

  if (semJuros.length > 0) {
    methods.push({
      id: 'cartao-credito',
      type: 'credit_card',
      label: 'Cartão de Crédito',
      installments: semJuros,
    });
  }

  if (antecipados.length > 0) {
    methods.push({
      id: 'cartao-credito-antecipado',
      type: 'credit_card',
      label: 'À Vista com Desconto',
      installments: antecipados,
    });
  }

  return methods.length > 0 ? methods : null;
}
