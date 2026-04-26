import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReviewQuoteUseCase } from './review-quote.use-case';
import { QuoteStatus } from '../../domain/value-objects/quote-status.vo';

describe('ReviewQuoteUseCase', () => {
  let useCase: ReviewQuoteUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new ReviewQuoteUseCase(prisma as unknown as PrismaService);
  });

  it('lança NotFoundException quando cotação não existe', async () => {
    prisma.quote.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('c1', 'q1', {})).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando cotação pertence a outra empresa', async () => {
    prisma.quote.findUnique.mockResolvedValue({
      id: 'q1',
      process: { companyId: 'outra_empresa' },
    } as any);

    await expect(useCase.execute('c1', 'q1', {})).rejects.toThrow(ForbiddenException);
  });

  it('atualiza status para READY após revisão do corretor', async () => {
    prisma.quote.findUnique.mockResolvedValue({ id: 'q1', process: { companyId: 'c1' } } as any);
    prisma.quote.update.mockResolvedValue({ id: 'q1', status: 'READY' } as any);

    await useCase.execute('c1', 'q1', { name: 'Bradesco-Auto-Reduzida' });

    expect(prisma.quote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: QuoteStatus.READY }),
      }),
    );
  });

  it('persiste dados corrigidos pelo corretor junto com a revisão', async () => {
    const extractedData = { totalPremium: 1240, deductible: 3000 };
    prisma.quote.findUnique.mockResolvedValue({ id: 'q1', process: { companyId: 'c1' } } as any);
    prisma.quote.update.mockResolvedValue({ id: 'q1' } as any);

    await useCase.execute('c1', 'q1', { name: 'Bradesco-Auto-Reduzida', extractedData });

    expect(prisma.quote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Bradesco-Auto-Reduzida', extractedData }),
      }),
    );
  });
});
