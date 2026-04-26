import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CancelQuoteProcessUseCase } from './cancel-quote-process.use-case';
import { QuoteProcessStatus } from '../../domain/value-objects/quote-status.vo';

const makeProcess = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  companyId: 'c1',
  status: QuoteProcessStatus.DRAFT,
  ...overrides,
});

describe('CancelQuoteProcessUseCase', () => {
  let useCase: CancelQuoteProcessUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new CancelQuoteProcessUseCase(prisma as unknown as PrismaService);
  });

  it('lança NotFoundException quando processo não existe', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('c1', 'p1')).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando processo pertence a outra empresa', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ companyId: 'outra_empresa' }) as any,
    );

    await expect(useCase.execute('c1', 'p1')).rejects.toThrow(ForbiddenException);
  });

  it('lança BadRequestException quando processo já está ARCHIVED', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ status: QuoteProcessStatus.ARCHIVED }) as any,
    );

    await expect(useCase.execute('c1', 'p1')).rejects.toThrow(BadRequestException);
  });

  it('lança BadRequestException quando processo está PUBLISHED', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(
      makeProcess({ status: QuoteProcessStatus.PUBLISHED }) as any,
    );

    await expect(useCase.execute('c1', 'p1')).rejects.toThrow(BadRequestException);
  });

  it.each([
    QuoteProcessStatus.DRAFT,
    QuoteProcessStatus.PROCESSING,
    QuoteProcessStatus.PENDING_REVIEW,
    QuoteProcessStatus.READY,
  ])('cancela processo com status %s atualizando para ARCHIVED', async (status) => {
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess({ status }) as any);
    prisma.quoteProcess.update.mockResolvedValue(makeProcess({ status: QuoteProcessStatus.ARCHIVED }) as any);

    await useCase.execute('c1', 'p1');

    expect(prisma.quoteProcess.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: { status: QuoteProcessStatus.ARCHIVED },
      }),
    );
  });

  it('retorna o processo atualizado', async () => {
    const archived = makeProcess({ status: QuoteProcessStatus.ARCHIVED });
    prisma.quoteProcess.findUnique.mockResolvedValue(makeProcess() as any);
    prisma.quoteProcess.update.mockResolvedValue(archived as any);

    const result = await useCase.execute('c1', 'p1');

    expect(result).toEqual(archived);
  });
});
