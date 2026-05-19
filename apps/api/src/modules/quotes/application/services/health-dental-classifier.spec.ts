import type { HealthQuoteOption, HealthMemberLife, HealthAgeBandPrice } from '@corretor/types';
import {
  isDentalOnlyOption,
  derivePerLifePricesFromAgeBands,
  classifyWarnings,
} from './health-dental-classifier';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function notFound() {
  return { value: null, source: 'not_found' as const, confidence: 0, needsReview: true };
}

function extracted(v: string) {
  return { value: v, source: 'extracted' as const, confidence: 0.95, needsReview: false };
}

function baseOption(overrides: Partial<HealthQuoteOption> = {}): HealthQuoteOption {
  return {
    sourceType: 'portal_pdf',
    carrierOrOperator: 'Amil',
    planName: 'Plano Médico',
    accommodation: extracted('Enfermaria'),
    coparticipation: extracted('Sem coparticipação'),
    reimbursementMode: notFound(),
    validUntil: extracted('2026-06-30'),
    dental: notFound(),
    ...overrides,
  };
}

function dentalOption(overrides: Partial<HealthQuoteOption> = {}): HealthQuoteOption {
  return {
    sourceType: 'portal_pdf',
    carrierOrOperator: 'Amil',
    planName: 'DENTAL BRONZE PJ PROMO',
    accommodation: notFound(),
    coparticipation: notFound(),
    reimbursementMode: notFound(),
    validUntil: extracted('2026-06-30'),
    dental: extracted('Incluso'),
    ...overrides,
  };
}

function life(age: number): HealthMemberLife {
  return { age, source: 'extracted', needsReview: false };
}

// ─── isDentalOnlyOption ───────────────────────────────────────────────────────

describe('isDentalOnlyOption', () => {
  it('retorna true quando dental.value está presente e campos médicos são not_found', () => {
    expect(isDentalOnlyOption(dentalOption())).toBe(true);
  });

  it('retorna true quando planName contém "Dental" e campos médicos são not_found', () => {
    const opt = dentalOption({ planName: 'Dental Conjugado', dental: notFound() });
    expect(isDentalOnlyOption(opt)).toBe(true);
  });

  it('retorna true quando planName contém "Odonto" e campos médicos são not_found', () => {
    const opt = dentalOption({ planName: 'Odonto Premium', dental: notFound() });
    expect(isDentalOnlyOption(opt)).toBe(true);
  });

  it('retorna true quando planName contém "ODONTO" em maiúsculas e campos médicos são not_found', () => {
    const opt = dentalOption({ planName: 'PLANO ODONTO CONJUGADO', dental: notFound() });
    expect(isDentalOnlyOption(opt)).toBe(true);
  });

  it('retorna false para plano médico completo mesmo sem dental', () => {
    expect(isDentalOnlyOption(baseOption())).toBe(false);
  });

  it('retorna false quando dental está presente mas acomodação também está presente', () => {
    const opt = dentalOption({ accommodation: extracted('Enfermaria') });
    expect(isDentalOnlyOption(opt)).toBe(false);
  });

  it('retorna false quando dental está presente mas coparticipação também está presente', () => {
    const opt = dentalOption({ coparticipation: extracted('Com coparticipação') });
    expect(isDentalOnlyOption(opt)).toBe(false);
  });

  it('retorna false quando dental está presente mas reembolso também está presente', () => {
    const opt = dentalOption({ reimbursementMode: extracted('Parcial') });
    expect(isDentalOnlyOption(opt)).toBe(false);
  });

  it('retorna false quando não há evidência dental e campos médicos são not_found', () => {
    const opt = baseOption({
      accommodation: notFound(),
      coparticipation: notFound(),
      reimbursementMode: notFound(),
      dental: notFound(),
      planName: 'Saúde Efetivo IV',
    });
    expect(isDentalOnlyOption(opt)).toBe(false);
  });
});

// ─── derivePerLifePricesFromAgeBands ──────────────────────────────────────────

