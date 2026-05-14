import { UnprocessableEntityException } from '@nestjs/common';
import type { HealthQuoteDraft, HealthMemberLife } from '@corretor/types';
import { GenerateHealthXlsxUseCase } from './generate-health-xlsx.use-case';
import { HealthXlsxExportService } from '../services/health-xlsx-export.service';
import { parseHealthQuoteDraft } from '../../domain/schemas/health-quote-draft.schema';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function found(value: string) {
  return { value, source: 'table_lookup' as const, confidence: 1, needsReview: false };
}

function inferred(value: string) {
  return { value, source: 'inferred' as const, confidence: 0.7, needsReview: true };
}

function notFound() {
  return { value: null, source: 'not_found' as const, confidence: 0, needsReview: true };
}

function life(age: number, needsReview = false): HealthMemberLife {
  return {
    age,
    source: needsReview ? 'inferred' : 'extracted',
    needsReview,
  };
}

const CLEAN_OPTION = {
  sourceType: 'manual_table' as const,
  carrierOrOperator: 'Unimed PE',
  planName: 'Plano ENF',
  accommodation: found('Enfermaria'),
  coparticipation: found('Sem coparticipação'),
  reimbursementMode: found('Sem reembolso'),
  validUntil: found('2026-06-30'),
  dental: found('Não'),
  perLifePrices: [
    { lifeIndex: 0, price: 355 },
    { lifeIndex: 1, price: 430 },
  ],
  monthlyTotal: 785,
};

const CLEAN_DRAFT: HealthQuoteDraft = {
  lives: [life(34), life(41)],
  quoteOptions: [CLEAN_OPTION],
  reviewStatus: 'confirmed',
};

const DRAFT_WITH_PENDING_LIFE: HealthQuoteDraft = {
  ...CLEAN_DRAFT,
  lives: [life(34), life(41, true)],
};

const DRAFT_WITH_PENDING_FIELD: HealthQuoteDraft = {
  ...CLEAN_DRAFT,
  quoteOptions: [{ ...CLEAN_OPTION, reimbursementMode: inferred('Parcial') }],
};

const DRAFT_WITH_NOT_FOUND_FIELD: HealthQuoteDraft = {
  ...CLEAN_DRAFT,
  quoteOptions: [{ ...CLEAN_OPTION, dental: notFound() }],
};

// ─── GenerateHealthXlsxUseCase ────────────────────────────────────────────────

describe('GenerateHealthXlsxUseCase', () => {
  let useCase: GenerateHealthXlsxUseCase;

  beforeEach(() => {
    useCase = new GenerateHealthXlsxUseCase(new HealthXlsxExportService());
  });

  it('retorna Buffer para draft limpo', async () => {
    const buffer = await useCase.execute(CLEAN_DRAFT);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('buffer começa com assinatura PK (XLSX é ZIP)', async () => {
    const buffer = await useCase.execute(CLEAN_DRAFT);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });

  it('lança 422 quando há vida pendente e forceGenerate omitido', async () => {
    await expect(useCase.execute(DRAFT_WITH_PENDING_LIFE)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('lança 422 quando há campo de opção inferred pendente e forceGenerate omitido', async () => {
    await expect(useCase.execute(DRAFT_WITH_PENDING_FIELD)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('lança 422 quando há campo not_found e forceGenerate omitido', async () => {
    await expect(useCase.execute(DRAFT_WITH_NOT_FOUND_FIELD)).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('retorna Buffer para draft com vida pendente quando forceGenerate=true', async () => {
    const buffer = await useCase.execute(DRAFT_WITH_PENDING_LIFE, true);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('retorna Buffer para draft com campo pendente quando forceGenerate=true', async () => {
    const buffer = await useCase.execute(DRAFT_WITH_PENDING_FIELD, true);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it('mensagem de erro menciona "pendente"', async () => {
    let caught: unknown;
    try {
      await useCase.execute(DRAFT_WITH_PENDING_LIFE);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(UnprocessableEntityException);
    expect((caught as UnprocessableEntityException).message).toMatch(/pendente/i);
  });

  it('não lança para draft reviewStatus=confirmed sem itens pendentes', async () => {
    await expect(useCase.execute(CLEAN_DRAFT)).resolves.toBeInstanceOf(Buffer);
  });
});

// ─── Contrato schema + use-case: simula o que o controller faz ───────────────
//
// O frontend, ao confirmar a base de vidas, deve mudar source 'inferred' → 'manual'
// antes de enviar ao backend. Estes testes documentam o contrato:
// - inferred + needsReview:true → schema aceita (fonte bruta não confirmada)
// - inferred + needsReview:false → schema REJEITA (invariante do schema)
// - manual   + needsReview:false → schema aceita (corretor confirmou)

describe('parseHealthQuoteDraft + GenerateHealthXlsxUseCase — contrato de vidas confirmadas', () => {
  let useCase: GenerateHealthXlsxUseCase;

  beforeEach(() => {
    useCase = new GenerateHealthXlsxUseCase(new HealthXlsxExportService());
  });

  const baseOption = CLEAN_DRAFT.quoteOptions[0];

  it('rejeita draft com source=inferred e needsReview=false (invariante Zod)', () => {
    const rawDraft = {
      lives: [
        { age: 34, source: 'extracted', needsReview: false },
        { age: 41, source: 'inferred', needsReview: false }, // inválido
      ],
      quoteOptions: [baseOption],
      reviewStatus: 'confirmed',
    };
    expect(() => parseHealthQuoteDraft(rawDraft)).toThrow();
  });

  it('aceita draft com source=manual e needsReview=false (vida confirmada pelo corretor)', async () => {
    const confirmedDraft = parseHealthQuoteDraft({
      lives: [
        { age: 34, source: 'extracted', needsReview: false },
        { age: 41, source: 'manual', needsReview: false }, // confirmado
      ],
      quoteOptions: [baseOption],
      reviewStatus: 'confirmed',
    });
    await expect(useCase.execute(confirmedDraft)).resolves.toBeInstanceOf(Buffer);
  });

  it('aceita draft com source=inferred e needsReview=true (pendente, forceGenerate requerido)', async () => {
    const pendingDraft = parseHealthQuoteDraft({
      lives: [
        { age: 34, source: 'extracted', needsReview: false },
        { age: 41, source: 'inferred', needsReview: true }, // ainda pendente
      ],
      quoteOptions: [baseOption],
      reviewStatus: 'pending',
    });
    // forceGenerate=false deve lançar
    await expect(useCase.execute(pendingDraft, false)).rejects.toThrow(UnprocessableEntityException);
    // forceGenerate=true deve gerar
    await expect(useCase.execute(pendingDraft, true)).resolves.toBeInstanceOf(Buffer);
  });
});
