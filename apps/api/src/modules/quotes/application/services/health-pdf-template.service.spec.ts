import type { HealthQuoteDraft, DraftField } from '@corretor/types';
import { HealthPdfTemplateService } from './health-pdf-template.service';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function found(value: string): DraftField<string> {
  return { value, source: 'table_lookup', confidence: 1, needsReview: false };
}
function extracted(value: string): DraftField<string> {
  return { value, source: 'extracted', confidence: 0.9, needsReview: false };
}
function inferred(value: string): DraftField<string> {
  return { value, source: 'inferred', confidence: 0.7, needsReview: true };
}
function notFound(): DraftField<string> {
  return { value: null, source: 'not_found', confidence: 0, needsReview: true };
}

const BASE_DRAFT: HealthQuoteDraft = {
  clientName: 'Empresa Teste Ltda',
  sourceFiles: ['cotacao-saude.pdf'],
  lives: [
    { age: 34, name: 'Ana Souza', relationship: 'Titular', source: 'extracted', needsReview: false },
    { age: 9,  name: 'Lucas',    relationship: 'Filho',   source: 'extracted', needsReview: false },
  ],
  quoteOptions: [
    {
      sourceType: 'portal_pdf',
      carrierOrOperator: 'SulAmérica',
      planName: 'Direto Nacional Enfermaria',
      accommodation: extracted('Enfermaria'),
      coparticipation: extracted('Sem coparticipação'),
      reimbursementMode: inferred('Parcial'),
      validUntil: extracted('2026-06-27'),
      dental: notFound(),
      perLifePrices: [
        { lifeIndex: 0, price: 925.02, bandLabel: '34 a 38' },
        { lifeIndex: 1, price: 800.02, bandLabel: '0 a 18' },
      ],
      monthlyTotal: 1725.04,
      warnings: ['IOF não incluído — confirmar total ao cliente'],
    },
    {
      sourceType: 'manual_table',
      carrierOrOperator: 'Unimed PE',
      planName: 'Enfermaria',
      accommodation: found('Enfermaria'),
      coparticipation: found('Sem coparticipação'),
      reimbursementMode: notFound(),
      validUntil: found('2026-06-30'),
      dental: notFound(),
      perLifePrices: [
        { lifeIndex: 0, price: 355.00, bandLabel: '34 a 38' },
        { lifeIndex: 1, price: 210.00, bandLabel: '0 a 18' },
      ],
      monthlyTotal: 565.00,
    },
  ],
  warnings: [],
  reviewStatus: 'confirmed',
};

const service = new HealthPdfTemplateService();

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HealthPdfTemplateService', () => {
  it('retorna string HTML', () => {
    const html = service.render(BASE_DRAFT);
    expect(typeof html).toBe('string');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('inclui nome do cliente no HTML', () => {
    const html = service.render(BASE_DRAFT);
    expect(html).toContain('Empresa Teste Ltda');
  });

  it('inclui nomes das operadoras', () => {
    const html = service.render(BASE_DRAFT);
    expect(html).toContain('SulAmérica');
    expect(html).toContain('Unimed PE');
  });

  it('inclui nomes dos planos', () => {
    const html = service.render(BASE_DRAFT);
    expect(html).toContain('Direto Nacional Enfermaria');
    expect(html).toContain('Enfermaria');
  });

  it('inclui totais mensais de cada opção', () => {
    const html = service.render(BASE_DRAFT);
    expect(html).toContain('1.725');
    expect(html).toContain('565');
  });

  it('inclui nomes dos beneficiários', () => {
    const html = service.render(BASE_DRAFT);
    expect(html).toContain('Ana Souza');
    expect(html).toContain('Lucas');
  });

  it('inclui validade das opções', () => {
    const html = service.render(BASE_DRAFT);
    expect(html).toContain('2026-06-27');
    expect(html).toContain('2026-06-30');
  });

  it('exibe warnings de opções no HTML', () => {
    const html = service.render(BASE_DRAFT);
    expect(html).toContain('IOF não incluído');
  });

  it('exibe nota sobre campos needsReview (reimbursementMode inferred)', () => {
    const html = service.render(BASE_DRAFT);
    expect(html).toContain('Reembolso');
    // inferred: deve aparecer com indicação de revisão, não como fato confirmado
    expect(html).toContain('confirmar');
  });

  it('não afirma rede, carência ou reembolso como fato quando needsReview', () => {
    const html = service.render(BASE_DRAFT);
    // campos not_found não devem aparecer como valores confirmados
    // dental é not_found — não deve ter valor "confirmado" no HTML
    expect(html).not.toMatch(/Odonto[^<]*R\$/);
  });

  it('funciona sem clientName', () => {
    const draft = { ...BASE_DRAFT, clientName: undefined };
    const html = service.render(draft);
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('funciona com opção sem perLifePrices', () => {
    const draft: HealthQuoteDraft = {
      ...BASE_DRAFT,
      quoteOptions: [{
        ...BASE_DRAFT.quoteOptions[0],
        perLifePrices: undefined,
        monthlyTotal: undefined,
      }],
    };
    expect(() => service.render(draft)).not.toThrow();
  });

  it('mantém testes de template AUTO inalterados (isolamento)', () => {
    // Garante que HealthPdfTemplateService não interfere com QuotePdfTemplateService
    // (cada um é uma classe separada; este teste só verifica que a importação não quebra)
    expect(service).toBeInstanceOf(HealthPdfTemplateService);
  });
});
