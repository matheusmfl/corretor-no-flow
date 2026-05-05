import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePortoPaymentTable } from './porto-payment-parser';
import { parseAutoQuoteData } from '../../domain/schemas/auto-quote.schema';

const FIXTURES_DIR = join(__dirname, 'fixtures');
const COMPLETE = readFileSync(join(FIXTURES_DIR, 'mitsui-sumitomo-auto-complete.txt'), 'utf8');

const MITSUI_AI_RESPONSE = {
  vehicle: {
    plate:           'ABC1D23',
    model:           'JEEP COMPASS SPORT 1.3 T 270 FLEX',
    yearManufacture: 2025,
    yearModel:       2026,
    chassis:         '00000XXXXXTXX00000',
    fipeCode:        '170720',
    fipeValue:       125400.00,
  },
  segment: 'MITSUI SUMITOMO SEGUROS',
  driver: {
    name:          'FULANO DE TAL SILVA',
    cpf:           '000.000.000-00',
    birthDate:     '01/01/1970',
    gender:        'Masculino',
    maritalStatus: 'Solteiro',
  },
  quoteNumber: '5634702819-0-3',
  insurer:     'Mitsui Sumitomo Seguros',
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
      propertyDamage: 100000,
      bodilyInjury:   100000,
    },
    assistance: {
      towing: true,
    },
  },
  deductibles: [
    { item: 'Veículo', value: 6516.0 },
  ],
  premium: {
    base:  3731.30,
    iof:   275.37,
    total: 4006.67,
  },
  paymentMethods: [],
};

describe('Mitsui Sumitomo AUTO — parser de pagamentos Porto reutilizado', () => {
  describe('fixture completo', () => {
    let result: ReturnType<typeof parsePortoPaymentTable>;

    beforeAll(() => {
      result = parsePortoPaymentTable(COMPLETE);
    });

    it('não retorna null', () => expect(result).not.toBeNull());

    it('retorna 8 métodos de pagamento', () => {
      expect(result).toHaveLength(8);
    });

    it('todos os métodos têm ids únicos', () => {
      const ids = result!.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('Porto Bank Aquisição: 12 parcelas sem juros, 1x = R$ 3.424,51', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(12);
      expect(m!.installments[0].amount).toBeCloseTo(3424.51);
      expect(m!.installments[0].hasInterest).toBe(false);
    });

    it('Porto Bank Aquisição: 1x discountLabel inclui "15% OFF"', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'))!;
      expect(m.installments[0].discountLabel).toContain('15% OFF');
    });

    it('Boleto À Vista: 1 parcela, R$ 3.806,32, sem juros', () => {
      const m = result!.find((x) => x.id === 'boleto-a-vista');
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(1);
      expect(m!.installments[0].amount).toBeCloseTo(3806.32);
      expect(m!.installments[0].hasInterest).toBe(false);
    });

    it('Débito C. Corrente: está presente nos métodos', () => {
      const m = result!.find((x) => x.label === 'Débito C. Corrente');
      expect(m).toBeDefined();
      expect(m!.installments.length).toBeGreaterThan(0);
    });
  });
});

describe('Mitsui Sumitomo AUTO — integração AI response + parser → AutoQuoteData', () => {
  it('parseAutoQuoteData não lança exceção', () => {
    const payments = parsePortoPaymentTable(COMPLETE);
    expect(() =>
      parseAutoQuoteData({ ...MITSUI_AI_RESPONSE, paymentMethods: payments ?? [] }),
    ).not.toThrow();
  });

  it('retorna insurer = "Mitsui Sumitomo Seguros"', () => {
    const payments = parsePortoPaymentTable(COMPLETE);
    const result = parseAutoQuoteData({ ...MITSUI_AI_RESPONSE, paymentMethods: payments ?? [] });
    expect(result.insurer).toBe('Mitsui Sumitomo Seguros');
  });

  it('retorna premium.total = 4006.67', () => {
    const payments = parsePortoPaymentTable(COMPLETE);
    const result = parseAutoQuoteData({ ...MITSUI_AI_RESPONSE, paymentMethods: payments ?? [] });
    expect(result.premium.total).toBeCloseTo(4006.67);
  });

  it('retorna coverage.vehicle.fipePercentage = 100', () => {
    const payments = parsePortoPaymentTable(COMPLETE);
    const result = parseAutoQuoteData({ ...MITSUI_AI_RESPONSE, paymentMethods: payments ?? [] });
    expect(result.coverage.vehicle?.fipePercentage).toBe(100);
  });

  it('retorna coverage.vehicle.deductible = 6516.0', () => {
    const payments = parsePortoPaymentTable(COMPLETE);
    const result = parseAutoQuoteData({ ...MITSUI_AI_RESPONSE, paymentMethods: payments ?? [] });
    expect(result.coverage.vehicle?.deductible).toBeCloseTo(6516.0);
  });

  it('vehicle.fipeValue não é igual a coverage.vehicle.deductible', () => {
    const payments = parsePortoPaymentTable(COMPLETE);
    const result = parseAutoQuoteData({ ...MITSUI_AI_RESPONSE, paymentMethods: payments ?? [] });
    expect(result.vehicle?.fipeValue).toBeCloseTo(125400.00);
    expect(result.vehicle?.fipeValue).not.toBeCloseTo(result.coverage?.vehicle?.deductible ?? 0);
  });

  it('retorna 8 métodos de pagamento com ids únicos', () => {
    const payments = parsePortoPaymentTable(COMPLETE);
    const result = parseAutoQuoteData({ ...MITSUI_AI_RESPONSE, paymentMethods: payments ?? [] });
    expect(result.paymentMethods).toHaveLength(8);
    const ids = result.paymentMethods.map((m) => m.id);
    expect(new Set(ids).size).toBe(8);
  });

  it('retorna segment = "MITSUI SUMITOMO SEGUROS"', () => {
    const payments = parsePortoPaymentTable(COMPLETE);
    const result = parseAutoQuoteData({ ...MITSUI_AI_RESPONSE, paymentMethods: payments ?? [] });
    expect(result.segment).toBe('MITSUI SUMITOMO SEGUROS');
  });

  it('retorna rcf.propertyDamage = 100000', () => {
    const payments = parsePortoPaymentTable(COMPLETE);
    const result = parseAutoQuoteData({ ...MITSUI_AI_RESPONSE, paymentMethods: payments ?? [] });
    expect(result.coverage.rcf?.propertyDamage).toBe(100000);
  });
});
