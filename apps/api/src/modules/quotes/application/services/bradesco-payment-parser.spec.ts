import { parseBradescoPaymentTable } from './bradesco-payment-parser';

// Trecho real extraído de um PDF Bradesco AUTO pelo pdfjs-dist
const REAL_EXTRACT = `
Item: PAGAMENTO (R$)
Nº 1x 2x 3x 4x 5x 6x 7x 8x 9x 10x 11x
Débito em Conta   Cartão de Crédito Bradesco   Cartão de Crédito   Carnê
Total Parcelas R$ 3.448,50 R$ 3.448,50 R$ 3.448,50 R$ 1.724,25 R$ 3.448,50 R$ 1.149,50 R$ 3.448,50 R$ 862,12 R$ 3.448,50 R$ 689,70 R$ 3.448,50 R$ 574,75 R$ 3.814,39 R$ 544,91 R$ 3.877,70 R$ 484,71 R$ 3.941,67 R$ 437,96 R$ 4.006,30 R$ 400,63
Total Parcelas R$ 3.448,50 R$ 3.448,50 R$ 3.448,50 R$ 1.724,25 R$ 3.448,50 R$ 1.149,50 R$ 3.448,52 R$ 862,13 R$ 3.448,55 R$ 689,71 R$ 3.448,50 R$ 574,75 R$ 3.448,55 R$ 492,65 R$ 3.448,56 R$ 431,07 R$ 3.448,53 R$ 383,17 R$ 3.448,60 R$ 344,86 R$ 3.448,50 R$ 313,50
Total Parcelas R$ 3.448,50 R$ 3.448,50 R$ 3.448,50 R$ 1.724,25 R$ 3.448,50 R$ 1.149,50 R$ 3.448,52 R$ 862,13 R$ 3.448,55 R$ 689,71 R$ 3.448,50 R$ 574,75 R$ 3.448,55 R$ 492,65 R$ 3.448,56 R$ 431,07 R$ 3.448,53 R$ 383,17 R$ 3.448,60 R$ 344,86
Total Parcelas R$ 3.448,50 R$ 3.448,50 R$ 3.448,50 R$ 1.724,25 R$ 3.448,50 R$ 1.149,50 R$ 3.448,50 R$ 862,12 R$ 3.792,94 R$ 758,58 R$ 3.882,35 R$ 647,05 R$ 3.973,12 R$ 567,58 R$ 4.065,20 R$ 508,15 R$ 4.158,62 R$ 462,06 R$ 4.253,31 R$ 425,33
`;

describe('parseBradescoPaymentTable', () => {
  it('retorna null quando não encontra blocos suficientes', () => {
    expect(parseBradescoPaymentTable('')).toBeNull();
    expect(parseBradescoPaymentTable('sem tabela aqui')).toBeNull();
    expect(parseBradescoPaymentTable('Total Parcelas R$ 3.448,50 R$ 3.448,50')).toBeNull();
  });

  it('retorna 4 métodos de pagamento', () => {
    const result = parseBradescoPaymentTable(REAL_EXTRACT);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(4);
  });

  it('atribui tipos e labels corretos na ordem: débito, cc_bradesco, cc, carnê', () => {
    const result = parseBradescoPaymentTable(REAL_EXTRACT)!;
    expect(result[0].type).toBe('debit');
    expect(result[0].label).toBe('Débito em Conta');
    expect(result[1].type).toBe('credit_bradesco');
    expect(result[1].label).toBe('Cartão Bradesco');
    expect(result[2].type).toBe('credit_card');
    expect(result[2].label).toBe('Cartão de Crédito');
    expect(result[3].type).toBe('coupon');
    expect(result[3].label).toBe('Carnê');
  });

  it('extrai 10 parcelas para Débito em Conta', () => {
    const debit = parseBradescoPaymentTable(REAL_EXTRACT)![0];
    expect(debit.installments).toHaveLength(10);
  });

  it('extrai 11 parcelas para Cartão Bradesco', () => {
    const ccBradesco = parseBradescoPaymentTable(REAL_EXTRACT)![1];
    expect(ccBradesco.installments).toHaveLength(11);
  });

  it('extrai 10 parcelas para Cartão de Crédito', () => {
    const cc = parseBradescoPaymentTable(REAL_EXTRACT)![2];
    expect(cc.installments).toHaveLength(10);
  });

  it('extrai 10 parcelas para Carnê', () => {
    const carne = parseBradescoPaymentTable(REAL_EXTRACT)![3];
    expect(carne.installments).toHaveLength(10);
  });

  it('mapeia corretamente a 1ª parcela do Débito (total=3448.50, amount=3448.50)', () => {
    const inst = parseBradescoPaymentTable(REAL_EXTRACT)![0].installments[0];
    expect(inst.number).toBe(1);
    expect(inst.total).toBeCloseTo(3448.5);
    expect(inst.amount).toBeCloseTo(3448.5);
  });

  it('mapeia corretamente a 2ª parcela do Débito (total=3448.50, amount=1724.25)', () => {
    const inst = parseBradescoPaymentTable(REAL_EXTRACT)![0].installments[1];
    expect(inst.number).toBe(2);
    expect(inst.total).toBeCloseTo(3448.5);
    expect(inst.amount).toBeCloseTo(1724.25);
  });

  it('mapeia corretamente a 11ª parcela do CC Bradesco (total=3448.50, amount=313.50)', () => {
    const inst = parseBradescoPaymentTable(REAL_EXTRACT)![1].installments[10];
    expect(inst.number).toBe(11);
    expect(inst.total).toBeCloseTo(3448.5);
    expect(inst.amount).toBeCloseTo(313.5);
  });

  it('detecta juros no Débito a partir da 7ª parcela (total > 3448.50)', () => {
    const installments = parseBradescoPaymentTable(REAL_EXTRACT)![0].installments;
    // 1x-6x: sem juros
    expect(installments[5].total).toBeCloseTo(3448.5);
    // 7x-10x: com juros
    expect(installments[6].total).toBeGreaterThan(3448.5);
  });

  it('detecta que CC Bradesco é 100% sem juros (todos os totais ≈ 3448.50)', () => {
    const installments = parseBradescoPaymentTable(REAL_EXTRACT)![1].installments;
    installments.forEach((inst) => {
      expect(inst.total).toBeCloseTo(3448.5, 0);
    });
  });

  it('numeração das parcelas começa em 1 e é sequencial', () => {
    const result = parseBradescoPaymentTable(REAL_EXTRACT)!;
    for (const method of result) {
      method.installments.forEach((inst, i) => {
        expect(inst.number).toBe(i + 1);
      });
    }
  });
});
