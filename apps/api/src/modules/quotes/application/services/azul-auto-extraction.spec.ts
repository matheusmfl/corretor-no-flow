import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePortoPaymentTable } from './porto-payment-parser';
import { parseAutoQuoteData } from '../../domain/schemas/auto-quote.schema';

const FIXTURES_DIR = join(__dirname, 'fixtures');
const TRADICIONAL = readFileSync(join(FIXTURES_DIR, 'azul-auto-tradicional-complete.txt'), 'utf8');
const ROUBO = readFileSync(join(FIXTURES_DIR, 'azul-auto-roubo-complete.txt'), 'utf8');

const AZUL_TRADICIONAL_AI_RESPONSE = {
  vehicle: {
    plate:           'ABC1D23',
    model:           'JEEP COMPASS SPORT 1.3 T 270 FLEX',
    yearManufacture: 2025,
    yearModel:       2026,
    chassis:         '00000XXXXXTXX00000',
    fipeCode:        '170720',
    fipeValue:       125400.00, // valor de mercado FIPE — não confundir com franquia (6516)
  },
  segment: 'AZUL TRADICIONAL',
  driver: {
    name:          'FULANA DE TAL SILVA',
    cpf:           '000.000.000-00',
    birthDate:     '01/01/1970',
    gender:        'Feminino',
    maritalStatus: 'Solteiro',
  },
  quoteNumber: '5634702819-0-4',
  insurer:     'Azul Seguro Auto',
  validFrom:   '01/05/2026',
  validUntil:  '01/05/2027',
  bonusClass:  'Classe 0',
  coverage: {
    vehicle: {
      fipePercentage: 100,
      deductible:     6516.0,
      deductibleType: 'Normal',
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
    base:  3420.56,
    iof:   252.44,
    total: 3673.00,
  },
  paymentMethods: [],
};

const AZUL_ROUBO_AI_RESPONSE = {
  vehicle: {
    plate:           'ABC1D23',
    model:           'JEEP COMPASS SPORT 1.3 T 270 FLEX',
    yearManufacture: 2025,
    yearModel:       2026,
    chassis:         '00000XXXXXTXX00000',
    fipeCode:        '170720',
    fipeValue:       0,
  },
  segment: 'AZUL AUTO ROUBO',
  driver: {
    name:          'FULANA DE TAL SILVA',
    cpf:           '000.000.000-00',
    birthDate:     '01/01/1970',
    gender:        'Feminino',
    maritalStatus: 'Solteiro',
  },
  quoteNumber: '5634702819-0-7',
  insurer:     'Azul Seguro Auto',
  validFrom:   '01/05/2026',
  validUntil:  '01/05/2027',
  bonusClass:  'Classe 0',
  coverage: {
    vehicle: {
      fipePercentage: 90,
      // deductible deliberately absent — Azul Auto Roubo has "Franquia: -"
    },
    rcf: {
      propertyDamage: 50000,
      bodilyInjury:   50000,
    },
    assistance: {
      towing: true,
    },
  },
  deductibles: [], // mandatory array, empty for roubo variant
  premium: {
    base:  1587.87,
    iof:   117.18,
    total: 1705.05,
  },
  paymentMethods: [],
};

describe('Azul AUTO — parser de pagamentos Porto Bank reutilizado', () => {
  describe('fixture Azul Tradicional completo', () => {
    let result: ReturnType<typeof parsePortoPaymentTable>;

    beforeAll(() => {
      result = parsePortoPaymentTable(TRADICIONAL);
    });

    it('não retorna null', () => expect(result).not.toBeNull());

    it('retorna 8 métodos de pagamento (7 parcelados + Boleto À Vista)', () => {
      expect(result).toHaveLength(8);
    });

    it('todos os métodos têm ids únicos', () => {
      const ids = result!.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('Porto Bank Aquisição: 12 parcelas sem juros', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(12);
      expect(m!.installments[0].amount).toBeCloseTo(3139.02);
      expect(m!.installments[0].hasInterest).toBe(false);
    });

    it('Porto Bank Aquisição: 1x discountLabel inclui "15% OFF"', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'))!;
      expect(m.installments[0].discountLabel).toContain('15% OFF');
    });

    it('Boleto À Vista: 1 parcela, R$ 3.489,32, sem juros', () => {
      const m = result!.find((x) => x.id === 'boleto-a-vista');
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(1);
      expect(m!.installments[0].amount).toBeCloseTo(3489.32);
      expect(m!.installments[0].hasInterest).toBe(false);
    });

    it('Débito C. Corrente: 10 parcelas sem juros (1x até 10x, 11x e 12x indisponíveis)', () => {
      const m = result!.find((x) => x.label === 'Débito C. Corrente');
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(10);
      expect(m!.installments[0].number).toBe(1);
      expect(m!.installments[0].hasInterest).toBe(false);
    });

    it('Boleto / Demais Carnê: começa no número 2 (1x indisponível)', () => {
      const m = result!.find((x) => x.label.includes('Carnê') && x.label.includes('Boleto'));
      expect(m).toBeDefined();
      expect(m!.installments[0].number).toBe(2);
    });
  });

  describe('fixture Azul Auto Roubo completo', () => {
    let result: ReturnType<typeof parsePortoPaymentTable>;

    beforeAll(() => {
      result = parsePortoPaymentTable(ROUBO);
    });

    it('não retorna null', () => expect(result).not.toBeNull());

    it('retorna 8 métodos de pagamento', () => {
      expect(result).toHaveLength(8);
    });

    it('Porto Bank Aquisição: 12 parcelas, 1x = R$ 1.457,78', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(12);
      expect(m!.installments[0].amount).toBeCloseTo(1457.78);
    });

    it('Boleto À Vista: R$ 1.619,78', () => {
      const m = result!.find((x) => x.id === 'boleto-a-vista');
      expect(m).toBeDefined();
      expect(m!.installments[0].amount).toBeCloseTo(1619.78);
    });
  });
});

