import { parseTokioPaymentTable } from './tokio-payment-parser';

// Snippets extraídos dos PDFs reais (auto_tokio_discovery.md).
// Cada fixture representa o trecho de pagamento da página 3 de cada produto.

const AUTO_PAYMENT_SECTION = `
Primeira parcela à vista | IOF: 7,38%
Auto
Cartão Parcela (R$) Juros (%) Total (R$) Cartão Parcela (R$) Juros (%) Total (R$)
1 3.074,50 Antecipado* 3.074,50 7 462,23 Sem Juros 3.236,26
1 3.236,26 Sem Juros 3.236,26 8 404,43 Sem Juros 3.236,26
2 1.618,06 Sem Juros 3.236,26 9 359,47 Sem Juros 3.236,26
3 1.078,64 Sem Juros 3.236,26 10 323,52 Sem Juros 3.236,26
4 808,98 Sem Juros 3.236,26 11 294,13 Sem Juros 3.236,26
5 647,16 Sem Juros 3.236,26 12 269,60 Sem Juros 3.236,26
6 539,28 Sem Juros 3.236,26
*Você pode contar com desconto especial na transmissão antecipada com pagamento à vista, contratando o seguro até 10/05/2026.
`;

const AUTO_CLASSICO_PAYMENT_SECTION = `
Primeira parcela à vista | IOF: 7,38%
Auto Clássico
Cartão Parcela (R$) Juros (%) Total (R$) Cartão Parcela (R$) Juros (%) Total (R$)
1 2.900,75 Antecipado* 2.900,75 7 436,10 Sem Juros 3.053,38
1 3.053,38 Sem Juros 3.053,38 8 381,56 Sem Juros 3.053,38
2 1.526,62 Sem Juros 3.053,38 9 339,15 Sem Juros 3.053,38
3 1.017,68 Sem Juros 3.053,38 10 305,23 Sem Juros 3.053,38
4 763,26 Sem Juros 3.053,38 11 277,50 Sem Juros 3.053,38
5 610,58 Sem Juros 3.053,38 12 254,36 Sem Juros 3.053,38
6 508,78 Sem Juros 3.053,38
`;

const ROUBO_RASTREADOR_PAYMENT_SECTION = `
Primeira parcela à vista | IOF: 7,38%
Auto Roubo + Rastreador
Cartão Parcela (R$) Juros (%) Total (R$) Cartão Parcela (R$) Juros (%) Total (R$)
1 2.352,55 Antecipado* 2.352,55 7 353,66 Sem Juros 2.476,32
1 2.476,32 Sem Juros 2.476,32 8 309,44 Sem Juros 2.476,32
2 1.238,09 Sem Juros 2.476,32 9 275,04 Sem Juros 2.476,32
3 825,33 Sem Juros 2.476,32 10 247,53 Sem Juros 2.476,32
4 619,00 Sem Juros 2.476,32 11 225,04 Sem Juros 2.476,32
5 495,17 Sem Juros 2.476,32 12 206,27 Sem Juros 2.476,32
6 412,60 Sem Juros 2.476,32
`;

const ASSISTENCIA_EXCLUSIVA_PAYMENT_SECTION = `
Primeira parcela à vista | IOF: 7,38%
Assistência Exclusiva
Cartão Parcela (R$) Juros (%) Total (R$) Cartão Parcela (R$) Juros (%) Total (R$)
1 361,71 Antecipado* 361,71 4 95,18 Sem Juros 380,75
1 380,75 Sem Juros 380,75 5 76,14 Sem Juros 380,75
2 190,37 Sem Juros 380,75 6 63,45 Sem Juros 380,75
3 126,91 Sem Juros 380,75
`;

// Proteção Mensal: produto mensal, tabela expõe apenas a linha 12x.
// Não há Antecipado* observado neste produto.
const PROTECAO_MENSAL_PAYMENT_SECTION = `
Primeira parcela à vista | IOF: 7,38%
Auto Proteção Mensal
Cartão Parcela (R$) Juros (%) Total (R$) Cartão Parcela (R$) Juros (%) Total (R$)
Aceitação e prêmio podem sofrer alterações mediante recebimento de novos dados ou novas cotações realizadas.
Tipo de oficina para reparo Rede Referenciada
Tipo de peça para reparo Novas Compatíveis
Km adicional reboque 200 km (padrão) + Não possui (adicional) = 200 KM
12 227,56 Sem Juros 2.731,41
`;

