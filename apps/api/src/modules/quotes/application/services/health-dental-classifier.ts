import type { HealthAgeBandPrice, HealthMemberLife, HealthQuoteOption } from '@corretor/types';

// ─── isDentalOnlyOption ───────────────────────────────────────────────────────

const DENTAL_PLAN_NAME_RE = /\b(dental|odonto)\b/i;

export function isDentalOnlyOption(option: HealthQuoteOption): boolean {
  const hasDentalEvidence =
    (option.dental.source !== 'not_found' && option.dental.value !== null) ||
    DENTAL_PLAN_NAME_RE.test(option.planName);

  const medicalFieldsAbsent =
    option.accommodation.source === 'not_found' &&
    option.coparticipation.source === 'not_found' &&
    option.reimbursementMode.source === 'not_found';

  return hasDentalEvidence && medicalFieldsAbsent;
}

// ─── derivePerLifePricesFromAgeBands ──────────────────────────────────────────

export function derivePerLifePricesFromAgeBands(
  ageBandPrices: HealthAgeBandPrice[],
  lives: HealthMemberLife[],
): Array<{ lifeIndex: number; price: number; bandLabel?: string }> {
  return lives.flatMap((life, lifeIndex) => {
    const band = ageBandPrices.find((b) => life.age >= b.minAge && life.age <= b.maxAge);
    if (!band) return [];
    return [{ lifeIndex, price: band.pricePerLife, bandLabel: band.bandLabel }];
  });
}

// ─── classifyWarnings ─────────────────────────────────────────────────────────

const OBSERVATION_PATTERNS = [
  /\biof\b/i,
  /\bsusep\b/i,
  /\bans\b/i,
  /sujeit[ao]\s+a/i,
  /reajuste\s+atuarial/i,
  /\batuarial\b/i,
  /não\s+inclui/i,
  /não\s+incluído/i,
  /preços\s+sujeitos/i,
  /proposta\s+válida/i,
];

export interface ClassifiedWarnings {
  actionable: string[];
  observations: string[];
}

export function classifyWarnings(warnings: string[]): ClassifiedWarnings {
  const actionable: string[] = [];
  const observations: string[] = [];
  for (const w of warnings) {
    if (OBSERVATION_PATTERNS.some((p) => p.test(w))) {
      observations.push(w);
    } else {
      actionable.push(w);
    }
  }
  return { actionable, observations };
}
