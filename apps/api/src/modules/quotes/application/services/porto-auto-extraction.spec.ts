/**
 * Integração entre o parser determinístico de pagamentos Porto e o schema AutoQuoteData.
 *
 * Prova que um payload Porto realista (AI response + pagamentos do parser)
 * passa pela validação Zod sem erros — critério central da TASK-0015.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePortoPaymentTable } from './porto-payment-parser';
import { parseAutoQuoteData } from '../../domain/schemas/auto-quote.schema';

const FIXTURES_DIR = join(__dirname, 'fixtures');
const COMPLETE   = readFileSync(join(FIXTURES_DIR, 'porto-seguro-auto-complete.txt'),   'utf8');
const INCOMPLETE = readFileSync(join(FIXTURES_DIR, 'porto-seguro-auto-incomplete.txt'), 'utf8');

// Simula a resposta que o modelo de IA retornaria para um PDF Porto completo.
// Baseado na estrutura do prompt getPortoSeguroAutoPrompt() e nos dados da fixture.
const REALISTIC_PORTO_AI_RESPONSE = {
  vehicle: {
    plate:           'ABC1D23',
    model:           'JEEP COMPASS SPORT 1.3 T 270 FLEX',
    yearManufacture: 2025,
    yearModel:       2026,
    chassis:         '00000XXXXXTXX00000',
    fipeCode:        '170720',
    fipeValue:       0,
  },
  driver: {
    name:          'FULANA DE TAL SILVA',
    cpf:           '000.000.000-00',
    birthDate:     '01/01/1970',
    gender:        'Feminino',
    maritalStatus: 'Solteiro',
  },
  quoteNumber: '5634702819-0-1',
  insurer:     'Porto Seguro',
  validFrom:   '01/05/2026',
  validUntil:  '01/05/2027',
  bonusClass:  'Classe 0',
  coverage: {
    vehicle: {
      fipePercentage: 100,
      deductible:     6205.0,
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
    { item: 'Veículo', value: 6205.0 },
  ],
  premium: {
    base:  3935.93,
    iof:   290.47,
    total: 4226.40,
  },
  paymentMethods: [],  // sempre vazio — substituído pelo parser determinístico
};

function buildPayload(rawText: string) {
  const payments = parsePortoPaymentTable(rawText);
  return {
    ...REALISTIC_PORTO_AI_RESPONSE,
    paymentMethods: payments ?? [],
  };
}

describe('Porto Seguro AUTO — integração AI response + parser → AutoQuoteData', () => {
  describe('fixture completo', () => {
    it('parseAutoQuoteData não lança exceção', () => {
      expect(() => parseAutoQuoteData(buildPayload(COMPLETE))).not.toThrow();
    });

    it('retorna insurer = "Porto Seguro"', () => {
      const result = parseAutoQuoteData(buildPayload(COMPLETE));
      expect(result.insurer).toBe('Porto Seguro');
    });

    it('retorna premium.total = 4226.40', () => {
      const result = parseAutoQuoteData(buildPayload(COMPLETE));
      expect(result.premium.total).toBeCloseTo(4226.40);
    });

    it('retorna 8 métodos de pagamento com ids únicos', () => {
      const result = parseAutoQuoteData(buildPayload(COMPLETE));
      expect(result.paymentMethods).toHaveLength(8);
      const ids = result.paymentMethods.map((m) => m.id);
      expect(new Set(ids).size).toBe(8);
    });

    it('pagamento Porto Bank Aquisição: 12 parcelas, 1x sem juros', () => {
      const result = parseAutoQuoteData(buildPayload(COMPLETE));
      const m = result.paymentMethods.find((x) => x.label.includes('Aquisição'));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(12);
      expect(m!.installments[0].hasInterest).toBe(false);
    });

    it('pagamento Boleto À Vista: 1 parcela, amount ≈ 4015.08', () => {
      const result = parseAutoQuoteData(buildPayload(COMPLETE));
      const m = result.paymentMethods.find((x) => x.id === 'boleto-a-vista');
      expect(m).toBeDefined();
      expect(m!.installments[0].amount).toBeCloseTo(4015.08);
    });
  });

  describe('fixture incompleto', () => {
    it('parseAutoQuoteData não lança exceção', () => {
      expect(() => parseAutoQuoteData(buildPayload(INCOMPLETE))).not.toThrow();
    });

    it('retorna 8 métodos de pagamento', () => {
      const result = parseAutoQuoteData(buildPayload(INCOMPLETE));
      expect(result.paymentMethods).toHaveLength(8);
    });

    it('Boleto À Vista presente e sem juros', () => {
      const result = parseAutoQuoteData(buildPayload(INCOMPLETE));
      const m = result.paymentMethods.find((x) => x.id === 'boleto-a-vista');
      expect(m).toBeDefined();
      expect(m!.installments[0].hasInterest).toBe(false);
    });

    it('Débito C. Corrente: 5x tem hasInterest=true', () => {
      const result = parseAutoQuoteData(buildPayload(INCOMPLETE));
      const m = result.paymentMethods.find((x) => x.label === 'Débito C. Corrente');
      expect(m).toBeDefined();
      expect(m!.installments[4].hasInterest).toBe(true);
    });
  });
});
