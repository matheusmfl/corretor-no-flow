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
