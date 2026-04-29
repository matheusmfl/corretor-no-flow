import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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

describe('GenerateLinkUseCase', () => {
  let useCase: GenerateLinkUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new GenerateLinkUseCase(prisma as unknown as PrismaService);
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
    expect(result.expiresAt).toBeInstanceOf(Date);
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
});
