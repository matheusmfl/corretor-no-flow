import { UnprocessableEntityException } from '@nestjs/common';
import { parseHealthQuoteDraft } from './health-quote-draft.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extracted<T>(value: T) {
  return { value, source: 'extracted' as const, confidence: 0.95, needsReview: false };
}

function inferred<T>(value: T, needsReview = true) {
  return { value, source: 'inferred' as const, confidence: 0.75, needsReview };
}

function notFound() {
  return { value: null, source: 'not_found' as const, confidence: 0, needsReview: true };
}

const minimalOption = {
  sourceType: 'portal_pdf' as const,
  carrierOrOperator: 'Amil',
  planName: 'OURO QC R COPART TP',
  accommodation: extracted('Enfermaria'),
  coparticipation: extracted('Com coparticipação'),
  reimbursementMode: notFound(),
  validUntil: extracted('2026-06-01'),
  dental: notFound(),
};

const minimalLife = { age: 34, source: 'extracted' as const, needsReview: false };

const minimalDraft = {
  lives: [minimalLife],
  quoteOptions: [minimalOption],
  reviewStatus: 'pending' as const,
};

// ─── Valid cases ──────────────────────────────────────────────────────────────

describe('parseHealthQuoteDraft', () => {
  it('aceita rascunho mínimo válido', () => {
    const result = parseHealthQuoteDraft(minimalDraft);
    expect(result.reviewStatus).toBe('pending');
    expect(result.lives).toHaveLength(1);
    expect(result.quoteOptions).toHaveLength(1);
  });

  it('aceita vida sem nome mas com idade', () => {
    const draft = {
      ...minimalDraft,
      lives: [{ age: 18, source: 'extracted' as const, needsReview: false }],
    };
    const result = parseHealthQuoteDraft(draft);
    expect(result.lives[0].name).toBeUndefined();
    expect(result.lives[0].age).toBe(18);
  });

  it('aceita campo com source extracted', () => {
    const result = parseHealthQuoteDraft(minimalDraft);
    expect(result.quoteOptions[0].accommodation.source).toBe('extracted');
    expect(result.quoteOptions[0].accommodation.value).toBe('Enfermaria');
  });

  it('aceita campo com source inferred e needsReview true', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [{ ...minimalOption, accommodation: inferred('Enfermaria', true) }],
    };
    const result = parseHealthQuoteDraft(draft);
    expect(result.quoteOptions[0].accommodation.source).toBe('inferred');
    expect(result.quoteOptions[0].accommodation.needsReview).toBe(true);
  });

  it('aceita campo com source manual', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [
        {
          ...minimalOption,
          accommodation: { value: 'Apartamento', source: 'manual' as const, confidence: 1, needsReview: false },
        },
      ],
    };
    const result = parseHealthQuoteDraft(draft);
    expect(result.quoteOptions[0].accommodation.source).toBe('manual');
  });

  it('aceita campo com source table_lookup', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [
        {
          ...minimalOption,
          coparticipation: { value: '30%', source: 'table_lookup' as const, confidence: 0.99, needsReview: false },
        },
      ],
    };
    const result = parseHealthQuoteDraft(draft);
    expect(result.quoteOptions[0].coparticipation.source).toBe('table_lookup');
  });

  it('aceita campo not_found com value null e needsReview true', () => {
    const result = parseHealthQuoteDraft(minimalDraft);
    expect(result.quoteOptions[0].reimbursementMode.value).toBeNull();
    expect(result.quoteOptions[0].reimbursementMode.source).toBe('not_found');
    expect(result.quoteOptions[0].reimbursementMode.needsReview).toBe(true);
  });

  it('aceita opção com perLifePrices e monthlyTotal', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [
        {
          ...minimalOption,
          perLifePrices: [
            { lifeIndex: 0, price: 847.62 },
            { lifeIndex: 1, price: 1261.43 },
          ],
          monthlyTotal: 2109.05,
        },
      ],
    };
    const result = parseHealthQuoteDraft(draft);
    expect(result.quoteOptions[0].perLifePrices).toHaveLength(2);
    expect(result.quoteOptions[0].monthlyTotal).toBe(2109.05);
  });

  // ─── Failure cases ─────────────────────────────────────────────────────────

  it('lança exceção quando campo sensível inferido não tem needsReview true', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [{ ...minimalOption, accommodation: inferred('Enfermaria', false) }],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando coparticipation é inferred sem needsReview', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [{ ...minimalOption, coparticipation: inferred('Com copart', false) }],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando reimbursementMode é ocr sem needsReview', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [
        {
          ...minimalOption,
          reimbursementMode: { value: 'Parcial', source: 'ocr' as const, confidence: 0.6, needsReview: false },
        },
      ],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando validUntil é vision_inferred sem needsReview', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [
        {
          ...minimalOption,
          validUntil: { value: '2026-07-01', source: 'vision_inferred' as const, confidence: 0.5, needsReview: false },
        },
      ],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando dental é inferred sem needsReview', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [{ ...minimalOption, dental: inferred('Incluso', false) }],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando age da vida está ausente', () => {
    const draft = {
      ...minimalDraft,
      lives: [{ name: 'João', source: 'extracted' as const, needsReview: false }],
    };
    expect(() => parseHealthQuoteDraft(draft as any)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando confidence está acima de 1', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [
        {
          ...minimalOption,
          accommodation: { value: 'Enfermaria', source: 'extracted' as const, confidence: 1.1, needsReview: false },
        },
      ],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando confidence está abaixo de 0', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [
        {
          ...minimalOption,
          accommodation: { value: 'Enfermaria', source: 'extracted' as const, confidence: -0.1, needsReview: false },
        },
      ],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando not_found tem value não-null', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [
        {
          ...minimalOption,
          dental: { value: 'Incluso', source: 'not_found' as const, confidence: 0, needsReview: true },
        },
      ],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando not_found não tem needsReview true', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [
        {
          ...minimalOption,
          dental: { value: null, source: 'not_found' as const, confidence: 0, needsReview: false },
        },
      ],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando input não é objeto', () => {
    expect(() => parseHealthQuoteDraft(null)).toThrow(UnprocessableEntityException);
    expect(() => parseHealthQuoteDraft('string')).toThrow(UnprocessableEntityException);
  });

  // ─── HealthMemberLife — source sensível (P2b) ─────────────────────────────

  it('lança exceção quando vida tem source inferred e needsReview false', () => {
    const draft = {
      ...minimalDraft,
      lives: [{ age: 34, source: 'inferred' as const, needsReview: false }],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('lança exceção quando vida tem source ocr e needsReview false', () => {
    const draft = {
      ...minimalDraft,
      lives: [{ age: 34, source: 'ocr' as const, needsReview: false }],
    };
    expect(() => parseHealthQuoteDraft(draft)).toThrow(UnprocessableEntityException);
  });

  it('aceita vida com source inferred e needsReview true', () => {
    const draft = {
      ...minimalDraft,
      lives: [{ age: 34, source: 'inferred' as const, needsReview: true }],
    };
    expect(() => parseHealthQuoteDraft(draft)).not.toThrow();
  });

  // ─── Null normalisation (P0) ───────────────────────────────────────────────

  it('aceita clientName null da IA convertendo para undefined', () => {
    const draft = { ...minimalDraft, clientName: null };
    const result = parseHealthQuoteDraft(draft);
    expect(result.clientName).toBeUndefined();
  });

  it('aceita city e state null da IA convertendo para undefined', () => {
    const draft = { ...minimalDraft, city: null, state: null };
    const result = parseHealthQuoteDraft(draft);
    expect(result.city).toBeUndefined();
    expect(result.state).toBeUndefined();
  });

  it('aceita administratorOrChannel null na opção convertendo para undefined', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [{ ...minimalOption, administratorOrChannel: null, region: null }],
    };
    const result = parseHealthQuoteDraft(draft);
    expect(result.quoteOptions[0].administratorOrChannel).toBeUndefined();
    expect(result.quoteOptions[0].region).toBeUndefined();
  });

  it('preserva DraftField.value = null quando source é not_found mesmo com null stripping activo', () => {
    const draft = {
      ...minimalDraft,
      clientName: null,
      quoteOptions: [{ ...minimalOption, dental: notFound(), region: null }],
    };
    const result = parseHealthQuoteDraft(draft);
    expect(result.quoteOptions[0].dental.value).toBeNull();
    expect(result.quoteOptions[0].dental.source).toBe('not_found');
    expect(result.clientName).toBeUndefined();
    expect(result.quoteOptions[0].region).toBeUndefined();
  });

  it('preserva DraftField.value = null para todos os campos sensíveis not_found', () => {
    const draft = {
      ...minimalDraft,
      quoteOptions: [
        {
          ...minimalOption,
          accommodation: notFound(),
          coparticipation: notFound(),
          reimbursementMode: notFound(),
          validUntil: notFound(),
          dental: notFound(),
        },
      ],
    };
    const result = parseHealthQuoteDraft(draft);
    for (const field of ['accommodation', 'coparticipation', 'reimbursementMode', 'validUntil', 'dental'] as const) {
      expect(result.quoteOptions[0][field].value).toBeNull();
      expect(result.quoteOptions[0][field].source).toBe('not_found');
    }
  });
});
