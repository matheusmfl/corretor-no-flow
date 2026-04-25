import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetQuoteUseCase } from './get-quote.use-case';

describe('GetQuoteUseCase', () => {
  let useCase: GetQuoteUseCase;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    useCase = new GetQuoteUseCase(prisma as unknown as PrismaService);
  });

  it('lança NotFoundException quando cotação não existe', async () => {
    prisma.quote.findUnique.mockResolvedValue(null);

    await expect(useCase.execute('c1', 'q1')).rejects.toThrow(NotFoundException);
  });

  it('lança ForbiddenException quando cotação pertence a outra empresa', async () => {
    prisma.quote.findUnique.mockResolvedValue({ id: 'q1', companyId: 'outra_empresa' } as any);

    await expect(useCase.execute('c1', 'q1')).rejects.toThrow(ForbiddenException);
  });

  it('retorna a cotação quando empresa é a dona', async () => {
    const quote = { id: 'q1', companyId: 'c1', status: 'PENDING' };
    prisma.quote.findUnique.mockResolvedValue(quote as any);

    const result = await useCase.execute('c1', 'q1');

    expect(result).toEqual(quote);
  });
});
