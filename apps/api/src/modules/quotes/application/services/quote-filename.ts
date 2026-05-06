import type { AutoQuoteData } from '@corretor/types';

const INSURER_SHORT: Record<string, string> = {
  BRADESCO:     'Bradesco',
  PORTO_SEGURO: 'Porto',
  AZUL:         'Azul',
  TOKIO_MARINE: 'Tokio',
  SULAMERICA:   'SulAmerica',
  SUHAI:        'Suhai',
  ALIRO:        'Aliro',
  ALLIANZ:      'Allianz',
  YELLOW:       'Yellow',
  ITAU:         'Itaú',
};

// Valores de deductibleType que descrevem o tipo de casco, não o nome comercial
// da franquia. Quando presentes, o campo é omitido do nome do arquivo/label.
export const UNRELIABLE_DEDUCTIBLE_TYPES = new Set(['Compreensiva', 'compreensiva', 'COMPREENSIVA']);

// Mapeamento do campo "Segmento" do PDF Azul para o label comercial exibido ao corretor.
// Fonte primária: campo extraído do PDF. Fallback: fipePercentage.
const AZUL_SEGMENT_LABEL_MAP: Record<string, string> = {
  'AZUL TRADICIONAL': 'Seguro Auto',
  'AZUL AUTO ROUBO':  'Roubo e Furto',
};

const ITAU_SEGMENT_LABEL_MAP: Record<string, string> = {
  'ITAÚ TRADICIONAL':              'Tradicional',
  'ITAÚ SEGURO AUTO COMPACTO':    'Compacto',
  'ITAÚ ASSISTÊNCIA 24H':           'Assistência 24h',
};

export function getItauProductLabel(data: Partial<AutoQuoteData>): string | undefined {
  const raw = data.segment?.toUpperCase().trim() ?? '';
  if (!raw) return undefined;

  if (ITAU_SEGMENT_LABEL_MAP[raw]) {
    const base = ITAU_SEGMENT_LABEL_MAP[raw];
    if (raw.includes('COMPACTO')) {
      const pct = data.coverage?.vehicle?.fipePercentage;
      return pct != null && pct !== 100 ? `${base} · ${pct}% FIPE` : base;
    }
    return base;
  }

  if (/\bCOMPACTO\b/i.test(raw)) {
    const pct = data.coverage?.vehicle?.fipePercentage;
    if (pct != null && pct !== 100) return `Compacto · ${pct}% FIPE`;
    return 'Compacto';
  }
  if (/\bASSIST[EÊ]NCIA\b/i.test(raw) && /\b24\s*H/i.test(raw)) return 'Assistência 24h';
  if (/\bTRADICIONAL\b/i.test(raw)) return 'Tradicional';

  return undefined;
}

const TOKIO_SEGMENT_LABEL_MAP: Record<string, string> = {
  'AUTO':                    'Auto',
  'AUTO CLÁSSICO':           'Auto Clássico',
  'AUTO ROUBO + RASTREADOR': 'Roubo + Rastreador',
  'ASSISTÊNCIA EXCLUSIVA':   'Assistência Exclusiva',
};

export function getTokioProductLabel(data: Partial<AutoQuoteData>): string | undefined {
  const raw = data.segment?.trim() ?? '';
  if (!raw) return undefined;

  const upper = raw.toUpperCase();

  if (/PROTE[ÇC][ÃA]O\s+MENSAL/i.test(upper)) {
    const pct = data.coverage?.vehicle?.fipePercentage;
    return pct != null && pct !== 100 ? `Proteção Mensal · ${pct}% FIPE` : 'Proteção Mensal';
  }

  return TOKIO_SEGMENT_LABEL_MAP[upper] ?? undefined;
}

export function getAzulProductLabel(data: Partial<AutoQuoteData>): string | undefined {
  const segment = data.segment?.toUpperCase().trim();
  if (segment && AZUL_SEGMENT_LABEL_MAP[segment]) return AZUL_SEGMENT_LABEL_MAP[segment];

  // Fallback quando o PDF não traz o campo Segmento
  const fipePercentage = data.coverage?.vehicle?.fipePercentage;
  if (fipePercentage === 90) return 'Roubo e Furto';
  if (fipePercentage === 100) return 'Seguro Auto';
  if (data.coverage?.vehicle?.deductible != null) return 'Seguro Auto';
  return undefined;
}

function formatPremium(total: number): string {
  return Number.isInteger(total)
    ? String(total)
    : total.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Monta o nome do arquivo PDF da cotação.
 * Formato: {ModeloCurto}_{Seguradora}_{TipoFranquia}({PremioTotal}).pdf
 * Ex: JEEP_COMPASS_Bradesco_Reduzida(4200).pdf
 *
 * Se o produto não puder ser determinado via extractedData (segment/fipePercentage ausentes),
 * usa quoteName como fallback para garantir arquivo diferenciado (ex: cotação sem reprocessamento).
 */
export function buildQuotePdfFilename(
  insurer: string,
  extractedData: Record<string, unknown> | null,
  quoteName?: string | null,
): string {
  const d = (extractedData ?? {}) as Partial<AutoQuoteData>;

  const modelTokens = (d.vehicle?.model ?? '').trim().split(/\s+/).filter(Boolean);
  const shortModel = modelTokens.slice(0, 2).join('_');

  const insurerName = INSURER_SHORT[insurer] ?? insurer;

  const deductibleType = insurer === 'AZUL'
    ? getAzulProductLabel(d)
    : insurer === 'ITAU'
      ? getItauProductLabel(d)
      : insurer === 'TOKIO_MARINE'
        ? getTokioProductLabel(d)
        : (() => { const r = d.coverage?.vehicle?.deductibleType; return r && !UNRELIABLE_DEDUCTIBLE_TYPES.has(r) ? r : undefined; })();

  // Fallback: quando extractedData não tem dados suficientes para identificar o produto,
  // usa quoteName (já confirmado pelo corretor) para montar um filename significativo.
  if (!deductibleType && quoteName) {
    const cleanName = quoteName.replace(/\s*—.*$/, '').trim(); // Remove "— (R$ X.XXX,XX)"
    const full = shortModel ? `${shortModel}_${cleanName}` : cleanName;
    return full.replace(/[<>:"/\\|?*\s]/g, '_').replace(/_{2,}/g, '_').replace(/^_|_$/g, '') + '.pdf';
  }

  const premiumTotal = d.premium?.total;

  const parts = [shortModel, insurerName, deductibleType].filter(Boolean);
  let name = parts.join('_');

  if (premiumTotal != null) {
    name += `(${formatPremium(premiumTotal)})`;
  }

  return name.replace(/[<>:"/\\|?*\s]/g, '_') + '.pdf';
}
