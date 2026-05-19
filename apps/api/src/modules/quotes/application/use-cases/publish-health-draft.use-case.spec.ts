import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import type { HealthQuoteDraft, DraftField } from '@corretor/types';
import { PublishHealthDraftUseCase } from './publish-health-draft.use-case';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function found(value: string): DraftField<string> {
  return { value, source: 'table_lookup', confidence: 1, needsReview: false };
}
function extracted(value: string): DraftField<string> {
  return { value, source: 'extracted', confidence: 0.9, needsReview: false };
}
function notFound(): DraftField<string> {
  return { value: null, source: 'not_found', confidence: 0, needsReview: true };
}

const DRAFT: HealthQuoteDraft = {
  clientName: 'Empresa Teste Ltda',
  lives: [
    { age: 34, name: 'Ana', source: 'extracted', needsReview: false },
  ],
  quoteOptions: [
    {
      sourceType: 'manual_table',
      carrierOrOperator: 'Unimed PE',
      planName: 'Enfermaria',
      accommodation: found('Enfermaria'),
      coparticipation: found('Sem coparticipação'),
      reimbursementMode: notFound(),
      validUntil: extracted('2026-06-30'),
      dental: notFound(),
      monthlyTotal: 355,
    },
  ],
  warnings: [],
  reviewStatus: 'confirmed',
};

// ─── Setup ────────────────────────────────────────────────────────────────────

let prisma: DeepMockProxy<PrismaClient>;
let config: jest.Mocked<ConfigService>;
let useCase: PublishHealthDraftUseCase;

const EXPIRES_AT = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const PROCESS_ID  = 'process-health-1';
const QUOTE_ID    = 'quote-health-1';
const TOKEN       = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function mockCreates() {
  prisma.quoteProcess.create.mockResolvedValue({
    id: PROCESS_ID,
    publicToken: TOKEN,
    expiresAt: EXPIRES_AT,
  } as any);
  prisma.quote.create.mockResolvedValue({ id: QUOTE_ID } as any);
  prisma.quoteProcess.update.mockResolvedValue({} as any);
}

beforeEach(() => {
  prisma = mockDeep<PrismaClient>();
  config = { get: jest.fn() } as any;
  (config.get as jest.Mock).mockReturnValue(undefined);
  useCase = new PublishHealthDraftUseCase(prisma as unknown as PrismaService, config);
  mockCreates();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PublishHealthDraftUseCase', () => {
  it('cria QuoteProcess com product HEALTH e status PUBLISHED', async () => {
    await useCase.execute('company-1', DRAFT);

    expect(prisma.quoteProcess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          product: 'HEALTH',
          status: 'PUBLISHED',
        }),
      }),
    );
  });

  it('cria Quote com status READY e extractedData = draft', async () => {
    await useCase.execute('company-1', DRAFT);

    expect(prisma.quote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processId: PROCESS_ID,
          status: 'READY',
          extractedData: DRAFT,
        }),
      }),
    );
  });

  it('atualiza processo com publicQuoteIds após criar quote', async () => {
    await useCase.execute('company-1', DRAFT);

    expect(prisma.quoteProcess.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PROCESS_ID },
        data: expect.objectContaining({
          publicQuoteIds: [QUOTE_ID],
        }),
      }),
    );
  });

  it('retorna publicToken e publicUrl com o token', async () => {
    const result = await useCase.execute('company-1', DRAFT);

    expect(result.publicToken).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.publicUrl).toContain(result.publicToken);
    expect(result.publicUrl).toContain('/c/');
  });

  it('retorna expiresAt com 30 dias no futuro', async () => {
    const before = Date.now();
    const result = await useCase.execute('company-1', DRAFT);
    const after  = Date.now();

    const ms30d = 30 * 24 * 60 * 60 * 1000;
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(before + ms30d - 1000);
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(after  + ms30d + 1000);
  });

  it('usa clientName do draft no QuoteProcess', async () => {
    await useCase.execute('company-1', DRAFT);

    expect(prisma.quoteProcess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientName: 'Empresa Teste Ltda',
        }),
      }),
    );
  });

  it('usa PUBLIC_LINK_BASE_URL do config quando disponível', async () => {
    (config.get as jest.Mock).mockImplementation((key: string) =>
      key === 'PUBLIC_LINK_BASE_URL' ? 'https://app.corretornoflow.com.br' : undefined,
    );

    const result = await useCase.execute('company-1', DRAFT);
    expect(result.publicUrl).toMatch(/^https:\/\/app\.corretornoflow\.com\.br\/c\//);
  });
});
