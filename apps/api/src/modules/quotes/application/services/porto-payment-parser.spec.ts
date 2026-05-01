import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePortoPaymentTable } from './porto-payment-parser';

const FIXTURES_DIR = join(__dirname, 'fixtures');
const COMPLETE = readFileSync(join(FIXTURES_DIR, 'porto-seguro-auto-complete.txt'), 'utf8');
const INCOMPLETE = readFileSync(join(FIXTURES_DIR, 'porto-seguro-auto-incomplete.txt'), 'utf8');

describe('parsePortoPaymentTable', () => {
  it('retorna null para texto vazio', () => {
    expect(parsePortoPaymentTable('')).toBeNull();
  });

  it('retorna null quando não encontra seção de pagamento', () => {
    expect(parsePortoPaymentTable('texto sem formas de pagamento')).toBeNull();
  });

  describe('fixture completo', () => {
    let result: ReturnType<typeof parsePortoPaymentTable>;

    beforeAll(() => {
      result = parsePortoPaymentTable(COMPLETE);
    });

    it('não retorna null', () => expect(result).not.toBeNull());

    it('retorna 8 métodos de pagamento (7 parcelados + Boleto À Vista)', () => expect(result).toHaveLength(8));

    it('todos os métodos têm ids únicos', () => {
      const ids = result!.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('Porto Bank Aquisição: 12 parcelas', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(12);
    });

    it('Porto Bank Aquisição: 1x = R$ 3.612,37', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'))!;
      expect(m.installments[0].amount).toBeCloseTo(3612.37);
    });

    it('Porto Bank Aquisição: 12x = R$ 316,98', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'))!;
      expect(m.installments[11].amount).toBeCloseTo(316.98);
    });

    it('Porto Bank Aquisição: 1x hasInterest=false, discountLabel inclui "15% OFF"', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'))!;
      expect(m.installments[0].hasInterest).toBe(false);
      expect(m.installments[0].discountLabel).toContain('15% OFF');
    });

    it('Porto Bank Outro Titular: 12 parcelas', () => {
      const m = result!.find((x) => x.label.includes('Outro Titular'));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(12);
    });

    it('Demais Bandeiras: 10 parcelas (11x e 12x indisponíveis)', () => {
      const m = result!.find((x) => x.label.includes('Demais Bandeiras') || (x.label.includes('Crédito') && !x.label.includes('Porto')));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(10);
    });

    it('Débito C. Corrente: 12 parcelas com juros a partir da 5ª', () => {
      const m = result!.find((x) => x.label === 'Débito C. Corrente');
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(12);
      expect(m!.installments[0].amount).toBeCloseTo(4015.08);
      expect(m!.installments[4].amount).toBeCloseTo(889.49);
    });

    it('Débito C. Corrente: 1x hasInterest=false, 5x hasInterest=true', () => {
      const m = result!.find((x) => x.label === 'Débito C. Corrente')!;
      expect(m.installments[0].hasInterest).toBe(false);
      expect(m.installments[4].hasInterest).toBe(true);
    });

    it('Boleto / Demais Carnê: 10 parcelas (1x e 12x indisponíveis)', () => {
      const m = result!.find((x) => x.label.includes('Carnê') && x.label.includes('Boleto'));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(10);
      expect(m!.installments[0].number).toBe(2);
    });

    it('Boleto / Demais C. Corrente: 12 parcelas', () => {
      const m = result!.find((x) => x.label.includes('C. Corrente') && x.label.includes('Boleto'));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(12);
    });

    it('Boleto À Vista: 1 parcela sem juros, id = "boleto-a-vista"', () => {
      const m = result!.find((x) => x.id === 'boleto-a-vista');
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(1);
      expect(m!.installments[0].number).toBe(1);
      expect(m!.installments[0].amount).toBeCloseTo(4015.08);
      expect(m!.installments[0].hasInterest).toBe(false);
    });
  });

  describe('fixture incompleto', () => {
    let result: ReturnType<typeof parsePortoPaymentTable>;

    beforeAll(() => {
      result = parsePortoPaymentTable(INCOMPLETE);
    });

    it('não retorna null', () => expect(result).not.toBeNull());

    it('retorna 8 métodos de pagamento (7 parcelados + Boleto À Vista)', () => expect(result).toHaveLength(8));

    it('todos os métodos têm ids únicos', () => {
      const ids = result!.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('Porto Bank Aquisição: 12 parcelas com mesmos valores do completo', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'))!;
      expect(m.installments).toHaveLength(12);
      expect(m.installments[0].amount).toBeCloseTo(3612.37);
      expect(m.installments[11].amount).toBeCloseTo(316.98);
    });

    it('Demais Bandeiras: 10 parcelas (11x e 12x indisponíveis)', () => {
      const m = result!.find((x) => x.label.includes('Crédito') && !x.label.includes('Porto'));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(10);
    });

    it('Boleto / Demais Carnê: 10 parcelas, começa no número 2', () => {
      const m = result!.find((x) => x.label.includes('Carnê') && x.label.includes('Boleto'));
      expect(m).toBeDefined();
      expect(m!.installments[0].number).toBe(2);
    });

    it('Débito / Demais Carnê: 12 parcelas com juros', () => {
      const m = result!.find((x) => x.label.includes('Débito') && x.label.includes('Carnê'));
      expect(m).toBeDefined();
      expect(m!.installments).toHaveLength(12);
    });

    it('Boleto À Vista: 1 parcela, R$ 4.015,08, hasInterest=false', () => {
      const m = result!.find((x) => x.id === 'boleto-a-vista');
      expect(m).toBeDefined();
      expect(m!.installments[0].amount).toBeCloseTo(4015.08);
      expect(m!.installments[0].hasInterest).toBe(false);
    });

    it('Porto Bank Aquisição: hasInterest=false em todas as parcelas', () => {
      const m = result!.find((x) => x.label.includes('Aquisição'))!;
      expect(m.installments.every((i) => i.hasInterest === false)).toBe(true);
    });

    it('Débito C. Corrente: 5x hasInterest=true', () => {
      const m = result!.find((x) => x.label === 'Débito C. Corrente')!;
      expect(m.installments[4].hasInterest).toBe(true);
    });
  });
});