describe('parseTokioPaymentTable', () => {
  describe('entradas inválidas', () => {
    it('retorna null para string vazia', () => {
      expect(parseTokioPaymentTable('')).toBeNull();
    });

    it('retorna null quando não há marcador de primeira parcela', () => {
      expect(parseTokioPaymentTable('sem tabela aqui')).toBeNull();
    });

    it('retorna null quando há marcador mas sem linhas de pagamento', () => {
      expect(parseTokioPaymentTable('Primeira parcela à vista | IOF: 7,38%\nTexto sem tabela')).toBeNull();
    });
  });

  describe('Auto — 12 parcelas sem juros + antecipado', () => {
    let result: ReturnType<typeof parseTokioPaymentTable>;

    beforeAll(() => {
      result = parseTokioPaymentTable(AUTO_PAYMENT_SECTION);
    });

    it('não retorna null', () => expect(result).not.toBeNull());

    it('retorna 2 métodos: Cartão de Crédito e À Vista com Desconto', () => {
      expect(result).toHaveLength(2);
    });

    it('Cartão de Crédito tem id "cartao-credito" e tipo credit_card', () => {
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc).toBeDefined();
      expect(cc!.type).toBe('credit_card');
    });

    it('Cartão de Crédito tem 12 parcelas sem juros', () => {
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc!.installments).toHaveLength(12);
      expect(cc!.installments.every((i) => !i.hasInterest)).toBe(true);
    });

    it('1ª parcela Cartão = R$ 3.236,26', () => {
      const cc = result!.find((m) => m.id === 'cartao-credito');
      const first = cc!.installments.find((i) => i.number === 1);
      expect(first!.amount).toBeCloseTo(3236.26);
    });

    it('12ª parcela Cartão = R$ 269,60', () => {
      const cc = result!.find((m) => m.id === 'cartao-credito');
      const last = cc!.installments.find((i) => i.number === 12);
      expect(last!.amount).toBeCloseTo(269.60);
    });

    it('À Vista com Desconto tem id "cartao-credito-antecipado" e 1 parcela', () => {
      const ant = result!.find((m) => m.id === 'cartao-credito-antecipado');
      expect(ant).toBeDefined();
      expect(ant!.installments).toHaveLength(1);
      expect(ant!.installments[0].amount).toBeCloseTo(3074.50);
      expect(ant!.installments[0].discountLabel).toBe('Antecipado');
    });
  });

  describe('Auto Clássico — 12 parcelas', () => {
    let result: ReturnType<typeof parseTokioPaymentTable>;

    beforeAll(() => {
      result = parseTokioPaymentTable(AUTO_CLASSICO_PAYMENT_SECTION);
    });

    it('não retorna null', () => expect(result).not.toBeNull());
    it('Cartão de Crédito tem 12 parcelas', () => {
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc!.installments).toHaveLength(12);
    });
    it('12ª parcela = R$ 254,36', () => {
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc!.installments.find((i) => i.number === 12)!.amount).toBeCloseTo(254.36);
    });
    it('Antecipado = R$ 2.900,75', () => {
      const ant = result!.find((m) => m.id === 'cartao-credito-antecipado');
      expect(ant!.installments[0].amount).toBeCloseTo(2900.75);
    });
  });

  describe('Auto Roubo + Rastreador — 12 parcelas', () => {
    let result: ReturnType<typeof parseTokioPaymentTable>;

    beforeAll(() => {
      result = parseTokioPaymentTable(ROUBO_RASTREADOR_PAYMENT_SECTION);
    });

    it('não retorna null', () => expect(result).not.toBeNull());
    it('Cartão de Crédito tem 12 parcelas', () => {
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc!.installments).toHaveLength(12);
    });
    it('12ª parcela = R$ 206,27', () => {
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc!.installments.find((i) => i.number === 12)!.amount).toBeCloseTo(206.27);
    });
  });

  describe('Assistência Exclusiva — 6 parcelas', () => {
    let result: ReturnType<typeof parseTokioPaymentTable>;

    beforeAll(() => {
      result = parseTokioPaymentTable(ASSISTENCIA_EXCLUSIVA_PAYMENT_SECTION);
    });

    it('não retorna null', () => expect(result).not.toBeNull());
    it('Cartão de Crédito tem 6 parcelas sem juros', () => {
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc!.installments).toHaveLength(6);
    });
    it('6ª parcela = R$ 63,45', () => {
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc!.installments.find((i) => i.number === 6)!.amount).toBeCloseTo(63.45);
    });
    it('Antecipado = R$ 361,71', () => {
      const ant = result!.find((m) => m.id === 'cartao-credito-antecipado');
      expect(ant).toBeDefined();
      expect(ant!.installments[0].amount).toBeCloseTo(361.71);
    });
  });

  describe('Auto Proteção Mensal — produto mensal, apenas linha 12x', () => {
    let result: ReturnType<typeof parseTokioPaymentTable>;

    beforeAll(() => {
      result = parseTokioPaymentTable(PROTECAO_MENSAL_PAYMENT_SECTION);
    });

    it('não retorna null', () => expect(result).not.toBeNull());
    it('retorna apenas Cartão de Crédito (sem Antecipado)', () => {
      expect(result).toHaveLength(1);
      expect(result![0].id).toBe('cartao-credito');
    });
    it('Cartão de Crédito tem 1 entrada com número 12 e parcela R$ 227,56', () => {
      const cc = result![0];
      expect(cc.installments).toHaveLength(1);
      expect(cc.installments[0].number).toBe(12);
      expect(cc.installments[0].amount).toBeCloseTo(227.56);
      expect(cc.installments[0].hasInterest).toBe(false);
    });
    it('total anualizado R$ 2.731,41 é preservado na parcela 12x', () => {
      expect(result![0].installments[0].total).toBeCloseTo(2731.41);
    });
    it('não inventa parcelas 1-11 para produto mensal', () => {
      const cc = result![0];
      const hasOtherInstallments = cc.installments.some((i) => i.number !== 12);
      expect(hasOtherInstallments).toBe(false);
    });
  });

  describe('isolamento de seção Cartão — não absorve carnê/débito', () => {
    it('não inclui linhas de Carnê em cartao-credito', () => {
      const withCarne = AUTO_PAYMENT_SECTION + `
Carnê
Parcela (R$) Juros (%) Total (R$)
1 3.236,26 Sem Juros 3.236,26
12 269,60 Sem Juros 3.236,26
`;
      const result = parseTokioPaymentTable(withCarne);
      expect(result).not.toBeNull();
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc!.installments).toHaveLength(12);
    });

    it('não inclui linhas de Débito em conta em cartao-credito', () => {
      const withDebito = AUTO_PAYMENT_SECTION + `
Débito em Conta
Parcela (R$) Juros (%) Total (R$)
1 3.236,26 Sem Juros 3.236,26
12 269,60 Sem Juros 3.236,26
`;
      const result = parseTokioPaymentTable(withDebito);
      expect(result).not.toBeNull();
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc!.installments).toHaveLength(12);
    });

    it('não inclui linhas de Boleto em cartao-credito', () => {
      const withBoleto = ASSISTENCIA_EXCLUSIVA_PAYMENT_SECTION + `
Boleto Bancário
Parcela (R$) Juros (%) Total (R$)
1 380,75 Sem Juros 380,75
6 63,45 Sem Juros 380,75
`;
      const result = parseTokioPaymentTable(withBoleto);
      expect(result).not.toBeNull();
      const cc = result!.find((m) => m.id === 'cartao-credito');
      expect(cc!.installments).toHaveLength(6);
    });
  });

  describe('total da parcela — campo gravado para todos os produtos', () => {
    it('Auto: 1ª parcela Sem Juros tem total = 3.236,26', () => {
      const result = parseTokioPaymentTable(AUTO_PAYMENT_SECTION)!;
      const cc = result.find((m) => m.id === 'cartao-credito')!;
      expect(cc.installments[0].total).toBeCloseTo(3236.26);
    });
    it('Auto: Antecipado tem total = 3.074,50 (valor descontado)', () => {
      const result = parseTokioPaymentTable(AUTO_PAYMENT_SECTION)!;
      const ant = result.find((m) => m.id === 'cartao-credito-antecipado')!;
      expect(ant.installments[0].total).toBeCloseTo(3074.50);
    });
    it('Assistência Exclusiva: 6ª parcela tem total = 380,75', () => {
      const result = parseTokioPaymentTable(ASSISTENCIA_EXCLUSIVA_PAYMENT_SECTION)!;
      const cc = result.find((m) => m.id === 'cartao-credito')!;
      expect(cc.installments.find((i) => i.number === 6)!.total).toBeCloseTo(380.75);
    });
  });
});
