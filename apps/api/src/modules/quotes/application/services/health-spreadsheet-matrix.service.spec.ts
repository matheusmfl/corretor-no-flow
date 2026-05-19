import type { HealthQuoteDraft, HealthMemberLife, HealthQuoteOption } from '@corretor/types';
import { buildHealthSpreadsheetMatrix, SpreadsheetMatrix } from './health-spreadsheet-matrix.service';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function notFound() {
  return { value: null, source: 'not_found' as const, confidence: 0, needsReview: true };
}

function found(value: string) {
  return { value, source: 'table_lookup' as const, confidence: 1, needsReview: false };
}

function life(age: number, name?: string, relationship?: string): HealthMemberLife {
  return { age, name, relationship, source: 'extracted', needsReview: false };
}

function option(
  planName: string,
  perLifePrices: Array<{ lifeIndex: number; price: number; bandLabel?: string }>,
  monthlyTotal: number,
  overrides?: Partial<HealthQuoteOption>,
): HealthQuoteOption {
  return {
    sourceType: 'manual_table',
    carrierOrOperator: 'Unimed PE',
    planName,
    accommodation: found('Enfermaria'),
    coparticipation: found('Sem coparticipação'),
    reimbursementMode: notFound(),
    validUntil: found('2026-06-30'),
    dental: notFound(),
    perLifePrices,
    monthlyTotal,
    ...overrides,
  };
}

const DRAFT_3_LIVES_2_OPTIONS: HealthQuoteDraft = {
  lives: [life(34, 'Ana'), life(41, 'Bruno', 'cônjuge'), life(9, undefined, 'filho')],
  quoteOptions: [
    option('Plano ENF', [
      { lifeIndex: 0, price: 355.00, bandLabel: '34 a 38' },
      { lifeIndex: 1, price: 430.00, bandLabel: '39 a 43' },
      { lifeIndex: 2, price: 210.00, bandLabel: '0 a 18' },
    ], 995.00),
    option('Plano APT', [
      { lifeIndex: 0, price: 461.50, bandLabel: '34 a 38' },
      { lifeIndex: 1, price: 559.00, bandLabel: '39 a 43' },
      { lifeIndex: 2, price: 273.00, bandLabel: '0 a 18' },
    ], 1293.50),
  ],
  reviewStatus: 'confirmed',
};

// ─── buildHealthSpreadsheetMatrix ─────────────────────────────────────────────

