import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { GenerateLinkUseCase } from './generate-link.use-case';

const makeProcess = (overrides = {}) => ({
  id: 'proc-1',
  companyId: 'comp-1',
  status: 'PENDING_REVIEW',
  publicToken: null,
  quotes: [
    { id: 'q1', status: QuoteStatus.READY },
  ],
  ...overrides,
});

function makeConfig(overrides?: Record<string, string | undefined>) {
  const map: Record<string, string | undefined> = {
    APP_URL: 'https://dashboard.example.com',
    ...(overrides ?? {}),
  };
  return {
    get: (key: string) => map[key],
  } as ConfigService;
}

describe('GenerateLinkUseCase', () => {
  let useCase: GenerateLinkUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new GenerateLinkUseCase(prisma as unknown as PrismaService, makeConfig());
  });

  it('gera publicToken, define expiresAt e muda status para PUBLISHED', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);
    prisma.quoteProcess.update.mockResolvedValue({} as any);

    const result = await useCase.execute('comp-1', 'proc-1');

    expect(prisma.quoteProcess.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'proc-1' },
        data: expect.objectContaining({
          status: 'PUBLISHED',
          publicToken: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      }),
    );
    expect(result.publicToken).toBeTruthy();
    expect(result.publicUrl).toContain(result.publicToken);
    expect(result.publicUrl).toMatch(/^https:\/\/dashboard\.example\.com\/c\//);
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('usa PUBLIC_LINK_BASE_URL quando definido (sobrescreve APP_URL)', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);
    prisma.quoteProcess.update.mockResolvedValue({} as any);

    const useCaseWithPublic = new GenerateLinkUseCase(
      prisma as unknown as PrismaService,
      makeConfig({
        PUBLIC_LINK_BASE_URL: 'https://app.corretor.com.br/',
        APP_URL: 'https://ignored.example.com',
      }),
    );

    const result = await useCaseWithPublic.execute('comp-1', 'proc-1');

    expect(result.publicUrl).toBe(`https://app.corretor.com.br/c/${result.publicToken}`);
  });

  it('expiresAt é aproximadamente 30 dias a partir de agora', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);
    prisma.quoteProcess.update.mockResolvedValue({} as any);

    const before = Date.now();
    const result = await useCase.execute('comp-1', 'proc-1');
    const after = Date.now();

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const expires = result.expiresAt.getTime();
    expect(expires).toBeGreaterThanOrEqual(before + thirtyDaysMs - 1000);
    expect(expires).toBeLessThanOrEqual(after + thirtyDaysMs + 1000);
  });

  it('reutiliza o publicToken existente se o processo já foi publicado antes', async () => {
    const existing = makeProcess({ publicToken: 'token-existente', status: 'PUBLISHED' });
    prisma.quoteProcess.findUnique.mockResolvedValue(existing as any);
    prisma.quoteProcess.update.mockResolvedValue({} as any);

    const result = await useCase.execute('comp-1', 'proc-1');

    expect(result.publicToken).toBe('token-existente');
  });

  it('lança NotFoundException quando o processo não existe', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('comp-1', 'proc-1')).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando a empresa não é dona do processo', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);

    await expect(useCase.execute('outra-empresa', 'proc-1')).rejects.toThrow(ForbiddenException);
  });

  it('lança BadRequestException quando não há quotes READY para publicar', async () => {
    const process = makeProcess({
      quotes: [{ id: 'q1', status: QuoteStatus.PENDING_REVIEW }],
    });
    prisma.quoteProcess.findUnique.mockResolvedValue(process as any);

    await expect(useCase.execute('comp-1', 'proc-1')).rejects.toThrow(
      'Nenhuma cotação confirmada para publicar',
    );
  });

  it('quando quoteIds é informado, persiste publicQuoteIds no processo', async () => {
    const process = makeProcess({
      quotes: [
        { id: 'q1', status: QuoteStatus.READY },
        { id: 'q2', status: QuoteStatus.READY },
      ],
    });
    prisma.quoteProcess.findUnique.mockResolvedValue(process as any);
    prisma.quoteProcess.update.mockResolvedValue({} as any);

    await useCase.execute('comp-1', 'proc-1', ['q1']);

    expect(prisma.quoteProcess.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicQuoteIds: ['q1'],
        }),
      }),
    );
  });

  it('quando quoteIds não é informado, persiste todos os IDs READY como publicQuoteIds', async () => {
    const process = makeProcess({
      quotes: [
        { id: 'q1', status: QuoteStatus.READY },
        { id: 'q2', status: QuoteStatus.READY },
      ],
    });
    prisma.quoteProcess.findUnique.mockResolvedValue(process as any);
    prisma.quoteProcess.update.mockResolvedValue({} as any);

    await useCase.execute('comp-1', 'proc-1');

    expect(prisma.quoteProcess.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicQuoteIds: ['q1', 'q2'],
        }),
      }),
    );
  });

  it('lança BadRequestException quando quoteId especificado não é READY', async () => {
    const process = makeProcess({
      quotes: [
        { id: 'q1', status: QuoteStatus.READY },
        { id: 'q2', status: QuoteStatus.PENDING_REVIEW },
      ],
    });
    prisma.quoteProcess.findUnique.mockResolvedValue(process as any);

    await expect(useCase.execute('comp-1', 'proc-1', ['q1', 'q2'])).rejects.toThrow(BadRequestException);
  });

  it('lança BadRequestException quando quoteIds é array vazio', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);

    await expect(useCase.execute('comp-1', 'proc-1', [])).rejects.toThrow(
      'Nenhuma cotação confirmada para publicar',
    );
  });
});
