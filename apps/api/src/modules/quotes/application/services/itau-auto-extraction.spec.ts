import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePortoPaymentTable } from './porto-payment-parser';
import { parseAutoQuoteData } from '../../domain/schemas/auto-quote.schema';
import { getItauProductLabel } from './quote-filename';

const FIXTURES_DIR = join(__dirname, 'fixtures');
const ITAU_TRADICIONAL = readFileSync(join(FIXTURES_DIR, 'itau-tradicional-auto-complete.txt'), 'utf8');

/** Payload anônimo alinhado ao fixture Itaú Tradicional (compreensiva FIPE 100%). */
const ITAU_TRADICIONAL_AI_RESPONSE = {
  vehicle: {
    plate:           'ABC1D23',
    model:           'MODELO EXEMPLO 1.3 FLEX',
    yearManufacture: 2025,
    yearModel:       2026,
    chassis:         '00000XXXXXTXX00000',
    fipeCode:        '170720',
    fipeValue:       118_000.0,
  },
  segment: 'ITAÚ TRADICIONAL',
  driver: {
    name:          'FULANO DE TAL',
    cpf:           '000.000.000-00',
    birthDate:     '01/01/1970',
    gender:        'Masculino',
    maritalStatus: 'Solteiro',
  },
  quoteNumber: '5634702819-0-2',
  insurer:     'Itaú Seguro Auto',
  validFrom:   '01/05/2026',
  validUntil:  '01/05/2027',
  bonusClass:  'Classe 0',
  coverage: {
    vehicle: {
      fipePercentage: 100,
      deductible:     6516.0,
      deductibleType: '50% da Obrigatória',
    },
    rcf: {
      propertyDamage: 100_000,
      bodilyInjury:   100_000,
    },
    assistance: {
      towing: true,
    },
  },
  deductibles: [{ item: 'Veículo', value: 6516.0 }],
  premium: {
    base:  3813.79,
    iof:   281.46,
    total: 4095.25,
  },
  paymentMethods: [],
};

const ITAU_COMPACTO_AI_RESPONSE = {
  vehicle: {
    plate:           'ABC1D23',
    model:           'COMPASS SPORT 1.3 T 270 FLEX',
    yearManufacture: 2025,
    yearModel:       2026,
    chassis:         '00000000000000000',
    fipeCode:        '170720',
    fipeValue:       125_400.0,
  },
  segment: 'ITAÚ SEGURO AUTO COMPACTO',
  driver: {
    name:          'SEGURADO EXEMPLO',
    cpf:           '000.000.000-00',
    birthDate:     '24/12/1964',
    gender:        'Feminino',
    maritalStatus: 'Solteiro',
  },
  quoteNumber: '5634702819-0-5',
  insurer:     'Itaú Seguro Auto',
  validFrom:   '01/05/2026',
  validUntil:  '01/05/2027',
  bonusClass:  'Classe 0',
  coverage: {
    vehicle: {
      fipePercentage: 85,
      lmi:            'R$ 0,00',
    },
    rcf: {
      propertyDamage: 50_000,
      bodilyInjury:   50_000,
    },
    assistance: {
      towing: true,
    },
  },
  deductibles: [],
  premium: {
    base:  2267.19,
    iof:   167.32,
    total: 2434.51,
  },
  paymentMethods: [],
};

const ITAU_ASSISTENCIA_AI_RESPONSE = {
  vehicle: {
    plate:           'ABC1D23',
    model:           'COMPASS SPORT 1.3 T 270 FLEX',
    yearManufacture: 2025,
    yearModel:       2026,
    chassis:         '00000000000000000',
    fipeCode:        '170720',
    fipeValue:       125_400.0,
  },
  segment: 'ITAÚ ASSISTÊNCIA 24H',
  driver: {
    name:          'SEGURADO EXEMPLO',
    cpf:           '000.000.000-00',
    birthDate:     '24/12/1964',
    gender:        'Feminino',
    maritalStatus: 'Solteiro',
  },
  quoteNumber: '5634702819-0-6',
  insurer:     'Itaú Seguro Auto',
  validFrom:   '01/05/2026',
  validUntil:  '01/05/2027',
  bonusClass:  'Classe 0',
  coverage: {
    app: {
      death:          5000,
      disability:     0,
      medical:        0,
      passengerCount: 5,
    },
    assistance: {
      towing: true,
    },
  },
  deductibles: [],
  premium: {
    base:  426.48,
    iof:   31.47,
    total: 457.95,
  },
  paymentMethods: [],
};

