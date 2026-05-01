import type { AutoQuoteData } from '@corretor/types';

const INSURER_SHORT: Record<string, string> = {
  BRADESCO:     'Bradesco',
  PORTO_SEGURO: 'Porto',
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

function formatPremium(total: number): string {
  return Number.isInteger(total)
    ? String(total)
    : total.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Monta o nome do arquivo PDF da cotação.
 * Formato: {ModeloCurto}_{Seguradora}_{TipoFranquia}({PremioTotal}).pdf
 * Ex: JEEP_COMPASS_Bradesco_Reduzida(4200).pdf
 */
export function buildQuotePdfFilename(
  insurer: string,
  extractedData: Record<string, unknown> | null,
): string {
  const d = (extractedData ?? {}) as Partial<AutoQuoteData>;

  const modelTokens = (d.vehicle?.model ?? '').trim().split(/\s+/).filter(Boolean);
  const shortModel = modelTokens.slice(0, 2).join('_');

  const insurerName = INSURER_SHORT[insurer] ?? insurer;

  const rawType = d.coverage?.vehicle?.deductibleType;
  const deductibleType = rawType && !UNRELIABLE_DEDUCTIBLE_TYPES.has(rawType) ? rawType : undefined;

  const premiumTotal = d.premium?.total;

  const parts = [shortModel, insurerName, deductibleType].filter(Boolean);
  let name = parts.join('_');

  if (premiumTotal != null) {
    name += `(${formatPremium(premiumTotal)})`;
  }

  return name.replace(/[<>:"/\\|?*\s]/g, '_') + '.pdf';
}
