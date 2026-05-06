import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RemoveQuoteFromProcessUseCase } from './remove-quote-from-process.use-case';

jest.mock('node:fs', () => {
  const actual = jest.requireActual('node:fs');
  return { ...actual, unlink: jest.fn() };
});

describe('RemoveQuoteFromProcessUseCase', () => {
  let useCase: RemoveQuoteFromProcessUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new RemoveQuoteFromProcessUseCase(prisma as unknown as PrismaService);
  });

  it('lança NotFoundException quando processo não existe', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('c1', 'p1', 'q1')).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando processo pertence a outra empresa', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue({
      id: 'p1',
      companyId: 'outra_empresa',
      quotes: [],
    } as any);

    await expect(useCase.execute('c1', 'p1', 'q1')).rejects.toThrow(ForbiddenException);
  });

  it('lança NotFoundException quando cotação não existe no processo', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue({
      id: 'p1',
      companyId: 'c1',
      quotes: [{ id: 'q2', originalFileKey: null }],
    } as any);

    await expect(useCase.execute('c1', 'p1', 'q1')).rejects.toThrow(NotFoundException);
  });

  it('deleta a cotação do processo', async () => {
    prisma.quoteProcess.findUnique.mockResolvedValue({
      id: 'p1',
      companyId: 'c1',
      quotes: [{ id: 'q1', originalFileKey: null }],
    } as any);
    prisma.quote.delete.mockResolvedValue({ id: 'q1' } as any);

    await useCase.execute('c1', 'p1', 'q1');

    expect(prisma.quote.delete).toHaveBeenCalledWith({ where: { id: 'q1' } });
  });
});