describe('Itaú AUTO — rótulo de produto comercial', () => {
  it('Tradicional → label legível', () => {
    expect(getItauProductLabel({ segment: 'ITAÚ TRADICIONAL', coverage: { vehicle: { fipePercentage: 100 } } })).toBe(
      'Tradicional',
    );
  });

  it('Compacto → inclui percentual FIPE quando 85%', () => {
    expect(
      getItauProductLabel({ segment: 'ITAÚ SEGURO AUTO COMPACTO', coverage: { vehicle: { fipePercentage: 85 } } }),
    ).toBe('Compacto · 85% FIPE');
  });

  it('Compacto → não inventa percentual FIPE quando extração não trouxe fipePercentage', () => {
    expect(getItauProductLabel({ segment: 'ITAÚ SEGURO AUTO COMPACTO', coverage: {} })).toBe('Compacto');
    expect(getItauProductLabel({ segment: 'ITAÚ SEGURO AUTO COMPACTO', coverage: { vehicle: {} } })).toBe(
      'Compacto',
    );
  });

  it('Assistência 24h → não usa rótulo de compreensiva', () => {
    expect(getItauProductLabel({ segment: 'ITAÚ ASSISTÊNCIA 24H' })).toBe('Assistência 24h');
  });
});

describe('Itaú AUTO — parser de pagamentos (layout Porto Bank)', () => {
  describe('fixture Itaú Tradicional completo', () => {
    let result: ReturnType<typeof parsePortoPaymentTable>;

    beforeAll(() => {
      result = parsePortoPaymentTable(ITAU_TRADICIONAL);
    });

    it('não retorna null', () => expect(result).not.toBeNull());

    it('Porto Bank Aquisição: 1x sem juros (~R$ 3.500,26) — layout quebra qualif. em linhas', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'));
      expect(m).toBeDefined();
      expect(m!.installments[0].amount).toBeCloseTo(3500.26);
      expect(m!.installments[0].hasInterest).toBe(false);
    });

    it('Boleto à vista (5% desconto) próximo de R$ 3.890,47', () => {
      const m = result!.find((x) => x.id === 'boleto-a-vista');
      expect(m).toBeDefined();
      expect(m!.installments[0].amount).toBeCloseTo(3890.47);
    });
  });
});

describe('Itaú AUTO — integração payload IA + parser → AutoQuoteData', () => {
  it('Tradicional: parse sem erro e segment + prêmio corretos', () => {
    const payments = parsePortoPaymentTable(ITAU_TRADICIONAL);
    const result = parseAutoQuoteData({ ...ITAU_TRADICIONAL_AI_RESPONSE, paymentMethods: payments ?? [] });
    expect(result.insurer).toBe('Itaú Seguro Auto');
    expect(result.segment).toBe('ITAÚ TRADICIONAL');
    expect(result.premium.total).toBeCloseTo(4095.25);
    expect(result.coverage.vehicle?.fipePercentage).toBe(100);
    expect(result.coverage.vehicle?.deductible).toBeCloseTo(6516.0);
    expect(result.coverage.vehicle?.deductibleType).toBe('50% da Obrigatória');
    expect(result.deductibles.some((x) => x.item === 'Veículo' && x.value === 6516.0)).toBe(true);
  });

  it('Compacto: mantém 85% FIPE e não exige franquia de casco', () => {
    const result = parseAutoQuoteData(ITAU_COMPACTO_AI_RESPONSE);
    expect(result.coverage.vehicle?.fipePercentage).toBe(85);
    expect(result.coverage.vehicle?.deductible).toBeUndefined();
    expect(result.segment).toContain('COMPACTO');
  });

  it('Assistência 24h: aceita ausência de coverage.vehicle (sem casco tradicional)', () => {
    expect(() => parseAutoQuoteData(ITAU_ASSISTENCIA_AI_RESPONSE)).not.toThrow();
    const result = parseAutoQuoteData(ITAU_ASSISTENCIA_AI_RESPONSE);
    expect(result.coverage.vehicle).toBeUndefined();
    expect(result.segment).toBe('ITAÚ ASSISTÊNCIA 24H');
  });
});
