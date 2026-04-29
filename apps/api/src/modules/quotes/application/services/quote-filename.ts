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

/**
 * Monta o nome do arquivo PDF da cotação.
 * Formato: {ModeloCurto}_{Seguradora}_{TipoFranquia}({ValorFranquia}).pdf
 * Ex: Compass_Bradesco_Reduzida(3866.5).pdf
 */
export function buildQuotePdfFilename(
  insurer: string,
  extractedData: Record<string, unknown> | null,
): string {
  const d = (extractedData ?? {}) as Partial<AutoQuoteData>;

  // Primeiras duas palavras do modelo (ex: "JEEP COMPASS SPORT…" → "JEEP_COMPASS")
  const modelTokens = (d.vehicle?.model ?? '').trim().split(/\s+/).filter(Boolean);
  const shortModel = modelTokens.slice(0, 2).join('_');

  const insurerName = INSURER_SHORT[insurer] ?? insurer;

  const deductibleType  = d.coverage?.vehicle?.deductibleType;
  const deductibleValue = d.coverage?.vehicle?.deductible;

  const parts = [shortModel, insurerName, deductibleType].filter(Boolean);
  let name = parts.join('_');

  if (deductibleValue != null) {
    // Formata o valor sem zeros desnecessários (3866.5 → "3866.5", 4000.0 → "4000")
    const valStr = Number.isInteger(deductibleValue)
      ? String(deductibleValue)
      : deductibleValue.toFixed(2).replace(/\.?0+$/, '');
    name += `(${valStr})`;
  }

  // Remove caracteres inválidos em nomes de arquivo e normaliza espaços
  return name.replace(/[<>:"/\\|?*\s]/g, '_') + '.pdf';
}