describe('Azul AUTO — integração AI response + parser → AutoQuoteData', () => {
  describe('Azul Tradicional (COMPREENSIVA com franquia)', () => {
    it('parseAutoQuoteData não lança exceção', () => {
      const payments = parsePortoPaymentTable(TRADICIONAL);
      expect(() =>
        parseAutoQuoteData({ ...AZUL_TRADICIONAL_AI_RESPONSE, paymentMethods: payments ?? [] }),
      ).not.toThrow();
    });

    it('retorna insurer = "Azul Seguro Auto"', () => {
      const payments = parsePortoPaymentTable(TRADICIONAL);
      const result = parseAutoQuoteData({ ...AZUL_TRADICIONAL_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.insurer).toBe('Azul Seguro Auto');
    });

    it('retorna premium.total = 3673.00', () => {
      const payments = parsePortoPaymentTable(TRADICIONAL);
      const result = parseAutoQuoteData({ ...AZUL_TRADICIONAL_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.premium.total).toBeCloseTo(3673.00);
    });

    it('retorna coverage.vehicle.fipePercentage = 100', () => {
      const payments = parsePortoPaymentTable(TRADICIONAL);
      const result = parseAutoQuoteData({ ...AZUL_TRADICIONAL_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.coverage.vehicle?.fipePercentage).toBe(100);
    });

    it('vehicle.fipeValue nao e igual a coverage.vehicle.deductible (bug de confusao FIPE/franquia)', () => {
      const payments = parsePortoPaymentTable(TRADICIONAL);
      const result = parseAutoQuoteData({ ...AZUL_TRADICIONAL_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.vehicle?.fipeValue).toBeCloseTo(125400.00);
      expect(result.vehicle?.fipeValue).not.toBeCloseTo(result.coverage?.vehicle?.deductible ?? 0);
    });

    it('coverage.vehicle.deductible existe e e diferente de fipeValue', () => {
      const payments = parsePortoPaymentTable(TRADICIONAL);
      const result = parseAutoQuoteData({ ...AZUL_TRADICIONAL_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.coverage.vehicle?.deductible).toBeCloseTo(6516.0);
    });

    it('retorna 8 métodos de pagamento com ids únicos', () => {
      const payments = parsePortoPaymentTable(TRADICIONAL);
      const result = parseAutoQuoteData({ ...AZUL_TRADICIONAL_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.paymentMethods).toHaveLength(8);
      const ids = result.paymentMethods.map((m) => m.id);
      expect(new Set(ids).size).toBe(8);
    });

    it('retorna segment = "AZUL TRADICIONAL"', () => {
      const payments = parsePortoPaymentTable(TRADICIONAL);
      const result = parseAutoQuoteData({ ...AZUL_TRADICIONAL_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.segment).toBe('AZUL TRADICIONAL');
    });
  });

  describe('Azul Auto Roubo (INCÊNDIO/ROUBO/FURTO sem franquia)', () => {
    it('aceita payload sem coverage.vehicle.deductible e com deductibles: []', () => {
      const payments = parsePortoPaymentTable(ROUBO);
      expect(() =>
        parseAutoQuoteData({ ...AZUL_ROUBO_AI_RESPONSE, paymentMethods: payments ?? [] }),
      ).not.toThrow();
    });

    it('retorna coverage.vehicle.deductible = undefined quando ausente', () => {
      const payments = parsePortoPaymentTable(ROUBO);
      const result = parseAutoQuoteData({ ...AZUL_ROUBO_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.coverage.vehicle?.deductible).toBeUndefined();
    });

    it('retorna deductibles como array vazio', () => {
      const payments = parsePortoPaymentTable(ROUBO);
      const result = parseAutoQuoteData({ ...AZUL_ROUBO_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.deductibles).toEqual([]);
    });

    it('retorna coverage.vehicle.fipePercentage = 90', () => {
      const payments = parsePortoPaymentTable(ROUBO);
      const result = parseAutoQuoteData({ ...AZUL_ROUBO_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.coverage.vehicle?.fipePercentage).toBe(90);
    });

    it('retorna premium.total = 1705.05', () => {
      const payments = parsePortoPaymentTable(ROUBO);
      const result = parseAutoQuoteData({ ...AZUL_ROUBO_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.premium.total).toBeCloseTo(1705.05);
    });

    it('retorna 8 métodos de pagamento', () => {
      const payments = parsePortoPaymentTable(ROUBO);
      const result = parseAutoQuoteData({ ...AZUL_ROUBO_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.paymentMethods).toHaveLength(8);
    });

    it('retorna segment = "AZUL AUTO ROUBO"', () => {
      const payments = parsePortoPaymentTable(ROUBO);
      const result = parseAutoQuoteData({ ...AZUL_ROUBO_AI_RESPONSE, paymentMethods: payments ?? [] });
      expect(result.segment).toBe('AZUL AUTO ROUBO');
    });
  });
});