describe('derivePerLifePricesFromAgeBands', () => {
  const bands: HealthAgeBandPrice[] = [
    { bandLabel: '0 a 18', minAge: 0, maxAge: 18, pricePerLife: 210 },
    { bandLabel: '34 a 38', minAge: 34, maxAge: 38, pricePerLife: 355 },
    { bandLabel: '39 a 43', minAge: 39, maxAge: 43, pricePerLife: 430 },
  ];

  it('mapeia cada vida para o preço da faixa etária correspondente', () => {
    const lives = [life(9), life(36), life(41)];
    const result = derivePerLifePricesFromAgeBands(bands, lives);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ lifeIndex: 0, price: 210 });
    expect(result[1]).toMatchObject({ lifeIndex: 1, price: 355 });
    expect(result[2]).toMatchObject({ lifeIndex: 2, price: 430 });
  });

  it('preserva bandLabel na saída', () => {
    const result = derivePerLifePricesFromAgeBands(bands, [life(9)]);
    expect(result[0].bandLabel).toBe('0 a 18');
  });

  it('ignora vida cuja idade não pertence a nenhuma faixa', () => {
    const result = derivePerLifePricesFromAgeBands(bands, [life(60)]);
    expect(result).toHaveLength(0);
  });

  it('retorna array vazio quando ageBandPrices é vazio', () => {
    const result = derivePerLifePricesFromAgeBands([], [life(34)]);
    expect(result).toHaveLength(0);
  });

  it('retorna array vazio quando lives é vazio', () => {
    const result = derivePerLifePricesFromAgeBands(bands, []);
    expect(result).toHaveLength(0);
  });

  it('mapeia vida na borda inferior da faixa (minAge exato)', () => {
    const result = derivePerLifePricesFromAgeBands(bands, [life(34)]);
    expect(result[0].price).toBe(355);
  });

  it('mapeia vida na borda superior da faixa (maxAge exato)', () => {
    const result = derivePerLifePricesFromAgeBands(bands, [life(43)]);
    expect(result[0].price).toBe(430);
  });

  it('mapeia vida na faixa aberta (maxAge = 999)', () => {
    const openBands: HealthAgeBandPrice[] = [
      { bandLabel: '59+', minAge: 59, maxAge: 999, pricePerLife: 2900 },
    ];
    const result = derivePerLifePricesFromAgeBands(openBands, [life(65)]);
    expect(result[0].price).toBe(2900);
  });

  it('atribui o índice correto quando há vidas intermediárias sem faixa', () => {
    const result = derivePerLifePricesFromAgeBands(bands, [life(9), life(60), life(36)]);
    // vida 0 → 0 a 18, vida 1 → sem faixa (60), vida 2 → 34 a 38
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ lifeIndex: 0, price: 210 });
    expect(result[1]).toMatchObject({ lifeIndex: 2, price: 355 });
  });
});

// ─── classifyWarnings ─────────────────────────────────────────────────────────

describe('classifyWarnings', () => {
  it('warning sobre operadora desconhecida é actionable', () => {
    const { actionable } = classifyWarnings(['Operadora não identificada — confirme antes de enviar ao cliente']);
    expect(actionable).toHaveLength(1);
  });

  it('warning sobre validade ausente é actionable', () => {
    const { actionable } = classifyWarnings(['Validade não informada']);
    expect(actionable).toHaveLength(1);
  });

  it('warning sobre base de vidas é actionable', () => {
    const { actionable } = classifyWarnings(['Base de vidas não confirmada']);
    expect(actionable).toHaveLength(1);
  });

  it('warning com IOF é observation', () => {
    const { observations } = classifyWarnings(['IOF não incluído (R$ 66,04) — confirmar total ao cliente']);
    expect(observations).toHaveLength(1);
  });

  it('warning com SUSEP é observation', () => {
    const { observations } = classifyWarnings(['Sujeito a aprovação da SUSEP']);
    expect(observations).toHaveLength(1);
  });

  it('warning com ANS é observation', () => {
    const { observations } = classifyWarnings(['Valores regulamentados pela ANS']);
    expect(observations).toHaveLength(1);
  });

  it('warning com reajuste atuarial é observation', () => {
    const { observations } = classifyWarnings(['Preços sujeitos a reajuste atuarial']);
    expect(observations).toHaveLength(1);
  });

  it('warning com "sujeito a" é observation', () => {
    const { observations } = classifyWarnings(['Proposta sujeita a aprovação cadastral']);
    expect(observations).toHaveLength(1);
  });

  it('separa corretamente lista mista', () => {
    const warnings = [
      'Operadora não identificada — confirme',
      'IOF não incluído (R$ 66,04)',
      'Validade ausente',
      'Preços sujeitos a reajuste atuarial',
    ];
    const { actionable, observations } = classifyWarnings(warnings);
    expect(actionable).toHaveLength(2);
    expect(observations).toHaveLength(2);
  });

  it('retorna ambas as listas vazias para entrada vazia', () => {
    const result = classifyWarnings([]);
    expect(result.actionable).toHaveLength(0);
    expect(result.observations).toHaveLength(0);
  });
});