describe('buildHealthSpreadsheetMatrix', () => {
  describe('estrutura de linhas e colunas', () => {
    it('retorna uma linha por vida mais uma linha de total', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      // 3 lives + 1 total row
      expect(matrix.rows).toHaveLength(4);
    });

    it('última linha é a linha de total', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      expect(matrix.rows[matrix.rows.length - 1].isTotal).toBe(true);
    });

    it('linhas de vida não são total', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      matrix.rows.slice(0, -1).forEach((row) => expect(row.isTotal).toBe(false));
    });

    it('headers contém identificador, idade, parentesco e uma coluna por opção', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      expect(matrix.headers).toContain('Nome / Beneficiário');
      expect(matrix.headers).toContain('Idade');
      expect(matrix.headers).toContain('Parentesco');
      expect(matrix.headers).toContain('Plano ENF');
      expect(matrix.headers).toContain('Plano APT');
    });

    it('número de colunas de preço igual ao número de opções', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      expect(matrix.planColumns).toHaveLength(DRAFT_3_LIVES_2_OPTIONS.quoteOptions.length);
    });
  });

  describe('valores por vida', () => {
    it('cada linha de vida tem o preço correto por opção', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      const [anaRow] = matrix.rows;
      expect(anaRow.planValues[0]).toBe(355.00);
      expect(anaRow.planValues[1]).toBe(461.50);
    });

    it('vida sem perLifePrice numa opção recebe null', () => {
      const draftMissingPrice: HealthQuoteDraft = {
        ...DRAFT_3_LIVES_2_OPTIONS,
        quoteOptions: [
          option('Plano ENF', [
            { lifeIndex: 0, price: 355.00 },
            // lifeIndex 1 omitido
          ], 355.00),
        ],
      };
      const matrix = buildHealthSpreadsheetMatrix(draftMissingPrice);
      expect(matrix.rows[1].planValues[0]).toBeNull();
    });
  });

  describe('fallback de labels', () => {
    it('vida com nome usa o nome', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      expect(matrix.rows[0].label).toBe('Ana');
    });

    it('vida sem nome mas com parentesco usa parentesco', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      const filhoRow = matrix.rows[2];
      expect(filhoRow.label).toBe('filho');
    });

    it('vida sem nome mas com label usa label (vidas inferidas por faixa)', () => {
      const draft: HealthQuoteDraft = {
        lives: [{ age: 9, label: 'Vida 1 - 0 a 18', source: 'inferred', needsReview: true }],
        quoteOptions: [option('P1', [{ lifeIndex: 0, price: 210 }], 210)],
        reviewStatus: 'confirmed',
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      expect(matrix.rows[0].label).toBe('Vida 1 - 0 a 18');
    });

    it('vida sem nome e sem parentesco usa "Beneficiário N"', () => {
      const draft: HealthQuoteDraft = {
        lives: [life(30)],
        quoteOptions: [option('P1', [{ lifeIndex: 0, price: 300 }], 300)],
        reviewStatus: 'confirmed',
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      expect(matrix.rows[0].label).toBe('Beneficiário 1');
    });
  });

  describe('linha de total', () => {
    it('total por opção vem de monthlyTotal quando disponível', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      const totalRow = matrix.rows[matrix.rows.length - 1];
      expect(totalRow.planValues[0]).toBe(995.00);
      expect(totalRow.planValues[1]).toBe(1293.50);
    });

    it('total por opção cai para soma dos perLifePrices quando monthlyTotal ausente', () => {
      const draft: HealthQuoteDraft = {
        lives: [life(34), life(41)],
        quoteOptions: [
          option('P1', [
            { lifeIndex: 0, price: 355.00 },
            { lifeIndex: 1, price: 430.00 },
          ], undefined as unknown as number), // monthlyTotal omitido
        ],
      };
      (draft.quoteOptions[0] as HealthQuoteOption & { monthlyTotal?: number }).monthlyTotal = undefined;
      const matrix = buildHealthSpreadsheetMatrix(draft);
      const totalRow = matrix.rows[matrix.rows.length - 1];
      expect(totalRow.planValues[0]).toBeCloseTo(785.00, 2);
    });
  });

  describe('notas', () => {
    it('inclui a data de validade de cada opção nas notas', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      const note = matrix.notes.find((n) => /validade/i.test(n.key));
      expect(note).toBeDefined();
      expect(note!.value).toContain('2026-06-30');
    });

    it('inclui warnings do draft nas notas quando presentes', () => {
      const draft: HealthQuoteDraft = {
        ...DRAFT_3_LIVES_2_OPTIONS,
        warnings: ['Tabela sem validade definida'],
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      const warningNote = matrix.notes.find((n) => /Tabela sem validade/i.test(n.value));
      expect(warningNote).toBeDefined();
    });

    it('inclui warnings de opções nas notas quando presentes', () => {
      const draft: HealthQuoteDraft = {
        ...DRAFT_3_LIVES_2_OPTIONS,
        quoteOptions: [
          {
            ...DRAFT_3_LIVES_2_OPTIONS.quoteOptions[0],
            warnings: ['Confirmar coparticipação antes de enviar'],
          },
          DRAFT_3_LIVES_2_OPTIONS.quoteOptions[1],
        ],
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      const warningNote = matrix.notes.find((n) => /Confirmar coparti/i.test(n.value));
      expect(warningNote).toBeDefined();
    });

    it('inclui operadora/fonte de cada opção nas notas', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      const sourceNote = matrix.notes.find((n) => /Unimed PE/i.test(n.value));
      expect(sourceNote).toBeDefined();
    });

    it('inclui campos not_found que precisam de revisão nas notas', () => {
      const draft: HealthQuoteDraft = {
        lives: [life(34)],
        quoteOptions: [
          option('P1', [{ lifeIndex: 0, price: 355 }], 355, { validUntil: notFound() }),
        ],
        reviewStatus: 'confirmed',
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      const reviewNote = matrix.notes.find((n) => /validUntil|validade/i.test(n.key));
      expect(reviewNote?.needsReview).toBe(true);
    });
  });

  describe('todos as quoteOptions médicas entram', () => {
    it('todas as opções médicas do draft aparecem nas colunas', () => {
      const matrix = buildHealthSpreadsheetMatrix(DRAFT_3_LIVES_2_OPTIONS);
      expect(matrix.planColumns.map((c) => c.planName)).toEqual(['Plano ENF', 'Plano APT']);
    });
  });

  describe('filtragem dental-only', () => {
    function dentalOnlyOption(planName: string): HealthQuoteOption {
      return {
        sourceType: 'portal_pdf',
        carrierOrOperator: 'Amil',
        planName,
        accommodation: notFound(),
        coparticipation: notFound(),
        reimbursementMode: notFound(),
        validUntil: found('2026-06-30'),
        dental: { value: 'Incluso', source: 'extracted' as const, confidence: 0.95, needsReview: false },
        perLifePrices: [],
        monthlyTotal: 89.9,
      };
    }

    it('opção dental-only não aparece como coluna da matriz', () => {
      const draft: HealthQuoteDraft = {
        ...DRAFT_3_LIVES_2_OPTIONS,
        quoteOptions: [
          DRAFT_3_LIVES_2_OPTIONS.quoteOptions[0],
          dentalOnlyOption('DENTAL BRONZE PJ PROMO'),
        ],
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      expect(matrix.planColumns.map((c) => c.planName)).not.toContain('DENTAL BRONZE PJ PROMO');
    });

    it('opção dental-only com nome contendo "Odonto" não aparece como coluna', () => {
      const draft: HealthQuoteDraft = {
        ...DRAFT_3_LIVES_2_OPTIONS,
        quoteOptions: [
          DRAFT_3_LIVES_2_OPTIONS.quoteOptions[0],
          dentalOnlyOption('Odonto Premium'),
        ],
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      expect(matrix.planColumns.map((c) => c.planName)).toEqual(['Plano ENF']);
    });

    it('opção médica normal continua aparecendo como coluna quando há dental-only junto', () => {
      const draft: HealthQuoteDraft = {
        ...DRAFT_3_LIVES_2_OPTIONS,
        quoteOptions: [
          DRAFT_3_LIVES_2_OPTIONS.quoteOptions[0],
          dentalOnlyOption('DENTAL BRONZE PJ PROMO'),
        ],
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      expect(matrix.planColumns.map((c) => c.planName)).toContain('Plano ENF');
    });

    it('opção dental-only aparece nas notas como adicional odonto', () => {
      const draft: HealthQuoteDraft = {
        ...DRAFT_3_LIVES_2_OPTIONS,
        quoteOptions: [
          DRAFT_3_LIVES_2_OPTIONS.quoteOptions[0],
          dentalOnlyOption('DENTAL BRONZE PJ PROMO'),
        ],
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      const dentalNote = matrix.notes.find((n) => /dental|odonto/i.test(n.key));
      expect(dentalNote).toBeDefined();
    });

    it('warnings de opção dental-only aparecem nas notas do XLSX', () => {
      const dentalWithWarning = {
        ...dentalOnlyOption('DENTAL BRONZE PJ PROMO'),
        warnings: ['nesse valor não está calculado o reajuste atuarial'],
      };
      const draft: HealthQuoteDraft = {
        ...DRAFT_3_LIVES_2_OPTIONS,
        quoteOptions: [DRAFT_3_LIVES_2_OPTIONS.quoteOptions[0], dentalWithWarning],
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      const warningNote = matrix.notes.find((n) => /reajuste atuarial/i.test(n.value));
      expect(warningNote).toBeDefined();
    });

    it('número de colunas de preço corresponde apenas às opções médicas', () => {
      const draft: HealthQuoteDraft = {
        ...DRAFT_3_LIVES_2_OPTIONS,
        quoteOptions: [
          DRAFT_3_LIVES_2_OPTIONS.quoteOptions[0],
          DRAFT_3_LIVES_2_OPTIONS.quoteOptions[1],
          dentalOnlyOption('DENTAL BRONZE PJ PROMO'),
        ],
      };
      const matrix = buildHealthSpreadsheetMatrix(draft);
      expect(matrix.planColumns).toHaveLength(2);
    });
  });
});
